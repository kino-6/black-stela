import * as THREE from "three";
import { asset, assetOrNull, blockTextures, getEnemySpriteTextureUrl } from "../ui/artAssets";
import type { EnemyElevation, EnemySize, ScenePalette } from "../domain/types";
import { calculateCombatFraming, CORRIDOR_HALF_WIDTH, ENEMY_WORLD_HEIGHT, MAX_FIGURES_BY_SIZE } from "../ui/combatFraming";
import { getSpriteMetrics, measureSpriteMetrics } from "../ui/spriteMetrics";

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
  /** Living enemy groups to draw ahead while in combat. `count` figures are drawn per
   *  group — a pack of three is three creatures, not one sprite and a "×3". Empty when
   *  not in combat. */
  enemies: {
    id: string;
    /** Combat group id, so the UI overlay can be anchored back to the right group. */
    groupId?: string;
    count?: number;
    /** COMBAT line: air/mid groups are shielded from melee behind a standing ground group. */
    elevation?: EnemyElevation;
    /** PRESENTATION only: draw it off the floor. Does not change what melee can reach. */
    hover?: boolean;
    size?: EnemySize;
  }[];
  /** Called with each group's foot position in screen % of the canvas, so the combat UI
   *  can plant the name/HP overlay on the creatures themselves. */
  onEnemyAnchors?: (anchors: EnemyAnchor[]) => void;
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
const HALF_WIDTH = CORRIDOR_HALF_WIDTH;
const WALL_HEIGHT = 3.2;
const WALL_MID_Y = 1.5;
const CEILING_Y = 3.1;

const SHADOW_GEOMETRY_RADIUS = 1.22;

