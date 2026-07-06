import type { Direction } from "./types";

/**
 * ASCII floor-map expansion.
 *
 * A dense Wizardry-style floor is authored as a text grid plus a handful of
 * special rooms, and expanded here into the canonical `grid.cells` + `rooms`
 * shape the rest of the engine already understands. Most cells are plain
 * corridors (one shared template, unique synthesized ids); only meaningful
 * cells (stairs, treasure, gimmicks) are hand-written rooms bound via `symbols`.
 *
 * Map glyphs:
 *   ' ' (space) or '#'  -> void / wall (no cell)
 *   '.'                 -> corridor cell (uses the `corridor` template)
 *   any `symbols` key   -> a cell bound to that authored room id
 *
 * Adjacent walkable cells auto-connect with `open` edges. Non-open connections
 * (doors, stairs, locked/secret/shortcut) are declared in `edges` overrides.
 * Room `exits` are always derived from the final edges, so grid and graph agree.
 */

interface RawEdgeOverride {
  from: string;
  direction: Direction;
  kind: "open" | "wall" | "door" | "locked" | "secret" | "one_way" | "shortcut" | "stairs";
  to?: string;
  targetFloorId?: string;
  mirror?: boolean;
}

interface CorridorTemplate {
  name: string;
  description: string;
  locales?: unknown;
}

export interface RawMapFloor {
  id: string;
  map: string;
  symbols?: Record<string, string>;
  corridor?: CorridorTemplate;
  edges?: RawEdgeOverride[];
  rooms?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};
const OPPOSITE: Record<Direction, Direction> = {
  north: "south",
  south: "north",
  east: "west",
  west: "east"
};
const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];

export function isMapFloor(raw: unknown): raw is RawMapFloor {
  return Boolean(raw && typeof raw === "object" && typeof (raw as { map?: unknown }).map === "string");
}

interface EdgeValue {
  kind: string;
  targetRoomId?: string;
  targetCellId?: string;
  targetFloorId?: string;
}

interface WorkingCell {
  x: number;
  y: number;
  glyph: string;
  roomId: string;
  cellId: string;
  corridor: boolean;
  edges: Partial<Record<Direction, EdgeValue>>;
}

