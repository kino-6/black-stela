import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import ashSlimeTextureUrl from "../assets/dungeon/ash-slime.png";
import returnMarkerTextureUrl from "../assets/dungeon/return-marker.png";
import stoneFloorTextureUrl from "../assets/dungeon/stone-floor.jpg";
import stoneWallTextureUrl from "../assets/dungeon/stone-wall.jpg";
import woodDoorTextureUrl from "../assets/dungeon/wood-door.jpg";
import { getGridCellForRoom, getGridEdge, getRoom, isTraversableEdge, secretKey } from "../domain/scenario";
import type { Direction, GameState, ScenarioWorld } from "../domain/types";

interface DungeonViewProps {
  state: GameState;
  world: ScenarioWorld;
  label: string;
}

type EdgeVisual = "wall" | "open" | "door";
// Geometry distinguishes stairs from a plain opening; the view model (and its
// data-* attributes) keeps the coarser three-value language.
type EdgeKindVisual = "wall" | "open" | "door" | "stairs";

interface EdgeViewState {
  visual: EdgeVisual;
  traversable: boolean;
}

interface DungeonViewModel {
  front: EdgeVisual;
  left: EdgeVisual;
  right: EdgeVisual;
  frontTraversable: boolean;
}

interface CorridorSegment {
  index: number;
  left: EdgeKindVisual;
  right: EdgeKindVisual;
  /** Set on the final visible segment: what closes off the view ahead. */
  frontCap?: EdgeKindVisual;
}

export interface DungeonRenderLayout {
  roomDepth: number;
  roomCenterZ: number;
  frontWallZ: number;
  sideFeatureZ: number;
  frontDepth: "cell-edge" | "corridor";
}

// One grid cell is CELL deep; the camera stands in the current cell looking down
// the corridor, and successive cells recede toward the fog.
const CELL = 3.5;
const HALF_WIDTH = 4;
const WALL_HEIGHT = 3.2;
const WALL_MID_Y = 1.5;
const CEILING_Y = 3.1;
const MAX_DEPTH = 4;

