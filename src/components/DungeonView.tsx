import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getRoom } from "../domain/scenario";
import type { GameState, ScenarioWorld } from "../domain/types";

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
    scene.background = new THREE.Color("#070807");
    scene.fog = new THREE.Fog("#070807", 5, 16);

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 4.5);
    camera.lookAt(0, 1.3, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#6f776c", 1.1);
    const torch = new THREE.PointLight("#d2a25f", 26, 18);
    torch.position.set(-1.5, 2.4, 2.2);
    scene.add(ambient, torch);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#343a36",
      roughness: 0.86,
      metalness: 0.02
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#151814",
      roughness: 0.9
    });
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: "#6a5640",
      roughness: 0.72
    });
    const stelaMaterial = new THREE.MeshStandardMaterial({
      color: "#050505",
      roughness: 0.5,
      metalness: 0.12
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
    if (room.doors?.includes(state.position.facing)) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.5, 0.18), doorMaterial);
      door.position.set(0, 1.15, -6.85);
      scene.add(door);
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

    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [state.position, world]);

  return (
    <div className="dungeon-view" aria-label={label}>
      <div ref={mountRef} className="dungeon-canvas" data-testid="dungeon-canvas" />
    </div>
  );
}