export function expandFloorMap(raw: RawMapFloor): Record<string, unknown> {
  const slug = raw.id.replace(/^dungeon\./, "");
  const symbols = raw.symbols ?? {};
  const corridorTemplate = raw.corridor;

  // 1. Parse the grid into cells (drop trailing blank lines from the block scalar).
  const lines = raw.map.replace(/\n+$/, "").split("\n");
  const cells: WorkingCell[] = [];
  const byCoord = new Map<string, WorkingCell>();

  lines.forEach((line, y) => {
    [...line].forEach((glyph, x) => {
      if (glyph === " " || glyph === "#") {
        return;
      }

      let roomId: string;
      let corridor = false;
      if (symbols[glyph]) {
        roomId = symbols[glyph];
      } else if (glyph === ".") {
        if (!corridorTemplate) {
          throw new Error(`Floor ${raw.id} uses '.' corridors but declares no \`corridor\` template.`);
        }
        roomId = `room.${slug}.c${x}_${y}`;
        corridor = true;
      } else {
        throw new Error(`Floor ${raw.id} has an unknown map glyph '${glyph}' at (${x}, ${y}).`);
      }

      const cellId = roomId.replace(/^room\./, "cell.");
      const cell: WorkingCell = { x, y, glyph, roomId, cellId, corridor, edges: {} };
      cells.push(cell);
      byCoord.set(coordKey(x, y), cell);
    });
  });

  if (cells.length === 0) {
    throw new Error(`Floor ${raw.id} map expanded to zero cells.`);
  }

  // 2. Auto-connect orthogonally adjacent walkable cells with open edges.
  for (const cell of cells) {
    for (const dir of DIRECTIONS) {
      const neighbor = byCoord.get(coordKey(cell.x + OFFSETS[dir].x, cell.y + OFFSETS[dir].y));
      if (neighbor) {
        cell.edges[dir] = { kind: "open", targetRoomId: neighbor.roomId, targetCellId: neighbor.cellId };
      }
    }
  }

  const byRoom = new Map(cells.map((cell) => [cell.roomId, cell]));

  // 3. Apply non-open edge overrides (doors, stairs, locked/secret/shortcut).
  for (const override of raw.edges ?? []) {
    const cell = byRoom.get(override.from);
    if (!cell) {
      throw new Error(`Edge override on ${raw.id} references unknown room ${override.from}.`);
    }
    const dir = override.direction;
    const crossFloor = Boolean(override.targetFloorId && override.targetFloorId !== raw.id);

    let targetRoomId = override.to;
    let targetCellId: string | undefined;
    if (crossFloor) {
      if (!targetRoomId) {
        throw new Error(`Cross-floor edge ${override.from}.${dir} on ${raw.id} needs a target room.`);
      }
    } else {
      const targetCell = targetRoomId
        ? byRoom.get(targetRoomId)
        : byCoord.get(coordKey(cell.x + OFFSETS[dir].x, cell.y + OFFSETS[dir].y));
      if (!targetCell) {
        throw new Error(`Edge override ${override.from}.${dir} on ${raw.id} has no target cell.`);
      }
      targetRoomId = targetCell.roomId;
      targetCellId = targetCell.cellId;
    }

    cell.edges[dir] = {
      kind: override.kind,
      targetRoomId,
      ...(targetCellId ? { targetCellId } : {}),
      ...(override.targetFloorId ? { targetFloorId: override.targetFloorId } : {})
    };

    // Reciprocity only makes sense for genuinely adjacent cells; a magic
    // shortcut/stairs edge to a far cell leaves the far side untouched.
    const neighbor = targetCellId ? byRoom.get(targetRoomId) : undefined;
    const spatiallyAdjacent =
      neighbor && neighbor.x === cell.x + OFFSETS[dir].x && neighbor.y === cell.y + OFFSETS[dir].y;
    if (neighbor && spatiallyAdjacent) {
      const reverse = OPPOSITE[dir];
      if (override.kind === "one_way") {
        delete neighbor.edges[reverse];
      } else if (override.kind === "door" || override.kind === "secret") {
        neighbor.edges[reverse] = { kind: override.kind, targetRoomId: cell.roomId, targetCellId: cell.cellId };
      } else if (override.kind === "shortcut") {
        if (override.mirror) {
          neighbor.edges[reverse] = { kind: "shortcut", targetRoomId: cell.roomId, targetCellId: cell.cellId };
        } else {
          delete neighbor.edges[reverse];
        }
      }
      // locked/open: the reverse side stays walkable (auto open edge).
    }
  }

  // 4. Build the canonical rooms: corridors from the template, specials from the
  //    authored list. Every room's exits are derived from its final edges.
  const authoredById = new Map((raw.rooms ?? []).map((room) => [room.id as string, room]));
  const rooms: Array<Record<string, unknown>> = cells.map((cell) => {
    const exits = deriveExits(cell);
    if (cell.corridor) {
      return {
        id: cell.roomId,
        name: corridorTemplate!.name,
        description: corridorTemplate!.description,
        ...(corridorTemplate!.locales ? { locales: corridorTemplate!.locales } : {}),
        exits
      };
    }

    const authored = authoredById.get(cell.roomId);
    if (!authored) {
      throw new Error(`Map cell for ${cell.roomId} on ${raw.id} has no authored room.`);
    }
    return { ...authored, exits };
  });

  const grid = {
    cells: cells.map((cell) => ({ id: cell.cellId, roomId: cell.roomId, x: cell.x, y: cell.y, edges: cell.edges }))
  };

  const { map: _map, symbols: _symbols, corridor: _corridor, edges: _edges, rooms: _rooms, ...rest } = raw;
  return { ...rest, grid, rooms };
}

function deriveExits(cell: WorkingCell): Record<string, string> {
  const exits: Record<string, string> = {};
  for (const dir of DIRECTIONS) {
    const edge = cell.edges[dir];
    if (edge?.targetRoomId) {
      exits[dir] = edge.targetRoomId;
    }
  }
  return exits;
}

function coordKey(x: number, y: number): string {
  return `${x},${y}`;
}
