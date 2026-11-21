/**
 * Golden tests: every expected value here was read from the running game (Steam v1.8.0.0)
 * through bridge/ (the game reader). See docs/rules-verification.md for how each was collected.
 */
import { describe, expect, test } from "vite-plus/test";
import type { ElementColor, PanelGrid } from "../../types/index.ts";
import {
  calculateFillValues,
  calculateLinks,
  lineState,
  occupiedCells,
  qualityGain,
} from "./scoring.ts";
import { canPlace, createPanelState, placeComponent } from "./placement.ts";
import { applyBestConversion, replayPlan } from "./replay.ts";
import { optimize } from "./engine.ts";
import type { PanelState } from "./types.ts";

// 安寧藥膏 (sedative-ointment) 5×5 board: center crop of its 7×7 panel (null = the game's "-2" cell)
const PANEL: PanelGrid = [
  [-1, -1, -1, -1, -1],
  [-1, 2, -1, -1, -1],
  [-1, -1, -1, -1, 1],
  [null, -1, -1, -1, null],
  [2, -1, -1, 1, -1],
];

type Piece = { element: ElementColor; cells: [number, number][]; links?: [number, number][] };

function board(pieces: Piece[]): PanelState {
  const s = createPanelState(PANEL);
  pieces.forEach((p, i) => {
    const links = new Set((p.links ?? []).map(([r, c]) => `${r},${c}`));
    for (const [r, c] of p.cells) {
      s[r][c] = {
        occupied: true,
        element: p.element,
        isLink: links.has(`${r},${c}`),
        componentIndex: i,
      };
    }
  });
  return s;
}

// game counter order: fire, ice, thunder, wind, light (web element codes 4, 1, 3, 2, 5)
const ORDER: ElementColor[] = [4, 1, 3, 2, 5];
const inGameOrder = (m: Partial<Record<ElementColor, number>>) => ORDER.map((e) => m[e] ?? 0);

describe("board values match the game", () => {
  test("4 pieces, none on a same-color cell", () => {
    const s = board([
      {
        element: 1,
        cells: [
          [0, 0],
          [0, 2],
          [1, 1],
          [2, 0],
        ],
        links: [
          [0, 2],
          [1, 1],
        ],
      },
      {
        element: 2,
        cells: [
          [0, 3],
          [1, 3],
        ],
        links: [[0, 3]],
      },
      {
        element: 5,
        cells: [
          [0, 4],
          [1, 4],
        ],
        links: [[0, 4]],
      },
      {
        element: 1,
        cells: [
          [1, 2],
          [2, 2],
        ],
        links: [[1, 2]],
      },
    ]);
    expect(inGameOrder(calculateFillValues(s, PANEL))).toEqual([0, 6, 0, 2, 2]);
    expect(inGameOrder(calculateLinks(s))).toEqual([0, 2, 0, 0, 0]); // diagonal ★ do not link
    expect(qualityGain(s, calculateLinks(s))).toBe(10); // quality 26 -> 36
    expect(occupiedCells(s)).toBe(10); // great success shown as 10%
  });

  test("same-color bonus, overlap, and the special cell", () => {
    const s = board([
      { element: 1, cells: [[2, 4]], links: [[2, 4]] }, // ice ★ on ice cell
      { element: 1, cells: [[2, 4]], links: [[2, 4]] }, // second ice ★ on top: removes the first (same cell)
      {
        element: 2,
        cells: [
          [1, 1],
          [2, 1],
        ],
        links: [[1, 1]],
      }, // wind ★ on wind cell
      { element: 3, cells: [[3, 0]], links: [[3, 0]] }, // thunder on the "-2" cell
    ]);
    expect(inGameOrder(calculateFillValues(s, PANEL))).toEqual([0, 2, 1, 3, 0]);
    expect(qualityGain(s, calculateLinks(s))).toBe(4); // quality 18 -> 22
    expect(occupiedCells(s)).toBe(4); // great success shown as 4%
  });
});

