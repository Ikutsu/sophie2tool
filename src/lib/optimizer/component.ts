import type { ElementColor } from "../../types/index.ts";
import type { ParsedComponent, Rotation } from "./types.ts";

export function parseComponent(code: string): ParsedComponent {
  const element = Number(code[0]) as ElementColor;
  const grid: number[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: number[] = [];
    for (let c = 0; c < 3; c++) {
      row.push(Number(code[1 + r * 3 + c]));
    }
    grid.push(row);
  }
  return { element, grid, code };
}

/** Rotate a 3×3 grid clockwise by the given angle */
export function rotateGrid(grid: number[][], rotation: Rotation): number[][] {
  if (rotation === 0) return grid;

  let result = grid;
  const steps = rotation / 90;
  for (let s = 0; s < steps; s++) {
    const rotated: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        rotated[c][2 - r] = result[r][c];
      }
    }
    result = rotated;
  }
  return result;
}

/** The 10-char code of a component after rotating it clockwise (for drawing it as placed). */
export function rotateCode(code: string, rotation: Rotation): string {
  return code[0] + rotateGrid(parseComponent(code).grid, rotation).flat().join("");
}

export type FilledCell = { dr: number; dc: number; value: number };

// Grids are built once per piece rotation and then queried in hot loops, so cache per grid object.
const filledCache = new WeakMap<number[][], FilledCell[]>();

/** Get the filled cells of a component grid (non-zero cells with their offsets). Cached. */
export function getFilledCells(grid: number[][]): FilledCell[] {
  let cells = filledCache.get(grid);
  if (!cells) {
    cells = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] !== 0) cells.push({ dr: r, dc: c, value: grid[r][c] });
      }
    }
    filledCache.set(grid, cells);
  }
  return cells;
}

const rotatedCache = new Map<string, FilledCell[]>();

/** Filled cells of a component code after rotating it clockwise. Cached by code and angle. */
export function rotatedCells(code: string, rotation: Rotation): FilledCell[] {
  const key = `${code}:${rotation}`;
  let cells = rotatedCache.get(key);
  if (!cells) {
    cells = getFilledCells(rotateGrid(parseComponent(code).grid, rotation));
    rotatedCache.set(key, cells);
  }
  return cells;
}

/** Get all 4 rotations of a component, deduped */
export function getAllRotations(code: string): { grid: number[][]; rotation: Rotation }[] {
  const parsed = parseComponent(code);
  const seen = new Set<string>();
  const results: { grid: number[][]; rotation: Rotation }[] = [];

  for (const rotation of [0, 90, 180, 270] as Rotation[]) {
    const grid = rotateGrid(parsed.grid, rotation);
    const key = grid.flat().join("");
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ grid, rotation });
    }
  }
  return results;
}
