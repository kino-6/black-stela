import * as THREE from "three";
import { asset, blockTextures, getEnemySpriteTextureUrl } from "../ui/artAssets";
import type { EnemyElevation, ScenePalette } from "../domain/types";

const DEFAULT_ART_PACK = "default";

// Geometry distinguishes stairs from a plain opening; the view model keeps the
// coarser three-value language. Both the projection (DungeonView) and this
// renderer speak `EdgeKindVisual`, so it lives with the rendering contract.
export type EdgeKindVisual = "wall" | "open" | "door" | "stairs";

export interface CorridorSegment {
  index: number;
  left: EdgeKindVisual;
  right: EdgeKindVisual;
  /** Set on the final visible segment: what closes off the view ahead. */
  frontCap?: EdgeKindVisual;
}

export interface DungeonSceneInput {
  corridor: CorridorSegment[];
  /** Active art pack (world.assetPack). Passed explicitly so the renderer never
   *  depends on the resolver's module-level active-pack state, which resolves too
   *  early (at import) and can drift from the world actually being played. */
  assetPack?: string;
  /** Per-scenario scene colour (world.palette). Omitted → the default ash palette. */
  palette?: ScenePalette;
  /** Current dungeon floor id for block-specific wall/floor textures. */
  floorId: string | null;
  /** Enemy groups to draw ahead while in combat (one sprite per living group, so a
   *  multi-type fight shows every kind). Empty when not in combat. */
  enemies: { id: string; elevation?: EnemyElevation }[];
  /** Draw the hazard marker on the floor (armed trap in this room). */
  showTrap: boolean;
  /** Draw the town-return feature: the entrance stairway or the waystone. */
  returnMarker: "stairs" | "marker" | null;
  /** When the faced edge is a stair: true = descends (down to a deeper floor),
   *  false = ascends (up), null = not a stair. Drives the up/down stair visual. */
  stairDescends?: boolean | null;
  /** Corridor index of the first wall ahead (-1/omitted if the view runs open),
   *  used to keep the combat enemy sprite in front of a close wall. */
  frontWallIndex?: number;
}

// One grid cell is CELL deep; the camera stands in the current cell looking down
// the corridor, and successive cells recede toward the fog.
const CELL = 3.5;
const HALF_WIDTH = 4;
const WALL_HEIGHT = 3.2;
const WALL_MID_Y = 1.5;
const CEILING_Y = 3.1;