export function DungeonView({ state, world, label }: DungeonViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewModel = useMemo(() => getDungeonViewModel(state, world), [state.position, state.discoveredSecrets, world]);
  const corridor = useMemo(
    () => projectCorridorAhead(state, world),
    [state.position, state.discoveredSecrets, world]
  );

  useEffect(() => {
    if (!mountRef.current || !state.position || !viewModel) {
      return;
    }

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d0e0b");
    scene.fog = new THREE.Fog("#0d0e0b", 6, 20);

    const camera = new THREE.PerspectiveCamera(66, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 2.4);
    camera.lookAt(0, 1.32, -6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    const textureLoader = new THREE.TextureLoader();
    const loadedTextures: THREE.Texture[] = [];
    const renderScene = () => renderer.render(scene, camera);
    const loadTexture = (url: string, repeat?: [number, number]) => {
      const texture = textureLoader.load(url, renderScene);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      if (repeat) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeat[0], repeat[1]);
      }
      loadedTextures.push(texture);
      return texture;
    };

    const wallTexture = loadTexture(stoneWallTextureUrl, [1.35, 1]);
    const floorTexture = loadTexture(stoneFloorTextureUrl, [2.1, 3.2]);
    const doorTexture = loadTexture(woodDoorTextureUrl);
    const ashSlimeTexture = loadTexture(ashSlimeTextureUrl);
    const returnMarkerTexture = loadTexture(returnMarkerTextureUrl);

    const ambient = new THREE.AmbientLight("#9a9383", 1.7);
    const torch = new THREE.PointLight("#f0b76c", 55, 26);
    torch.position.set(-1.5, 2.4, 1.6);
    const frontLight = new THREE.SpotLight("#ffe0a0", 30, 20, Math.PI / 6, 0.4, 1);
    frontLight.position.set(0, 2.8, 2.0);
    frontLight.target.position.set(0, 1.1, -6.4);
    scene.add(ambient, torch, frontLight, frontLight.target);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#59615a",
      map: wallTexture,
      roughness: 0.78,
      metalness: 0.02
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#2a2418",
      map: floorTexture,
      roughness: 0.86
    });
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: "#d2b184",
      map: doorTexture,
      roughness: 0.62,
      metalness: 0.08
    });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: "#c69a58", transparent: true, opacity: 0.78 });
    const hazardMaterial = new THREE.MeshStandardMaterial({
      color: "#b64b35",
      emissive: "#3a0905",
      roughness: 0.5
    });
    const enemyMaterial = new THREE.SpriteMaterial({ map: ashSlimeTexture, transparent: true, depthWrite: false });
    const enemyShadowMaterial = new THREE.MeshBasicMaterial({
      color: "#070504",
      transparent: true,
      opacity: 0.52,
      depthWrite: false
    });
    const returnMarkerMaterial = new THREE.SpriteMaterial({
      map: returnMarkerTexture,
      transparent: true,
      depthWrite: false
    });

    // Build the corridor cell by cell: floor and ceiling for every visible cell,
    // a solid wall or a door where the side is closed, and nothing where it is
    // open (the darkness beyond reads as a branching passage). The last segment
    // is capped by whatever blocks the view ahead.
    for (const segment of corridor) {
      const zCenter = -segment.index * CELL;

      const floorTile = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2, 0.2, CELL), floorMaterial);
      floorTile.position.set(0, -0.1, zCenter);
      scene.add(floorTile);

      const ceilingTile = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2, 0.2, CELL), wallMaterial);
      ceilingTile.position.set(0, CEILING_Y, zCenter);
      scene.add(ceilingTile);

      addSideFeature(scene, wallMaterial, doorMaterial, edgeMaterial, "left", segment.left, zCenter);
      addSideFeature(scene, wallMaterial, doorMaterial, edgeMaterial, "right", segment.right, zCenter);

      if (segment.frontCap) {
        addFrontCap(scene, wallMaterial, doorMaterial, floorMaterial, edgeMaterial, segment.frontCap, zCenter);
      }
    }

    const room = getRoom(world, state.position.roomId);

    if (state.phase === "combat" && state.combat) {
      const enemyShadow = new THREE.Mesh(new THREE.CircleGeometry(1.22, 32), enemyShadowMaterial);
      enemyShadow.position.set(0, 0.035, -2.86);
      enemyShadow.rotation.x = -Math.PI / 2;
      enemyShadow.scale.set(1.85, 0.55, 1);
      scene.add(enemyShadow);

      const enemy = new THREE.Sprite(enemyMaterial);
      enemy.center.set(0.5, 0.38);
      enemy.position.set(0, 0.74, -2.82);
      enemy.scale.set(4.35, 2.82, 1);
      scene.add(enemy);
    }

    if (room.trap && !state.resolvedTraps.includes(room.trap.id)) {
      const trap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 3), hazardMaterial);
      trap.position.set(0, 0.04, -1.5);
      trap.rotation.y = Math.PI / 3;
      scene.add(trap);
    }

    if (room.stairsToTown) {
      // The floor-1 entrance is a literal stairway up to town; other return
      // points are the mystical waystone sprite.
      if (room.returnStyle === "stairs") {
        scene.add(createReturnStairs(floorMaterial, edgeMaterial));
      } else {
        scene.add(createReturnMarker(returnMarkerMaterial));
      }
    }

    renderScene();

    return () => {
      loadedTextures.forEach((texture) => texture.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [state.position, state.phase, state.combat?.enemy.id, state.resolvedTraps, corridor, viewModel, world]);

  return (
    <div className="dungeon-view" aria-label={label}>
      <div
        ref={mountRef}
        className="dungeon-canvas"
        data-front-edge={viewModel?.front ?? "unknown"}
        data-front-traversable={viewModel?.frontTraversable ? "true" : "false"}
        data-front-visual={viewModel?.front === "wall" ? "blocked-wall" : viewModel?.front ?? "unknown"}
        data-front-depth={viewModel ? getDungeonRenderLayout(viewModel).frontDepth : "unknown"}
        data-left-edge={viewModel?.left ?? "unknown"}
        data-right-edge={viewModel?.right ?? "unknown"}
        data-testid="dungeon-canvas"
      />
    </div>
  );
}

export function getDungeonRenderLayout(viewModel: DungeonViewModel): DungeonRenderLayout {
  const frontIsCurrentCellBoundary = viewModel.front === "wall" || viewModel.front === "door";

  return {
    roomDepth: frontIsCurrentCellBoundary ? 5.8 : 12,
    roomCenterZ: frontIsCurrentCellBoundary ? 1.55 : -1,
    frontWallZ: frontIsCurrentCellBoundary ? -1.32 : -7,
    sideFeatureZ: 1.05,
    frontDepth: frontIsCurrentCellBoundary ? "cell-edge" : "corridor"
  };
}

