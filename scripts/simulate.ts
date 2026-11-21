/// <reference types="node" />
/**
 * Run the optimizer's scoring code on an explicit board, for checking rules against the game.
 *
 *   node scripts/simulate.ts experiment.json
 *
 * experiment.json:
 * {
 *   "recipe": "sedative-ointment",
 *   "size": 5,                                   // board size (5 = no catalyst)
 *   "placements": [                              // the board as seen in game: cells each piece occupies
 *     { "element": 1, "cells": [[0,0],[1,1]], "links": [[0,0]] }   // element in code digits 1..5
 *   ]
 * }
 * Prints per-element cell counts with and without the same-color bonus, and link counts,
 * in the game's order (fire, ice, thunder, wind, light).
 */
import { readFileSync } from "node:fs";
import { calculateFillValues, calculateLinks } from "../src/lib/optimizer/scoring.ts";
import { createPanelState, cropPanel } from "../src/lib/optimizer/placement.ts";
import type { ElementColor, PanelGrid } from "../src/types/index.ts";

interface Placement {
  element: ElementColor;
  cells: [number, number][];
  links?: [number, number][];
}

const exp = JSON.parse(readFileSync(process.argv[2], "utf8")) as {
  recipe: string;
  size: number;
  placements: Placement[];
};

const recipes = JSON.parse(
  readFileSync(new URL("../public/data/recipes.json", import.meta.url), "utf8"),
) as { slug: string; panel?: PanelGrid }[];
const recipe = recipes.find((r) => r.slug === exp.recipe);
if (!recipe?.panel) throw new Error(`no panel for ${exp.recipe}`);
const panel = cropPanel(recipe.panel, exp.size);

const state = createPanelState(panel);
exp.placements.forEach((p, i) => {
  const links = new Set((p.links ?? []).map(([r, c]) => `${r},${c}`));
  for (const [r, c] of p.cells) {
    state[r][c] = {
      occupied: true,
      element: p.element,
      isLink: links.has(`${r},${c}`),
      componentIndex: i,
    };
  }
});

const GAME_ORDER: [string, ElementColor][] = [
  ["fire", 4],
  ["ice", 1],
  ["thunder", 3],
  ["wind", 2],
  ["light", 5],
];
const withBonus = calculateFillValues(state, panel);
const noBonus = calculateFillValues(
  state,
  panel.map((row) => row.map(() => -1)),
);
const links = calculateLinks(state);
const pick = (m: Partial<Record<ElementColor, number>>) => GAME_ORDER.map(([, e]) => m[e] ?? 0);

console.log(
  JSON.stringify({
    order: GAME_ORDER.map(([n]) => n),
    cellsWithBonus: pick(withBonus),
    cellsNoBonus: pick(noBonus),
    links: pick(links),
    board: state.map((row) =>
      row.map((c) => (c.occupied ? `${c.element}${c.isLink ? "*" : ""}` : ".")).join(" "),
    ),
  }),
);