// Build the first-person Three.js scene into `mount` and render one frame.
// Returns a disposer that tears down textures, the renderer, and the canvas.
export function buildDungeonScene(mount: HTMLDivElement, input: DungeonSceneInput): () => void {
  const width = mount.clientWidth;
  const height = mount.clientHeight;

  // Scene colour is per-scenario. The wall/floor values TINT the block texture, so a
  // world reads as its own place (ash ruin vs. drowned green canopy) even while it
  // still falls back to another pack's textures. Defaults are the ash palette.
  const ASH: Required<ScenePalette> = {
    fog: "#0d0e0b",
    ambient: "#9a9383",
    torch: "#f0b76c",
    front: "#ffe0a0",
    wall: "#59615a",
    floor: "#2a2418"
  };
  const p: Required<ScenePalette> = { ...ASH, ...(input.palette ?? {}) };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(p.fog);
  scene.fog = new THREE.Fog(p.fog, 6, 20);

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

  const pack = input.assetPack ?? DEFAULT_ART_PACK;
  const dungeonTextures = getDungeonBlockTextureUrls(input.floorId, pack);
  const wallTexture = loadTexture(dungeonTextures.wall, [1.35, 1]);
  const floorTexture = loadTexture(dungeonTextures.floor, [2.1, 3.2]);
  const doorTexture = loadTexture(asset("wood-door", pack));
  const returnMarkerTexture = loadTexture(asset("return-marker", pack));

  const ambient = new THREE.AmbientLight(p.ambient, 1.7);
  const torch = new THREE.PointLight(p.torch, 55, 26);
  torch.position.set(-1.5, 2.4, 1.6);
  const frontLight = new THREE.SpotLight(p.front, 30, 20, Math.PI / 6, 0.4, 1);
  frontLight.position.set(0, 2.8, 2.0);
  frontLight.target.position.set(0, 1.1, -6.4);
  scene.add(ambient, torch, frontLight, frontLight.target);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: p.wall,
    map: wallTexture,
    roughness: 0.78,
    metalness: 0.02
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: p.floor,
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
  for (const segment of input.corridor) {
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
      addFrontCap(scene, wallMaterial, doorMaterial, floorMaterial, edgeMaterial, segment.frontCap, zCenter, input.stairDescends ?? false);
    }
  }

  if (input.enemies.length > 0) {
    // Stand the enemies in the visible space ahead, ALWAYS in front of the nearest
    // wall — a fixed depth would sink them behind a close dead-end wall (near z=0),
    // making them vanish. The closer they stand, the smaller they draw, and their
    // feet always meet the floor plane. Multiple groups spread across the corridor
    // (and shrink a touch) so every distinct enemy type is visible, not just one.
    const frontWallIndex = input.frontWallIndex ?? -1;
    const wallZ = frontWallIndex >= 0 ? -frontWallIndex * CELL : -Infinity;
    const enemyZ = frontWallIndex >= 0 ? Math.min(-1.4, Math.max(-2.82, wallZ + 1.4)) : -2.82;
    const distanceScale = Math.min(1, Math.max(0.55, Math.abs(enemyZ) / 2.82 + 0.12));
    const count = input.enemies.length;
    const crowd = count > 1 ? 0.72 : 1; // shrink when several share the corridor
    const spread = count > 1 ? 2.4 : 0; // horizontal gap between adjacent groups
    const feetY = 0.05;
    const centerY = 0.38;

    input.enemies.forEach((group, index) => {
      const texture = loadTexture(getEnemySpriteTextureUrl(group.id, pack));
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const elevation = group.elevation ?? "ground";
      const lift = elevation === "air" ? 1.7 : elevation === "mid" ? 0.9 : 0;
      const scaleY = 2.82 * distanceScale * crowd;
      const scaleX = 4.35 * distanceScale * crowd;
      const offsetX = (index - (count - 1) / 2) * spread;

      if (elevation !== "air") {
        const shadowScale = (elevation === "mid" ? 0.72 : 1) * distanceScale * crowd;
        enemyShadowMaterial.opacity = elevation === "mid" ? 0.3 : 0.52;
        const enemyShadow = new THREE.Mesh(new THREE.CircleGeometry(1.22, 32), enemyShadowMaterial.clone());
        enemyShadow.position.set(offsetX, 0.035, enemyZ - 0.04);
        enemyShadow.rotation.x = -Math.PI / 2;
        enemyShadow.scale.set(1.85 * shadowScale, 0.55 * shadowScale, 1);
        scene.add(enemyShadow);
      }

      const enemy = new THREE.Sprite(material);
      enemy.center.set(0.5, centerY);
      enemy.position.set(offsetX, feetY + centerY * scaleY + lift, enemyZ);
      enemy.scale.set(scaleX, scaleY, 1);
      scene.add(enemy);
    });
  }

  if (input.showTrap) {
    const trap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 3), hazardMaterial);
    trap.position.set(0, 0.04, -1.5);
    trap.rotation.y = Math.PI / 3;
    scene.add(trap);
  }

  if (input.returnMarker) {
    // The floor-1 entrance is a literal stairway up to town; other return points
    // are the mystical waystone sprite.
    if (input.returnMarker === "stairs") {
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
}

export function getDungeonBlockTextureUrls(floorId: string | null, pack: string = DEFAULT_ART_PACK) {
  const blocks = blockTextures(pack);
  if (floorId && /b[7-8]f/i.test(floorId)) {
    return blocks.block3;
  }

  if (floorId && /b[4-6]f/i.test(floorId)) {
    return blocks.block2;
  }

  if (floorId && /b[1-3]f/i.test(floorId)) {
    return blocks.block1;
  }

  return { wall: asset("stone-wall", pack), floor: asset("stone-floor", pack) };
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
  zCenter: number,
  descends = false
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
    scene.add(createStairs(floorMaterial, edgeMaterial, z, descends));
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

// A flight of stairs ahead. Ascending (up to the previous floor) rises away from the
// party; descending (down to the next floor) drops away and sinks below the floor,
// so up and down read as clearly different at a glance.
function createStairs(stepMaterial: THREE.Material, edgeMaterial: THREE.Material, z: number, descends = false) {
  const group = new THREE.Group();
  const stepCount = 5;
  for (let index = 0; index < stepCount; index += 1) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 0.46), stepMaterial);
    // Ascending: each receding step rises. Descending: each receding step drops
    // below the floor plane, cutting a stairwell down into the stone.
    const y = descends ? -0.02 - index * 0.3 : 0.12 + index * 0.26;
    step.position.set(0, y, z + 1.4 - index * 0.46);
    group.add(step);
  }
  const frameHeight = stepCount * (descends ? 0.3 : 0.26);
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3.3, frameHeight, 0.05)),
    edgeMaterial
  );
  frame.position.set(0, descends ? -frameHeight / 2 : stepCount * 0.13, z + 0.2);
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
