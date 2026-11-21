import type { PanelGrid, ElementColor } from "../../types/index.ts";
import type { PanelState } from "./types.ts";

/** Calculate fill values per element from placed components on the panel */
export function calculateFillValues(
  panelState: PanelState,
  panelLayout: PanelGrid,
): Partial<Record<ElementColor, number>> {
  const fills: Partial<Record<ElementColor, number>> = {};

  for (let r = 0; r < panelState.length; r++) {
    for (let c = 0; c < (panelState[0]?.length ?? 0); c++) {
      const cell = panelState[r][c];
      if (!cell.occupied || !cell.element) continue;

      const elem = cell.element;
      fills[elem] = (fills[elem] ?? 0) + 1;

      // Attribute matching bonus: component element matches panel cell element
      const panelElem = panelLayout[r]?.[c];
      if (panelElem !== null && panelElem !== -1 && panelElem === elem) {
        fills[elem] = (fills[elem] ?? 0) + 1;
      }
    }
  }
  return fills;
}

/** Calculate link counts per element (adjacent same-element ★ cells) */
export function calculateLinks(panelState: PanelState): Partial<Record<ElementColor, number>> {
  const links: Partial<Record<ElementColor, number>> = {};
  const rows = panelState.length;
  const cols = panelState[0]?.length ?? 0;
  const dirs = [
    [0, 1],
    [1, 0],
  ]; // right and down only to avoid double-counting

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = panelState[r][c];
      if (!cell.occupied || !cell.isLink || !cell.element) continue;

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= rows || nc >= cols) continue;

        const neighbor = panelState[nr][nc];
        if (neighbor.occupied && neighbor.isLink && neighbor.element === cell.element) {
          links[cell.element] = (links[cell.element] ?? 0) + 1;
        }
      }
    }
  }
  return links;
}

export interface ScoredLine {
  elem: ElementColor;
  maxlv?: number;
  restrict?: number;
  data: { num: number }[];
}

/**
 * Value and unlocked effects of one effect line. Verified against the game (55/55 states):
 * value = min(element value, maxlv + 1 per link of that element); only the first `restrict`
 * effects (game: ReverseLockLevel) can unlock. See docs/rules-verification.md (#8, #9).
 */
export function lineState(
  line: ScoredLine,
  fill: number,
  links: number,
): { value: number; unlocked: number } {
  const value = Math.min(fill, (line.maxlv ?? Infinity) + links);
  const limit = Math.min(line.restrict ?? line.data.length, line.data.length);
  let unlocked = 0;
  for (let i = 0; i < limit; i++) {
    if (value >= line.data[i].num) unlocked++;
  }
  return { value, unlocked };
}

/** Quality added by co-op "quality up" (Lv3): 3 per link of that element once it has 3+ links. */
export const COOP_QUALITY_PER_LINK = 3;

/** Occupied cells on the board; the game's great-success % equals this (#7). */
export function occupiedCells(panelState: PanelState): number {
  let n = 0;
  for (const row of panelState) for (const cell of row) if (cell.occupied) n++;
  return n;
}

/**
 * Quality gained on the board. Verified (#6, #10): +1 per occupied cell (same-color bonus adds
 * nothing), plus 3 per link for each element whose companion can use Lv3 and has 3+ links.
 */
export function qualityGain(
  panelState: PanelState,
  linkCounts: Partial<Record<ElementColor, number>>,
  coopMaxLevel: Partial<Record<ElementColor, number>> = {},
): number {
  let gain = occupiedCells(panelState);
  for (const [elem, links] of Object.entries(linkCounts) as [string, number][]) {
    const cap = coopMaxLevel[Number(elem) as ElementColor] ?? 0;
    if (cap >= 3 && links >= 3) gain += COOP_QUALITY_PER_LINK * links;
  }
  return gain;
}

/** Weight of quality gain relative to effect-line value in the score. */
const QUALITY_WEIGHT = 0.5;

/** Score a placement result against effect lines */
export function scoreResult(
  fillValues: Partial<Record<ElementColor, number>>,
  linkCounts: Partial<Record<ElementColor, number>>,
  effectLines: ScoredLine[],
  mode: "global" | "single" | "combo" = "global",
  targetLineIndex?: number,
  targetThresholds?: (number | null)[],
  quality = 0,
): number {
  let score = quality * QUALITY_WEIGHT;

  for (let lineIdx = 0; lineIdx < effectLines.length; lineIdx++) {
    const line = effectLines[lineIdx];
    const links = linkCounts[line.elem] ?? 0;
    const { value: cappedFill, unlocked: unlockedCount } = lineState(
      line,
      fillValues[line.elem] ?? 0,
      links,
    );

    let lineScore = unlockedCount * 10 + cappedFill + links * 3;

    if (mode === "single" && targetLineIndex != null) {
      // Heavily weight the target line, secondary lines get minimal weight
      lineScore = lineIdx === targetLineIndex ? lineScore * 10 : lineScore;
    } else if (mode === "combo" && targetThresholds) {
      // Bonus for reaching the target threshold on each line
      const target = targetThresholds[lineIdx];
      if (target != null) {
        lineScore += cappedFill >= target ? 100 : 0;
      }
    }

    score += lineScore;
  }

  return score;
}

/** Evaluate a position for greedy placement: how good is placing this component here? */
export function evaluatePosition(
  panelState: PanelState,
  panelLayout: PanelGrid,
  grid: number[][],
  element: ElementColor,
  row: number,
  col: number,
): number {
  let posScore = 0;
  const rows = panelState.length;
  const cols = panelState[0]?.length ?? 0;

  for (let gr = 0; gr < 3; gr++) {
    for (let gc = 0; gc < 3; gc++) {
      if (grid[gr][gc] === 0) continue;
      const pr = row + gr;
      const pc = col + gc;
      // (positions come from findValidPositions: every cell is on the board and empty)

      // Base score: prefer positions closer to center (helps spread placement)
      const centerR = rows / 2;
      const centerC = cols / 2;
      posScore += 1 - ((Math.abs(pr - centerR) + Math.abs(pc - centerC)) / (rows + cols)) * 0.5;

      // Attribute matching bonus
      const panelElem = panelLayout[pr]?.[pc];
      if (panelElem !== null && panelElem !== -1 && panelElem === element) {
        posScore += 5;
      }

      // Link adjacency bonus: check if adjacent cells have same-element ★
      if (grid[gr][gc] === 2) {
        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dr, dc] of dirs) {
          const nr = pr + dr;
          const nc = pc + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const neighbor = panelState[nr][nc];
          if (neighbor.occupied && neighbor.isLink && neighbor.element === element) {
            posScore += 8;
          }
        }
      }
    }
  }
  return posScore;
}