/** Where a group's figures stand on screen, as a % of the canvas box (0–100). */
export interface EnemyAnchor {
  groupId: string;
  /** Horizontal centre of the group's figures. */
  xPct: number;
  /** The floor line under them — where a name/HP overlay should sit. */
  yPct: number;
}

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  mount.appendChild(renderer.domElement);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  const textureLoader = new THREE.TextureLoader();
  const loadedTextures: THREE.Texture[] = [];
  const renderScene = () => renderer.render(scene, camera);
  const loadTexture = (url: string, repeat?: [number, number], onLoad?: (texture: THREE.Texture) => void) => {
    const texture = textureLoader.load(url, (loaded) => {
      onLoad?.(loaded);
      renderScene();
    });
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

  // P6 stair props are OPTIONAL art: a pack that ships none falls back to the geometry
  // stair. Loaded lazily so a corridor with no stair cap pays nothing.
  const stairCache = new Map<string, THREE.Texture | undefined>();
  const stairTextureFor = (descends: boolean): THREE.Texture | undefined => {
    const name = descends ? "stair-down" : "stair-up";
    if (!stairCache.has(name)) {
      const url = getStairTextureUrl(pack, descends);
      stairCache.set(name, url ? loadTexture(url) : undefined);
    }
    return stairCache.get(name);
  };

  mount.dataset.returnVisual = "none";
  mount.dataset.frontStairVisual = "none";
  mount.dataset.frontStairPlacement = "none";

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
      if (segment.frontCap === "stairs") {
        const usesStairAsset = Boolean(stairTextureFor(input.stairDescends ?? false));
        mount.dataset.frontStairVisual = usesStairAsset ? "asset" : "geometry";
        mount.dataset.frontStairPlacement = usesStairAsset
          ? input.stairDescends ? "floor" : "upright"
          : "geometry";
      }
      addFrontCap(
        scene,
        wallMaterial,
        doorMaterial,
        floorMaterial,
        edgeMaterial,
        segment.frontCap,
        zCenter,
        input.stairDescends ?? false,
        stairTextureFor
      );
    }
  }

  if (input.enemies.length > 0) {
    // Stand the enemies in the visible space ahead, ALWAYS in front of the nearest wall —
    // a fixed depth would sink them behind a close dead-end wall (near z=0), making them
    // vanish.
    //
    // Every enemy is drawn at its TRUE size, standing on the floor:
    //  · the silhouette is measured from the art's alpha (ui/spriteMetrics), so the
    //    subject's real feet meet the floor no matter how the file was padded, and
    //  · its real height is scaled to the creature's world size (Enemy.size), so a mite
    //    and a boss are not the same creature wearing different pixels.
    // A group of N draws N figures — the count is a fact about the fight, not a number
    // on a card.
    // They stand CLOSE. The old depth (5.2m from the eye) is conversational distance, not
    // fighting distance — it left even a boss occupying a third of the frame, which is why
    // the art read as small. Closing to ~4m lets perspective do the work: a huge creature
    // now fills most of the passage and a mite still comes up to your knee.
    const stagedGroups = input.enemies.map((group, groupIndex) => {
      const metrics = getSpriteMetrics(getEnemySpriteTextureUrl(group.id, pack));
      return {
        group,
        groupId: group.groupId ?? `${groupIndex}`,
        bodyAspect: metrics
          ? (metrics.imageAspect * metrics.widthFrac) / Math.max(0.08, metrics.heightFrac)
          : 0.8
      };
    });
    const framing = calculateCombatFraming(
      width,
      height,
      stagedGroups.map(({ group, groupId, bodyAspect }) => ({
        groupId,
        size: group.size,
        count: Math.max(1, Math.min(group.count ?? 1, MAX_FIGURES_BY_SIZE[group.size ?? "medium"])),
        bodyAspect
      }))
    );
    mount.dataset.combatFormationWidth = `${Math.round(framing.formationWidthPx)}`;
    mount.dataset.combatMinimumSilhouette = `${Math.round(framing.minimumSilhouetteHeightPx)}`;
    mount.dataset.combatMaximumBodyEdge = `${framing.maximumBodyEdgeWorld.toFixed(3)}`;
    const frontWallIndex = input.frontWallIndex ?? -1;
    const wallZ = frontWallIndex >= 0 ? -frontWallIndex * CELL - CELL / 2 : -Infinity;
    const figures = framing.figures.map((figure) => {
      const staged = stagedGroups.find((candidate) => candidate.groupId === figure.groupId)!;
      return { ...figure, ...staged };
    });

    const anchors = new Map<string, { xSum: number; n: number; z: number; baseY: number }>();

    figures.forEach(({ group, groupId, x, z: framedZ }) => {
      const url = getEnemySpriteTextureUrl(group.id, pack);
      const offsetX = x;
      // Never place a figure behind the wall that closes the current view.
      const z = Math.max(framedZ, wallZ + 0.65);
      const elevation = group.elevation ?? "ground";
      // A creature leaves the floor either because it is tactically out of reach (elevation) or
      // simply because it flies (hover). The second is a picture; the first is a rule.
      const lift = elevation === "air" ? 1.7 : elevation === "mid" ? 0.9 : group.hover ? 0.75 : 0;
      const airborne = elevation === "air" || (group.hover && elevation === "ground");
      const worldHeight = ENEMY_WORLD_HEIGHT[group.size ?? "medium"];

      // A THREE texture has no `.image` until it loads, so the silhouette can only be
      // measured from the loader's callback — and the FIRST fight in a session always
      // takes that path. Placement is re-applied there; until then the sprite is drawn
      // whole-frame, which is right for art with no padding and close enough for a frame.
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: loadTexture(url, undefined, (loaded) => {
            if (loaded.image?.width) {
              measureSpriteMetrics(url, loaded.image as HTMLImageElement);
              place();
            }
          }),
          transparent: true,
          depthWrite: false
        })
      );
      scene.add(sprite);

      function place() {
        const m = getSpriteMetrics(url);
        const heightFrac = m ? Math.max(0.08, m.heightFrac) : 1;
        // Scale the CREATURE (not the canvas) to its world height, so padding in the file
        // cannot shrink it.
        const planeHeight = worldHeight / heightFrac;
        const planeWidth = planeHeight * (m?.imageAspect ?? 1);
        sprite.scale.set(planeWidth, planeHeight, 1);
        // Anchor at the subject's real feet and horizontal centre, so placing the sprite at
        // floor level puts the CREATURE on the floor — whatever the padding.
        sprite.center.set(m?.centerXFrac ?? 0.5, m?.bottomFrac ?? 0);
        sprite.position.set(offsetX, lift, z);
      }
      place();

      // Contact shadow, sized to the creature's MEASURED footprint rather than a constant, so
      // a mite gets a mite's shadow and a blocker gets a blocker's. Without it a small
      // creature reads as hovering an inch off the floor however well it is grounded.
      // A hovering creature still throws a shadow — a faint one, right under it. That contact
      // is what tells the eye it is above the floor rather than drawn at the wrong size.
      if (!airborne || group.hover) {
        const m = getSpriteMetrics(url);
        const bodyWidth = m
          ? (worldHeight / Math.max(0.08, m.heightFrac)) * m.imageAspect * m.widthFrac
          : worldHeight;
        const radius = (bodyWidth * 0.42) / SHADOW_GEOMETRY_RADIUS;
        enemyShadowMaterial.opacity = elevation === "mid" || group.hover ? 0.3 : 0.55;
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(SHADOW_GEOMETRY_RADIUS, 32),
          enemyShadowMaterial.clone()
        );
        shadow.position.set(offsetX, 0.035, z - 0.04);
        shadow.rotation.x = -Math.PI / 2;
        // Flattened by the viewing angle: a circle on the floor reads as a shallow ellipse.
        shadow.scale.set(radius * (elevation === "mid" || group.hover ? 0.75 : 1), radius * 0.34, 1);
        scene.add(shadow);
      }

      const key = groupId;
      const anchor = anchors.get(key) ?? { xSum: 0, n: 0, z, baseY: lift };
      anchor.xSum += offsetX;
      anchor.n += 1;
      // Hang the name/HP mark under the CREATURE, not under the patch of floor it happens to
      // be above. A hovering swarm otherwise gets a label stranded on bare ground below it.
      anchor.baseY = Math.min(anchor.baseY, lift);
      anchors.set(key, anchor);
    });

    // Hand the UI where each group's figures stand, in SCREEN pixels, so the name/HP
    // overlay can sit at their feet instead of in a card somewhere else on the page.
    if (input.onEnemyAnchors) {
      const projected: EnemyAnchor[] = [];
      anchors.forEach((anchor, groupId) => {
        const point = new THREE.Vector3(anchor.xSum / anchor.n, anchor.baseY, anchor.z).project(camera);
        projected.push({
          groupId,
          xPct: ((point.x + 1) / 2) * 100,
          yPct: ((1 - point.y) / 2) * 100
        });
      });
      input.onEnemyAnchors(projected);
    }
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
      const stairTexture = stairTextureFor(false);
      mount.dataset.returnVisual = stairTexture ? "asset" : "geometry";
      scene.add(stairTexture ? createReturnStairSprite(stairTexture) : createReturnStairs(floorMaterial, edgeMaterial));
    } else {
      mount.dataset.returnVisual = "marker";
      scene.add(createReturnMarker(returnMarkerMaterial));
    }
  }

  renderScene();

  return () => {
    loadedTextures.forEach((texture) => texture.dispose());
    renderer.dispose();
    delete mount.dataset.returnVisual;
    delete mount.dataset.frontStairVisual;
    delete mount.dataset.frontStairPlacement;
    delete mount.dataset.combatFormationWidth;
    delete mount.dataset.combatMinimumSilhouette;
    delete mount.dataset.combatMaximumBodyEdge;
    mount.removeChild(renderer.domElement);
  };
}