export function getDungeonViewModel(state: GameState, world: ScenarioWorld): DungeonViewModel | null {
  if (!state.position) {
    return null;
  }

  const room = getRoom(world, state.position.roomId);
  const hasGridCell = Boolean(getGridCellForRoom(world, state.position.roomId));
  const secrets = state.discoveredSecrets;
  const front = getEdgeViewState(world, room.id, state.position.facing, hasGridCell, room, secrets);
  const left = getEdgeViewState(world, room.id, turn(state.position.facing, "left"), hasGridCell, room, secrets);
  const right = getEdgeViewState(world, room.id, turn(state.position.facing, "right"), hasGridCell, room, secrets);

  return {
    front: front.visual,
    left: left.visual,
    right: right.visual,
    frontTraversable: front.traversable
  };
}

function getEdgeViewState(
  world: ScenarioWorld,
  roomId: string,
  direction: Direction,
  hasGridCell: boolean,
  room: ReturnType<typeof getRoom>,
  discoveredSecrets: string[]
): EdgeViewState {
  const edge = getGridEdge(world, roomId, direction);
  if (edge) {
    if (edge.kind === "door" || edge.kind === "locked") {
      return { visual: "door", traversable: isTraversableEdge(edge) };
    }

    // A hidden passage stays wall-blank until searched out; once found it reads
    // as a doorway, matching the minimap and never leaking the secret early.
    if (edge.kind === "secret") {
      return discoveredSecrets.includes(secretKey(roomId, direction))
        ? { visual: "door", traversable: true }
        : { visual: "wall", traversable: false };
    }

    return isTraversableEdge(edge)
      ? { visual: "open", traversable: true }
      : { visual: "wall", traversable: false };
  }

  if (hasGridCell) {
    return { visual: "wall", traversable: false };
  }

  if (room.doors?.includes(direction)) {
    return { visual: "door", traversable: Boolean(room.exits[direction]) };
  }

  return room.exits[direction]
    ? { visual: "open", traversable: true }
    : { visual: "wall", traversable: false };
}

// Walk forward through open edges, collecting the cells the party can see down
// the corridor along with each cell's side walls, until a wall/door/stairs (or
// the depth limit) closes the view.
export function projectCorridorAhead(state: GameState, world: ScenarioWorld): CorridorSegment[] {
  if (!state.position) {
    return [];
  }

  const facing = state.position.facing;
  const leftDir = turn(facing, "left");
  const rightDir = turn(facing, "right");
  const segments: CorridorSegment[] = [];
  let roomId: string | undefined = state.position.roomId;

  for (let index = 0; index < MAX_DEPTH && roomId; index += 1) {
    const left = geometryEdgeKind(world, roomId, leftDir, state.discoveredSecrets);
    const right = geometryEdgeKind(world, roomId, rightDir, state.discoveredSecrets);
    const front = geometryEdgeKind(world, roomId, facing, state.discoveredSecrets);
    const forwardEdge = getGridEdge(world, roomId, facing);
    const canContinue = front === "open" && Boolean(forwardEdge?.targetRoomId) && index < MAX_DEPTH - 1;

    if (canContinue) {
      segments.push({ index, left, right });
      roomId = forwardEdge?.targetRoomId;
    } else {
      segments.push({ index, left, right, frontCap: front });
      break;
    }
  }

  return segments;
}

function geometryEdgeKind(
  world: ScenarioWorld,
  roomId: string,
  direction: Direction,
  discoveredSecrets: string[]
): EdgeKindVisual {
  const edge = getGridEdge(world, roomId, direction);
  if (!edge) {
    if (!getGridCellForRoom(world, roomId)) {
      const room = getRoom(world, roomId);
      if (room.doors?.includes(direction)) {
        return "door";
      }
      return room.exits[direction] ? "open" : "wall";
    }
    return "wall";
  }

  switch (edge.kind) {
    case "door":
    case "locked":
      return "door";
    case "secret":
      return discoveredSecrets.includes(secretKey(roomId, direction)) ? "door" : "wall";
    case "stairs":
      return "stairs";
    case "open":
    case "one_way":
    case "shortcut":
      return isTraversableEdge(edge) ? "open" : "wall";
    default:
      return "wall";
  }
}

