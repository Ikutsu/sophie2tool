import type { PanelGrid, ElementColor } from "../../types/index.ts";
import type { PanelState, PanelCellState, Rotation } from "./types.ts";
import { getFilledCells, rotatedCells } from "./component.ts";

/** Create an empty panel state from the recipe panel layout */
export function createPanelState(panel: PanelGrid): PanelState {
  return panel.map((row) => row.map((): PanelCellState => ({ occupied: false })));
}

/** Clone a panel state (deep copy) */
export function clonePanelState(state: PanelState): PanelState {
  return state.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * The board for a given size: the center of the recipe's 7×7 panel. Without a catalyst the game's
 * board is the 5×5 center (verified, docs/rules-verification.md #1).
 */
export function cropPanel<T>(grid: T[][], size: number): T[][] {
  if (size >= grid.length) return grid;
  const o = Math.floor((grid.length - size) / 2);
  return grid.slice(o, o + size).map((row) => row.slice(o, o + size));
}

/** Whether a piece fits at (row, col): every cell on the board and empty. */
export function canPlace(
  panelState: PanelState,
  grid: number[][],
  row: number,
  col: number,
): boolean {
  const rows = panelState.length;
  const cols = panelState[0]?.length ?? 0;
  for (const { dr, dc } of getFilledCells(grid)) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= rows || c < 0 || c >= cols || panelState[r][c].occupied) return false;
  }
  return true;
}

/** Place a piece on empty cells. Returns false if it does not fit. */
export function placeComponent(
  panelState: PanelState,
  grid: number[][],
  element: ElementColor,
  row: number,
  col: number,
  componentIndex?: number,
): boolean {
  if (!canPlace(panelState, grid, row, col)) return false;
  for (const { dr, dc, value } of getFilledCells(grid)) {
    panelState[row + dr][col + dc] = {
      occupied: true,
      element,
      isLink: value === 2,
      componentIndex,
    };
  }
  return true;
}

/**
 * All positions where a piece fits. A 3×3 grid may have empty leading rows/columns, so the
 * anchor can sit above/left of the board.
 */
export function findValidPositions(
  panelState: PanelState,
  grid: number[][],
): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  const rows = panelState.length;
  const cols = panelState[0]?.length ?? 0;
  for (let r = -2; r < rows; r++) {
    for (let c = -2; c < cols; c++) {
      if (canPlace(panelState, grid, r, c)) positions.push({ row: r, col: c });
    }
  }
  return positions;
}

/**
 * Put a piece on the board the way the game does: any earlier piece it touches is removed
 * entirely (it returns to its material; verified, docs/rules-verification.md #4).
 * Returns the cells the new piece covers.
 */
export function placePiece(
  state: PanelState,
  code: string,
  rotation: Rotation,
  row: number,
  col: number,
  componentIndex: number,
): { row: number; col: number; link: boolean }[] {
  const cells = rotatedCells(code, rotation);
  const element = Number(code[0]) as ElementColor;
  const touched = new Set<number>();
  for (const { dr, dc } of cells) {
    const cell = state[row + dr]?.[col + dc];
    if (cell?.occupied && cell.componentIndex != null) touched.add(cell.componentIndex);
  }
  if (touched.size > 0) {
    for (const r of state) {
      for (let c = 0; c < r.length; c++) {
        const idx = r[c].componentIndex;
        if (idx != null && touched.has(idx)) r[c] = { occupied: false };
      }
    }
  }
  const placed: { row: number; col: number; link: boolean }[] = [];
  for (const { dr, dc, value } of cells) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= state.length || c < 0 || c >= (state[0]?.length ?? 0)) continue;
    state[r][c] = { occupied: true, element, isLink: value === 2, componentIndex };
    placed.push({ row: r, col: c, link: value === 2 });
  }
  return placed;
}
