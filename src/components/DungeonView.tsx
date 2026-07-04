import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import ashSlimeTextureUrl from "../assets/dungeon/ash-slime.png";
import returnMarkerTextureUrl from "../assets/dungeon/return-marker.png";
import stoneFloorTextureUrl from "../assets/dungeon/stone-floor.jpg";
import stoneWallTextureUrl from "../assets/dungeon/stone-wall.jpg";
import woodDoorTextureUrl from "../assets/dungeon/wood-door.jpg";
import { getGridCellForRoom, getGridEdge, getRoom, isTraversableEdge } from "../domain/scenario";
import type { Direction, GameState, ScenarioWorld } from "../domain/types";

interface DungeonViewProps {
  state: GameState;
  world: ScenarioWorld;
  label: string;
}

type EdgeVisual = "wall" | "open" | "door";

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

export function DungeonView({ state, world, label }: DungeonViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewModel = useMemo(() => getDungeonViewModel(state, world), [state.position, world]);

  useEffect(() => {
    if (!mountRef.current || !state.position || !viewModel) {
      return;
    }

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#11120f");
    scene.fog = new THREE.Fog("#11120f", 8, 22);

    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 4.5);
    camera.lookAt(0, 1.3, -4);

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

    const ambient = new THREE.AmbientLight("#9a9383", 1.8);
    const torch = new THREE.PointLight("#f0b76c", 58, 26);
    torch.position.set(-1.5, 2.4, 2.2);
    const frontLight = new THREE.SpotLight("#ffe0a0", 34, 18, Math.PI / 6, 0.4, 1);
    frontLight.position.set(0, 2.8, 2.8);
    frontLight.target.position.set(0, 1.1, -5.4);
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
    const returnMarkerMaterial = new THREE.SpriteMaterial({
      map: returnMarkerTexture,
      transparent: true,
      depthWrite: false
    });

    const blockedFront = viewModel.front === "wall";
    const roomDepth = blockedFront ? 8 : 12;
    const roomCenterZ = blockedFront ? 0.8 : -1;
    const frontWallZ = blockedFront ? -3.15 : -7;

    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, roomDepth), floorMaterial);
    floor.position.set(0, -0.1, roomCenterZ);
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, roomDepth), wallMaterial);
    ceiling.position.set(0, 3.1, roomCenterZ);
    scene.add(ceiling);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, roomDepth), wallMaterial);
    leftWall.position.set(-4, 1.5, roomCenterZ);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, roomDepth), wallMaterial);
    rightWall.position.set(4, 1.5, roomCenterZ);
    scene.add(rightWall);

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.25), wallMaterial);
    frontWall.position.set(0, 1.5, frontWallZ);
    scene.add(frontWall);

    const room = getRoom(world, state.position.roomId);
    if (viewModel.front === "door") {
      const door = createDoor(doorMaterial, edgeMaterial);
      door.position.set(0, 1.15, frontWallZ + 0.12);
      scene.add(door);
    } else if (viewModel.front === "open") {
      const opening = createFrontOpening(floorMaterial, edgeMaterial);
      opening.position.set(0, 1.12, frontWallZ + 0.12);
      scene.add(opening);
    }

    if (viewModel.left !== "wall") {
      const leftFeature =
        viewModel.left === "door"
          ? createSideDoor(doorMaterial, edgeMaterial)
          : createSideOpening(floorMaterial, edgeMaterial);
      leftFeature.position.set(-3.86, 1.06, blockedFront ? -1.2 : -2.7);
      leftFeature.rotation.y = Math.PI / 2;
      scene.add(leftFeature);
    }
    if (viewModel.right !== "wall") {
      const rightFeature =
        viewModel.right === "door"
          ? createSideDoor(doorMaterial, edgeMaterial)
          : createSideOpening(floorMaterial, edgeMaterial);
      rightFeature.position.set(3.86, 1.06, blockedFront ? -1.2 : -2.7);
      rightFeature.rotation.y = -Math.PI / 2;
      scene.add(rightFeature);
    }

    if (state.phase === "combat" && state.combat) {
      const enemy = new THREE.Sprite(enemyMaterial);
      enemy.position.set(0, 1.12, -3.2);
      enemy.scale.set(3.85, 2.55, 1);
      scene.add(enemy);
    }

    if (room.trap && !state.resolvedTraps.includes(room.trap.id)) {
      const trap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 3), hazardMaterial);
      trap.position.set(0, 0.04, -2.15);
      trap.rotation.y = Math.PI / 3;
      scene.add(trap);
    }

    if (room.stairsToTown) {
      scene.add(createReturnMarker(returnMarkerMaterial));
    }

    addStoneCourses(scene, wallMaterial, frontWallZ);

    renderScene();

    return () => {
      loadedTextures.forEach((texture) => texture.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [state.position, state.phase, state.combat?.enemy.id, state.resolvedTraps, viewModel, world]);

  return (
    <div className="dungeon-view" aria-label={label}>
      <div
        ref={mountRef}
        className="dungeon-canvas"
        data-front-edge={viewModel?.front ?? "unknown"}
        data-front-traversable={viewModel?.frontTraversable ? "true" : "false"}
        data-left-edge={viewModel?.left ?? "unknown"}
        data-right-edge={viewModel?.right ?? "unknown"}
        data-testid="dungeon-canvas"
      />
    </div>
  );
}

export function getDungeonViewModel(state: GameState, world: ScenarioWorld): DungeonViewModel | null {
  if (!state.position) {
    return null;
  }

  const room = getRoom(world, state.position.roomId);
  const hasGridCell = Boolean(getGridCellForRoom(world, state.position.roomId));
  const front = getEdgeViewState(world, room.id, state.position.facing, hasGridCell, room);
  const left = getEdgeViewState(world, room.id, turn(state.position.facing, "left"), hasGridCell, room);
  const right = getEdgeViewState(world, room.id, turn(state.position.facing, "right"), hasGridCell, room);

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
  room: ReturnType<typeof getRoom>
): EdgeViewState {
  const edge = getGridEdge(world, roomId, direction);
  if (edge) {
    if (edge.kind === "door" || edge.kind === "locked" || edge.kind === "secret") {
      return { visual: "door", traversable: isTraversableEdge(edge) };
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

function createFrontOpening(material: THREE.Material, edgeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const voidPanel = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.35, 0.06), material);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.7, 2.5, 0.08)), edgeMaterial);
  voidPanel.position.set(0, 0, 0.01);
  group.add(voidPanel, frame);
  return group;
}

function createSideDoor(material: THREE.Material, edgeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.2, 0.16), material);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.45, 2.3, 0.2)), edgeMaterial);
  group.add(slab, frame);
  return group;
}

function createSideOpening(material: THREE.Material, edgeMaterial: THREE.Material) {
  const group = new THREE.Group();
  const voidPanel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.18, 0.14), material);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.58, 2.32, 0.18)), edgeMaterial);
  group.add(voidPanel, frame);
  return group;
}

function createReturnMarker(material: THREE.SpriteMaterial) {
  const marker = new THREE.Sprite(material);
  marker.position.set(0, 0.92, 0.88);
  marker.scale.set(1.75, 2.35, 1);
  return marker;
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