describe("placement rules", () => {
  test("a piece placed on top of another removes that whole piece (game, 布料)", () => {
    // Game (布料): placing a piece that touches one cell of an earlier piece left only the new piece.
    const plan = [
      { componentCode: "2200010101", materialSlug: "a", row: 2, col: 0, rotation: 0 as const }, // (2,0)★ (3,1) (4,0) (4,2)
      { componentCode: "2001010010", materialSlug: "a", row: 2, col: 1, rotation: 0 as const }, // (2,3) (3,2) (4,2): touches (4,2)
    ];
    const { steps } = replayPlan(PANEL, plan, {}, () => 0);
    const occupied = (k: number) => steps[k].board.flat().filter((c) => c.occupied).length;
    expect(occupied(0)).toBe(4);
    // the second piece covers (4,2) of the first piece, so the first piece disappears entirely
    expect(steps[1].board[2][0].occupied).toBe(false);
    expect(occupied(1)).toBe(steps[1].cells.length);
  });

  test("the optimizer only places pieces on empty cells", () => {
    const s = createPanelState(PANEL);
    const pair = [
      [1, 0, 0],
      [1, 0, 0],
      [0, 0, 0],
    ];
    expect(placeComponent(s, pair, 1, 0, 0, 0)).toBe(true);
    expect(canPlace(s, pair, 1, 0)).toBe(false); // default mode is "clean"
    expect(canPlace(s, pair, 0, 1)).toBe(true);
  });

  test("rotated pieces can reach the top and left edges", () => {
    const s = createPanelState(PANEL);
    const bottomRight = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 2],
    ];
    expect(canPlace(s, bottomRight, -2, -2)).toBe(true);
  });
});

describe("effect lines match the game (安寧藥膏)", () => {
  const lines = [
    {
      elem: 1 as ElementColor,
      maxlv: 10,
      restrict: 3,
      data: [{ num: 0 }, { num: 8 }, { num: 12 }, { num: 18 }],
    },
    { elem: 1 as ElementColor, maxlv: 6, restrict: 1, data: [{ num: 10 }, { num: 12 }] },
    { elem: 2 as ElementColor, maxlv: 6, data: [{ num: 4 }, { num: 8 }] },
  ];
  // [ice value, ice links, wind value, unlocked effect index on line 1, 2, 3] (−1 = none)
  const observed = [
    [2, 0, 3, 0, -1, -1],
    [2, 0, 0, 0, -1, -1],
    [0, 0, 0, 0, -1, -1],
    [1, 0, 0, 0, -1, -1],
    [3, 0, 0, 0, -1, -1],
    [4, 0, 0, 0, -1, -1],
    [6, 0, 0, 0, -1, -1],
    [9, 0, 0, 1, -1, -1],
    [8, 0, 0, 1, -1, -1],
    [10, 0, 0, 1, -1, -1],
    [15, 2, 0, 2, -1, -1],
    [14, 0, 0, 1, -1, -1],
    [16, 0, 0, 1, -1, -1],
    [17, 0, 0, 1, -1, -1],
    [21, 0, 0, 1, -1, -1],
    [20, 0, 0, 1, -1, -1],
    [4, 1, 0, 0, -1, -1],
    [9, 1, 0, 1, -1, -1],
    [9, 3, 0, 1, -1, -1],
    [13, 5, 0, 2, 0, -1],
    [5, 0, 0, 0, -1, -1],
    [6, 2, 0, 0, -1, -1],
    [7, 4, 0, 0, -1, -1],
    [9, 5, 0, 1, -1, -1],
    [13, 6, 0, 2, 0, -1],
    [14, 8, 0, 2, 0, -1],
    [17, 9, 0, 2, 0, -1],
    [19, 9, 0, 2, 0, -1],
    [21, 9, 0, 2, 0, -1],
  ];
  test.each(observed)("ice %i, links %i, wind %i", (ice, iceLinks, wind, ...expected) => {
    const values = { 1: [ice, iceLinks], 2: [wind, 0] } as Record<number, [number, number]>;
    const got = lines.map((l) => lineState(l, values[l.elem][0], values[l.elem][1]).unlocked - 1);
    expect(got).toEqual(expected);
  });
});

