import type { ElementColor, PanelGrid } from "../../types/index.ts";
import type { PanelCellState, PanelState, Placement } from "./types.ts";
import { clonePanelState, createPanelState, placePiece } from "./placement.ts";
import { calculateLinks } from "./scoring.ts";

/** A co-op skill firing; Lv5/Lv7 carry the cell the player picks ([row, col], 0-based). */
export interface PlanTrigger {
  element: ElementColor;
  level: number;
  cell?: [number, number];
  /** Index of the placement right after which it fires. */
  afterStep: number;
}

export interface PlanStep {
  placement: Placement;
  /** Cells this piece covers, with whether each is a ★. */
  cells: { row: number; col: number; link: boolean }[];
  /** Board after this piece and any skills it set off. */
  board: PanelState;
  triggers: PlanTrigger[];
}

const SKILL_LEVELS = [3, 5, 7] as const;
const ELEMENTS: ElementColor[] = [1, 2, 3, 4, 5];

/**
 * Co-op Lv5 【屬性變化】 / Lv7 【連結成分化】 (verified, docs/rules-verification.md #11, #12): the
 * player picks any placed cell; Lv5 turns it into `elem` (★/■ kept), Lv7 into an `elem` ★.
 * Tries every eligible cell, applies the one `score` rates highest and returns it.
 */
export function applyBestConversion(
  state: PanelState,
  elem: ElementColor,
  level: 5 | 7,
  score: (trial: PanelState) => number,
): [number, number] | undefined {
  const change = (c: PanelCellState): PanelCellState =>
    level === 5 ? { ...c, element: elem } : { ...c, element: elem, isLink: true };
  const eligible = (c: PanelCellState) =>
    c.occupied && (level === 5 ? c.element !== elem : !(c.element === elem && c.isLink));

  let best: [number, number] | undefined;
  let bestScore = -Infinity;
  state.forEach((row, r) =>
    row.forEach((c, col) => {
      if (!eligible(c)) return;
      const trial = clonePanelState(state);
      trial[r][col] = change(c);
      const s = score(trial);
      if (s > bestScore) {
        bestScore = s;
        best = [r, col];
      }
    }),
  );
  if (best) state[best[0]][best[1]] = change(state[best[0]][best[1]]);
  return best;
}

/**
 * Replay a plan piece by piece, the way it happens in game: as soon as a companion's element
 * reaches 3 / 5 / 7 links, that skill fires (once per synthesis). For Lv5/Lv7 the player picks a
 * cell already on the board, so each candidate is judged by the final board after the remaining
 * pieces.
 */
export function replayPlan(
  panel: PanelGrid,
  placements: Placement[],
  coopMaxLevel: Partial<Record<ElementColor, number>>,
  evaluate: (state: PanelState) => number,
): { steps: PlanStep[]; final: PanelState } {
  const state = createPanelState(panel);
  const fired = new Set<string>();
  const steps: PlanStep[] = [];

  const put = (s: PanelState, p: Placement, i: number) =>
    placePiece(s, p.componentCode, p.rotation, p.row, p.col, i);

  placements.forEach((p, i) => {
    const cells = put(state, p, i);
    const finish = (trial: PanelState) => {
      for (let j = i + 1; j < placements.length; j++) put(trial, placements[j], j);
      return evaluate(trial);
    };

    // A conversion can add links and set off the next level, so loop until nothing new fires.
    const triggers: PlanTrigger[] = [];
    for (let fresh = true; fresh; ) {
      fresh = false;
      const links = calculateLinks(state);
      for (const elem of ELEMENTS) {
        for (const level of SKILL_LEVELS) {
          const key = `${elem}:${level}`;
          if (fired.has(key) || (coopMaxLevel[elem] ?? 0) < level || (links[elem] ?? 0) < level) {
            continue;
          }
          fired.add(key);
          const cell = level === 3 ? undefined : applyBestConversion(state, elem, level, finish);
          triggers.push({ element: elem, level, cell, afterStep: i });
          fresh = true;
        }
      }
    }

    steps.push({ placement: p, cells, board: clonePanelState(state), triggers });
  });

  return { steps, final: state };
}