function addSideFeature(
  scene: THREE.Scene,
  wallMaterial: THREE.Material,
  doorMaterial: THREE.Material,
  edgeMaterial: THREE.Material,
  side: "left" | "right",
  kind: EdgeKindVisual,
  zCenter: number
) {
  const x = side === "left" ? -HALF_WIDTH : HALF_WIDTH;

  // Open (and stairs) sides are left as gaps so the passage beyond is visible.
  if (kind === "open" || kind === "stairs") {
    return;
  }

  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.25, WALL_HEIGHT, CELL), wallMaterial);
  wall.position.set(x, WALL_MID_Y, zCenter);
  scene.add(wall);

  if (kind === "door") {
    const door = createSideDoor(doorMaterial, edgeMaterial);
    door.position.set(side === "left" ? x + 0.14 : x - 0.14, 1.06, zCenter);
    door.rotation.y = side === "left" ? Math.PI / 2 : -Math.PI / 2;
    scene.add(door);
  }
}

function addFrontCap(
  scene: THREE.Scene,
  wallMaterial: THREE.Material,
  doorMaterial: THREE.Material,
  floorMaterial: THREE.Material,
  edgeMaterial: THREE.Material,
  kind: EdgeKindVisual,
  zCenter: number
) {
  // The view fades into fog when the corridor runs past the depth limit.
  if (kind === "open") {
    return;
  }

  const z = zCenter - CELL / 2;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2, WALL_HEIGHT, 0.25), wallMaterial);
  wall.position.set(0, WALL_MID_Y, z);
  scene.add(wall);
  addStoneCourses(scene, wallMaterial, z);

  if (kind === "door") {
    const door = createDoor(doorMaterial, edgeMaterial);
    door.position.set(0, 1.15, z + 0.14);
    scene.add(door);
  } else if (kind === "stairs") {
    scene.add(createStairs(floorMaterial, edgeMaterial, z));
  }
}

function createDoor(material: THREE.Material, edgeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.62, 0.2), material);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.25, 2.72, 0.24)), edgeMaterial);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.025, 8, 18),
    new THREE.MeshBasicMaterial({ color: "#efc16d" })
  );
  handle.position.set(0.62, 0.05, 0.14);
  group.add(slab, frame, handle);
  return group;
}

function createSideDoor(material: THREE.Material, edgeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.2, 0.16), material);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.45, 2.3, 0.2)), edgeMaterial);
  group.add(slab, frame);
  return group;
}

function createStairs(stepMaterial: THREE.Material, edgeMaterial: THREE.Material, z: number) {
  const group = new THREE.Group();
  const stepCount = 5;
  for (let index = 0; index < stepCount; index += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 0.46), stepMaterial);
    step.position.set(0, 0.12 + index * 0.26, z + 1.4 - index * 0.46);
    group.add(step);
  }
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3.3, stepCount * 0.26, 0.05)),
    edgeMaterial
  );
  frame.position.set(0, stepCount * 0.13, z + 0.2);
  group.add(frame);
  return group;
}

function createReturnMarker(material: THREE.SpriteMaterial) {
  const marker = new THREE.Sprite(material);
  marker.position.set(0, 0.92, 0.4);
  marker.scale.set(1.6, 2.15, 1);
  return marker;
}

// A stairway up to town, set against the near-left of the cell so it reads as
// "the way back" without blocking the corridor ahead.
function createReturnStairs(stepMaterial: THREE.Material, edgeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const stepCount = 6;
  for (let index = 0; index < stepCount; index += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.26, 0.5), stepMaterial);
    step.position.set(0, 0.13 + index * 0.28, 1.1 - index * 0.42);
    group.add(step);
  }
  const rail = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, stepCount * 0.28, 0.04)),
    edgeMaterial
  );
  rail.position.set(0, stepCount * 0.14, 1.1 - ((stepCount - 1) / 2) * 0.42);
  group.add(rail);
  group.position.set(-2.4, 0, 0.6);
  return group;
}

function addStoneCourses(scene: THREE.Scene, material: THREE.Material, z: number) {
  for (let index = 0; index < 5; index += 1) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.025, 0.035), material);
    line.position.set(0, 0.62 + index * 0.48, z + 0.16);
    scene.add(line);
  }
}

function turn(facing: Direction, side: "left" | "right"): Direction {
  const directions: Direction[] = ["north", "east", "south", "west"];
  const index = directions.indexOf(facing);
  return directions[(index + (side === "left" ? 3 : 1)) % directions.length];
}