describe("co-op Lv5 / Lv7: the player converts any placed cell (布料, Alette = wind)", () => {
  const W = 2 as ElementColor;
  const I = 1 as ElementColor;
  // Board from the first 布料 screenshot (3 wind links), plus the 蝕岩藤 piece that reached 5 links.
  const beforeLv5 = (): PanelState =>
    board([
      {
        element: W,
        cells: [
          [0, 1],
          [0, 2],
          [1, 1],
          [1, 2],
          [1, 3],
          [2, 1],
          [2, 2],
          [3, 2],
        ],
        links: [
          [0, 1],
          [1, 1],
          [2, 1],
          [2, 2],
        ],
      },
      {
        element: I,
        cells: [
          [0, 3],
          [1, 4],
          [2, 3],
        ],
        links: [
          [0, 3],
          [1, 4],
          [2, 3],
        ],
      },
      {
        element: W,
        cells: [
          [1, 0],
          [2, 0],
          [3, 1],
        ],
        links: [
          [1, 0],
          [3, 1],
        ],
      },
    ]);

  test("Lv5 turns the best cell into wind, keeping ★ (game: ice ★ at (2,3), links 5 → 6)", () => {
    const s = beforeLv5();
    expect(calculateLinks(s)[W]).toBe(5);
    expect(applyBestConversion(s, W, 5, (b) => calculateLinks(b)[W] ?? 0)).toEqual([2, 3]);
    expect(s[2][3]).toMatchObject({ element: W, isLink: true });
    expect(calculateLinks(s)[W]).toBe(6);
  });

  test("Lv7 may turn any cell into a wind ★; best is the wind ■ at (3,2), links 7 → 10", () => {
    const s = beforeLv5();
    s[2][3] = { ...s[2][3], element: W }; // the Lv5 choice made in game
    for (const [r, c, link] of [
      [2, 4, false],
      [3, 3, true],
      [3, 4, false],
    ] as const) {
      s[r][c] = { occupied: true, element: W, isLink: link, componentIndex: 9 };
    }
    expect(calculateLinks(s)[W]).toBe(7);
    expect(applyBestConversion(s, W, 7, (b) => calculateLinks(b)[W] ?? 0)).toEqual([3, 2]);
    expect(s[3][2]).toMatchObject({ element: W, isLink: true });
    expect(calculateLinks(s)[W]).toBe(10);
  });
});

describe("ordered replay (placement guide)", () => {
  test("skills fire right after the step that reaches the threshold, on a cell already placed", () => {
    const plan = [
      { componentCode: "1200000000", materialSlug: "a", row: 0, col: 3, rotation: 0 as const }, // ice ★
      { componentCode: "2220220000", materialSlug: "b", row: 0, col: 0, rotation: 0 as const }, // wind ★ 2×2: 4 links
      { componentCode: "2200000000", materialSlug: "c", row: 2, col: 0, rotation: 0 as const }, // wind ★: 5 links
    ];
    const { steps } = replayPlan(PANEL, plan, { 2: 7 }, (s) => calculateLinks(s)[2] ?? 0);
    expect(steps.map((s) => s.triggers.map((t) => t.level))).toEqual([[], [3], [5]]);
    expect(steps.flatMap((s) => s.triggers).find((t) => t.level === 5)).toMatchObject({
      afterStep: 2,
      cell: [0, 3],
    });
    expect(steps[1].board[0][3]).toMatchObject({ element: 1 }); // still ice before Lv5
    expect(steps[2].board[0][3]).toMatchObject({ element: 2, isLink: true });
  });
});

describe("full board", () => {
  test("with fillBoard the best plan occupies all 25 cells without overlapping", () => {
    // Tileable without overlap: four 2×2 squares (top-left 4×4), then four pairs and one single
    // for the right column and bottom row. Per slot: two squares, one pair, one single.
    const pieces = ["2110110000", "2120110000", "1110000000", "1200000000"].map((code) => ({
      code,
    }));
    const mat = (slug: string) => ({
      slug,
      name: { en: slug, ja: slug, ko: slug, sc: slug, tc: slug },
      components: pieces,
    });
    const [best] = optimize({
      recipe: {
        panel: PANEL,
        effects: [{ elem: 2, maxlv: 30, data: [{ num: 5 }, { num: 10 }] }],
      },
      candidateMaterials: [[mat("a")], [mat("b")], [mat("c")], [mat("d")]],
      instanceMode: false,
      mode: "global",
      coopMaxLevel: {},
      maxComponents: 4,
      fillBoard: true,
    });
    expect(best.greatSuccess).toBe(25);
    // every material must put at least one piece on the board, or the synthesis cannot finish
    expect(new Set(best.placements.map((p) => p.slotIndex)).size).toBe(4);
    expect(
      best.steps
        .at(-1)!
        .board.flat()
        .every((c) => c.occupied),
    ).toBe(true);
  });
});

describe("co-op quality up (Olias, ice, Lv3)", () => {
  test("adds 3 quality per ice link once there are 3 links", () => {
    const s = createPanelState(PANEL);
    const coop = { 1: 3 } as Partial<Record<ElementColor, number>>;
    expect(qualityGain(s, { 1: 2 }, coop)).toBe(0);
    expect(qualityGain(s, { 1: 3 }, coop)).toBe(9);
    expect(qualityGain(s, { 1: 4 }, coop)).toBe(12);
    expect(qualityGain(s, { 1: 4 }, { 1: 0 })).toBe(0); // skill off
  });
});
