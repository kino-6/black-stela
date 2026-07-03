import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getRoom } from "../domain/scenario";
import type { Direction, GameState, ScenarioWorld } from "../domain/types";

interface DungeonViewProps {
  state: GameState;
  world: ScenarioWorld;
  label: string;
}

export function DungeonView({ state, world, label }: DungeonViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current || !state.position) {
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
    const ambient = new THREE.AmbientLight("#9a9383", 1.8);
    const torch = new THREE.PointLight("#f0b76c", 58, 26);
    torch.position.set(-1.5, 2.4, 2.2);
    const frontLight = new THREE.SpotLight("#ffe0a0", 34, 18, Math.PI / 6, 0.4, 1);
    frontLight.position.set(0, 2.8, 2.8);
    frontLight.target.position.set(0, 1.1, -5.4);
    scene.add(ambient, torch, frontLight, frontLight.target);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#59615a",
      roughness: 0.78,
      metalness: 0.02
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#2a2418",
      roughness: 0.86
    });
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: "#9a6b35",
      roughness: 0.62,
      metalness: 0.08
    });
    const stelaMaterial = new THREE.MeshStandardMaterial({
      color: "#101010",
      roughness: 0.5,
      metalness: 0.12
    });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: "#c69a58", transparent: true, opacity: 0.78 });
    const hazardMaterial = new THREE.MeshStandardMaterial({
      color: "#b64b35",
      emissive: "#3a0905",
      roughness: 0.5
    });
    const enemyMaterial = new THREE.MeshStandardMaterial({
      color: "#7b8f72",
      emissive: "#1f2e18",
      roughness: 0.56
    });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 12), floorMaterial);
    floor.position.set(0, -0.1, -1);
    scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 12), wallMaterial);
    ceiling.position.set(0, 3.1, -1);
    scene.add(ceiling);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 12), wallMaterial);
    leftWall.position.set(-4, 1.5, -1);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 12), wallMaterial);
    rightWall.position.set(4, 1.5, -1);
    scene.add(rightWall);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.25), wallMaterial);
    backWall.position.set(0, 1.5, -7);
    scene.add(backWall);

    const room = getRoom(world, state.position.roomId);
    const currentExit = room.exits[state.position.facing];
    const hasFrontDoor = Boolean(currentExit) || room.doors?.includes(state.position.facing);
    if (hasFrontDoor) {
      const door = createDoor(doorMaterial, edgeMaterial);
      door.position.set(0, 1.15, -6.75);
      scene.add(door);
    }

    const leftDirection = turn(state.position.facing, "left");
    const rightDirection = turn(state.position.facing, "right");
    if (room.exits[leftDirection] || room.doors?.includes(leftDirection)) {
      const sideDoor = createSideDoor(doorMaterial, edgeMaterial);
      sideDoor.position.set(-3.86, 1.06, -2.7);
      sideDoor.rotation.y = Math.PI / 2;
      scene.add(sideDoor);
    }
    if (room.exits[rightDirection] || room.doors?.includes(rightDirection)) {
      const sideDoor = createSideDoor(doorMaterial, edgeMaterial);
      sideDoor.position.set(3.86, 1.06, -2.7);
      sideDoor.rotation.y = -Math.PI / 2;
      scene.add(sideDoor);
    }

    if (state.phase === "combat" && state.combat) {
      const enemy = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 16), enemyMaterial);
      body.scale.set(1.25, 0.72, 0.92);
      body.position.set(0, 0.78, -4.15);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: "#f1d68b" });
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), eyeMaterial);
      leftEye.position.set(-0.28, 0.96, -3.55);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.28;
      enemy.add(body, leftEye, rightEye);
      scene.add(enemy);
    }

    if (room.trap && !state.resolvedTraps.includes(room.trap.id)) {
      const trap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 3), hazardMaterial);
      trap.position.set(0, 0.04, -2.15);
      trap.rotation.y = Math.PI / 3;
      scene.add(trap);
    }

    if (room.stairsToTown) {
      for (let index = 0; index < 5; index += 1) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(3.2 - index * 0.28, 0.22, 0.55), floorMaterial);
        step.position.set(0, index * 0.18, -4.8 - index * 0.55);
        scene.add(step);
      }
    }

    const stela = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.9, 0.25), stelaMaterial);
    stela.position.set(2.55, 0.95, -4.9);
    scene.add(stela);

    addStoneCourses(scene, wallMaterial);

    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [state.position, state.phase, state.combat?.enemy.id, state.resolvedTraps, world]);

  return (
    <div className="dungeon-view" aria-label={label}>
      <div ref={mountRef} className="dungeon-canvas" data-testid="dungeon-canvas" />
    </div>
  );
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

function addStoneCourses(scene: THREE.Scene, material: THREE.Material) {
  for (let index = 0; index < 5; index += 1) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.025, 0.035), material);
    line.position.set(0, 0.62 + index * 0.48, -6.84);
    scene.add(line);
  }
}

function turn(facing: Direction, side: "left" | "right"): Direction {
  const directions: Direction[] = ["north", "east", "south", "west"];
  const index = directions.indexOf(facing);
  return directions[(index + (side === "left" ? 3 : 1)) % directions.length];
}