export function getDungeonBlockTextureUrls(floorId: string | null, pack: string = DEFAULT_ART_PACK) {
  const blocks = blockTextures(pack);
  const depth = Number(floorId?.match(/[a-z](\d+)f/i)?.[1] ?? 0);
  if (depth >= 7) {
    return blocks.block3;
  }

  if (depth >= 4) {
    return blocks.block2;
  }

  if (depth >= 1) {
    return blocks.block1;
  }

  return { wall: asset("stone-wall", pack), floor: asset("stone-floor", pack) };
}

export function getStairTextureUrl(pack: string, descends: boolean): string | undefined {
  return assetOrNull(descends ? "stair-down" : "stair-up", pack);
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
  descends = false,
  stairTexture?: (descends: boolean) => THREE.Texture | undefined
) {
  // The view fades into fog when the corridor runs past the depth limit.
  if (kind === "open") {
    return;
  }

  const z = zCenter - CELL / 2;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2, WALL_HEIGHT, 0.25), wallMaterial);
  wall.position.set(0, WALL_MID_Y, z);
  scene.add(wall);

  // Pack art supplies the stair opening itself. Keep procedural stone courses off
  // that cell; overlaid lines read as a barrier behind a floor-mounted descent.
  const stairUrl = kind === "stairs" ? stairTexture?.(descends) : undefined;
  if (!stairUrl) {
    addStoneCourses(scene, wallMaterial, z);
  }

  if (kind === "door") {
    const door = createDoor(doorMaterial, edgeMaterial);
    door.position.set(0, 1.15, z + 0.14);
    scene.add(door);
  } else if (kind === "stairs") {
    if (stairUrl) {
      const stair = descends
        ? createDescendingStairPlane(stairUrl, z)
        : createStairSprite(stairUrl, 0, z + 0.2, 3.4);
      stair.renderOrder = 2;
      scene.add(stair);
    } else {
      scene.add(createStairs(floorMaterial, edgeMaterial, z, descends));
    }
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

function createStairSprite(texture: THREE.Texture, x: number, z: number, scale: number) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  sprite.center.set(0.5, 0);
  sprite.scale.set(scale, scale, 1);
  sprite.position.set(x, 0.02, z);
  sprite.renderOrder = 2;
  return sprite;
}

function createDescendingStairPlane(texture: THREE.Texture, z: number) {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.9),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0.025, z + 0.55);
  return plane;
}

function createReturnStairSprite(texture: THREE.Texture) {
  return createStairSprite(texture, -2.15, -0.25, 2.85);
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
