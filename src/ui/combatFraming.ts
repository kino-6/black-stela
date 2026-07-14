import type { EnemySize } from "../domain/types";

export const ENEMY_WORLD_HEIGHT: Record<EnemySize, number> = {
  small: 1,
  medium: 1.7,
  large: 2.4,
  huge: 3.1
};

export const MAX_FIGURES_BY_SIZE: Record<EnemySize, number> = {
  small: 5,
  medium: 4,
  large: 3,
  huge: 1
};

interface FramingGroup {
  groupId: string;
  size?: EnemySize;
  count: number;
  /** Opaque silhouette width / height. Padding is deliberately excluded. */
  bodyAspect?: number;
}

export interface FramedEnemyFigure {
  groupId: string;
  indexInGroup: number;
  size: EnemySize;
  x: number;
  z: number;
  projectedHeightPx: number;
}

export interface CombatFraming {
  figures: FramedEnemyFigure[];
  formationWidthPx: number;
  minimumSilhouetteHeightPx: number;
}

const CAMERA_Z = 2.4;
const CAMERA_FOV_DEGREES = 66;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function targetHeight(size: EnemySize, stageHeight: number, figureCount: number) {
  const crowd = clamp(1 - Math.max(0, figureCount - 2) * 0.025, 0.9, 1);
  switch (size) {
    case "small":
      return clamp(stageHeight * 0.38 * crowd, 72, Math.max(96, stageHeight * 0.25));
    case "medium":
      return clamp(stageHeight * 0.52 * crowd, 100, Math.max(140, stageHeight * 0.32));
    case "large":
      return clamp(stageHeight * 0.67 * crowd, 140, Math.max(190, stageHeight * 0.42));
    case "huge":
      return clamp(stageHeight * 0.7, stageHeight * 0.6, stageHeight * 0.75);
  }
}

/**
 * Compose a combat rank in projected screen space, then convert it to corridor
 * world coordinates. This keeps readable pixel silhouettes at both desktop
 * targets without lying about a creature's authored world size.
 */
export function calculateCombatFraming(
  stageWidth: number,
  stageHeight: number,
  groups: FramingGroup[]
): CombatFraming {
  const specs = groups.flatMap((group) => {
    const size = group.size ?? "medium";
    const displayed = Math.max(1, Math.min(group.count, MAX_FIGURES_BY_SIZE[size]));
    return Array.from({ length: displayed }, (_, indexInGroup) => ({
      groupId: group.groupId,
      indexInGroup,
      size,
      bodyAspect: clamp(group.bodyAspect ?? 0.8, 0.35, 1.8)
    }));
  });

  if (specs.length === 0 || stageWidth <= 0 || stageHeight <= 0) {
    return { figures: [], formationWidthPx: 0, minimumSilhouetteHeightPx: 0 };
  }

  const focalPx = stageHeight / (2 * Math.tan((CAMERA_FOV_DEGREES * Math.PI) / 360));
  const projected = specs.map((spec) => {
    const projectedHeightPx = targetHeight(spec.size, stageHeight, specs.length);
    const distance = (ENEMY_WORLD_HEIGHT[spec.size] * focalPx) / projectedHeightPx;
    return { ...spec, projectedHeightPx, distance, bodyWidthPx: projectedHeightPx * spec.bodyAspect };
  });

  const bodySpan = projected.reduce((sum, figure) => sum + figure.bodyWidthPx, 0);
  const formationWidthPx =
    projected.length === 1
      ? 0
      : clamp(Math.max(stageWidth * 0.42, bodySpan * 0.82), stageWidth * 0.4, stageWidth * 0.65);

  const figures = projected.map((figure, index) => {
    const xPx = projected.length === 1 ? 0 : (index / (projected.length - 1) - 0.5) * formationWidthPx;
    const worldPerPixel = figure.distance / focalPx;
    return {
      groupId: figure.groupId,
      indexInGroup: figure.indexInGroup,
      size: figure.size,
      x: xPx * worldPerPixel,
      z: CAMERA_Z - figure.distance,
      projectedHeightPx: figure.projectedHeightPx
    };
  });

  return {
    figures,
    formationWidthPx,
    minimumSilhouetteHeightPx: Math.min(...figures.map((figure) => figure.projectedHeightPx))
  };
}
