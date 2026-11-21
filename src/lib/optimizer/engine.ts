import type { Component, ElementColor } from "../../types/index.ts";
import type {
  OptimizeRequest,
  OptimizationResult,
  PanelState,
  Placement,
  Rotation,
} from "./types.ts";
import { parseComponent, getAllRotations, getFilledCells } from "./component.ts";
import {
  createPanelState,
  clonePanelState,
  placeComponent,
  findValidPositions,
} from "./placement.ts";
import {
  calculateFillValues,
  calculateLinks,
  scoreResult,
  evaluatePosition,
  qualityGain,
  occupiedCells,
} from "./scoring.ts";
import { replayPlan } from "./replay.ts";

const TOP_N = 5;
const MAX_CATEGORY_CANDIDATES = 20;
const BEAM_WIDTH = 80;
/** Final states that get the full in-order replay (co-op cell search); the rest are cut by quickScore. */
const FULL_REPLAYS = TOP_N * 3;

// ─── Public entry point ────────────────────────────────────────────

export function optimize(request: OptimizeRequest): OptimizationResult[] {
  return request.instanceMode ? optimizeInventory(request) : optimizePools(request);
}

// ─── Scoring (one place for every term) ─────────────────────────────

/** "Fill the whole board" option: reward every occupied cell, and a full board a lot more. */
const FILL_PER_CELL = 3;
const FILL_FULL_BOARD = 40;

/** The optimizer's objective for one board. */
function boardScore(s: PanelState, request: OptimizeRequest): number {
  const links = calculateLinks(s);
  let score = scoreResult(
    calculateFillValues(s, request.recipe.panel),
    links,
    request.recipe.effects,
    request.mode,
    request.targetLineIndex,
    request.targetThresholds,
    qualityGain(s, links, request.coopMaxLevel),
  );
  if (request.fillBoard) {
    const n = occupiedCells(s);
    score += n * FILL_PER_CELL + (n === s.length * (s[0]?.length ?? 0) ? FILL_FULL_BOARD : 0);
  }
  return score;
}

/** Keep the first `n` results with distinct fingerprints (input sorted best-first). */
function topUnique<T>(items: T[], fingerprint: (t: T) => string, n: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const fp = fingerprint(it);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(it);
    if (out.length >= n) break;
  }
  return out;
}

// ─── Inventory mode: choose one owned instance per slot ────────────

const INSTANCES_PER_SLOT = 4; // alternatives tried per slot during local search
const SEARCH_PASSES = 2;

type Candidate = OptimizeRequest["candidateMaterials"][number][number];

/** Cheap prior for ordering instances: big, linked, effect-relevant components first. */
function instanceHeuristic(c: Candidate, effectElems: Set<ElementColor>): number {
  let s = (c.instance?.quality ?? 0) / 100;
  for (const comp of c.components) {
    const parsed = parseComponent(comp.code);
    const cells = getFilledCells(parsed.grid);
    const size = cells.length + cells.filter((x) => x.value === 2).length;
    s += effectElems.has(parsed.element) ? size : size * 0.3;
  }
  return s;
}

function optimizeInventory(request: OptimizeRequest): OptimizationResult[] {
  const effectElems = new Set(request.recipe.effects.map((e) => e.elem));
  const ranked = request.candidateMaterials.map((cands) =>
    cands
      .map((c) => ({ c, h: instanceHeuristic(c, effectElems) }))
      .sort((a, b) => b.h - a.h)
      .map((x) => x.c),
  );

  // Greedy start: best-looking instance per slot, never the same instance twice.
  const assign: number[] = [];
  const taken = new Set<string>();
  for (const cands of ranked) {
    const idx = cands.findIndex((c) => !taken.has(c.slug));
    if (idx < 0) return []; // not enough owned items for this recipe
    assign.push(idx);
    taken.add(cands[idx].slug);
  }

  const all: OptimizationResult[] = [];
  const scoreOf = new Map<string, number>();
  const evaluate = (a: number[]): number => {
    const key = a.join(",");
    const known = scoreOf.get(key);
    if (known !== undefined) return known;
    const results = optimizePools(
      {
        ...request,
        instanceMode: false,
        candidateMaterials: a.map((i, slot) => [ranked[slot][i]]),
      },
      true,
    );
    all.push(...results);
    const best = results[0]?.score ?? -Infinity;
    scoreOf.set(key, best);
    return best;
  };

  // Local search: swap one slot at a time while it improves the best plan.
  let best = evaluate(assign);
  for (let pass = 0; pass < SEARCH_PASSES; pass++) {
    let improved = false;
    for (let slot = 0; slot < assign.length; slot++) {
      const limit = Math.min(INSTANCES_PER_SLOT, ranked[slot].length);
      for (let alt = 0; alt < limit; alt++) {
        if (alt === assign[slot]) continue;
        const slug = ranked[slot][alt].slug;
        if (assign.some((i, s) => s !== slot && ranked[s][i].slug === slug)) continue;
        const trial = [...assign];
        trial[slot] = alt;
        const score = evaluate(trial);
        if (score > best) {
          best = score;
          assign.splice(0, assign.length, ...trial);
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  all.sort((a, b) => b.score - a.score);
  return topUnique(
    all,
    (r) => `${r.score}|${r.materials.map((m) => m.slug).join(",")}|${JSON.stringify(r.fillValues)}`,
    TOP_N,
  );
}

// ─── Pool mode (no inventory): merge each slot's component pools ───

/** keepDuplicates: an owned instance may carry identical components; each is a separate piece. */
function optimizePools(request: OptimizeRequest, keepDuplicates = false): OptimizationResult[] {
  const cap = Math.max(1, Math.min(request.maxComponents, 4));
  const slots = buildSlots(request.candidateMaterials, cap, keepDuplicates);
  const available = buildAvailableComponents(slots);

  // Beam search: incrementally place components, keeping the top states
  let beam: BeamState[] = [
    {
      panelState: createPanelState(request.recipe.panel),
      placements: [],
      usedPerSlot: slots.map(() => 0),
      compIdx: 0,
    },
  ];

  // Effect-matching components first, then those with more ★ cells
  const effectElems = new Set(request.recipe.effects.map((e) => e.elem));
  const sorted = [...available].sort(
    (a, b) =>
      Number(effectElems.has(b.element)) - Number(effectElems.has(a.element)) ||
      b.linkCells - a.linkCells,
  );

  for (const comp of sorted) {
    const nextBeam: BeamState[] = [];
    for (const state of beam) {
      // Branch 1: skip this component
      nextBeam.push(state);
      if (state.usedPerSlot[comp.slotIndex] >= cap) continue;

      // Branch 2: its best position on empty cells. No overlapping: in game a piece placed on top
      // of another removes that whole piece, so it never helps.
      let best: {
        row: number;
        col: number;
        rotation: Rotation;
        grid: number[][];
        score: number;
      } | null = null;
      for (const { grid, rotation } of comp.rotations) {
        for (const { row, col } of findValidPositions(state.panelState, grid)) {
          const score = evaluatePosition(
            state.panelState,
            request.recipe.panel,
            grid,
            comp.element,
            row,
            col,
          );
          if (!best || score > best.score) best = { row, col, rotation, grid, score };
        }
      }
      if (!best) continue;

      const panelState = clonePanelState(state.panelState);
      placeComponent(panelState, best.grid, comp.element, best.row, best.col, state.compIdx);
      const usedPerSlot = [...state.usedPerSlot];
      usedPerSlot[comp.slotIndex]++;
      nextBeam.push({
        panelState,
        placements: [
          ...state.placements,
          {
            componentCode: comp.code,
            materialSlug: comp.materialSlug,
            row: best.row,
            col: best.col,
            rotation: best.rotation,
            slotIndex: comp.slotIndex,
          },
        ],
        usedPerSlot,
        compIdx: state.compIdx + 1,
      });
    }
    beam = pruneBeam(nextBeam, request);
  }

  // Also offer each final board with its empty cells plugged by unused pieces.
  const completed = beam
    .map((s) => completeBoard(s, available, cap))
    .filter((s): s is BeamState => s != null);

  return extractResults([...beam, ...completed], request);
}

/**
 * Plug empty cells with pieces the plan has not used yet (respecting the per-material cap). Each
 * round places the most valuable piece that fits anywhere on empty cells: first a piece from a
 * material with nothing on the board yet (the game needs one from each), then the biggest.
 * Returns null if nothing fits.
 */
function completeBoard(
  state: BeamState,
  available: AvailableComponent[],
  cap: number,
): BeamState | null {
  const used = new Map<string, number>();
  for (const p of state.placements) {
    const k = `${p.slotIndex}:${p.componentCode}`;
    used.set(k, (used.get(k) ?? 0) + 1);
  }
  const unused = available.filter((ac) => {
    const k = `${ac.slotIndex}:${ac.code}`;
    const n = used.get(k) ?? 0;
    if (n > 0) used.set(k, n - 1);
    return n === 0;
  });

  const panelState = clonePanelState(state.panelState);
  const placements = [...state.placements];
  const usedPerSlot = [...state.usedPerSlot];
  let compIdx = state.compIdx;

  for (;;) {
    const order = unused
      .filter((ac) => usedPerSlot[ac.slotIndex] < cap)
      .sort(
        (a, b) =>
          Number(usedPerSlot[b.slotIndex] === 0) - Number(usedPerSlot[a.slotIndex] === 0) ||
          b.cellCount - a.cellCount,
      );
    let placed = false;
    for (const ac of order) {
      for (const { grid, rotation } of ac.rotations) {
        const [pos] = findValidPositions(panelState, grid);
        if (!pos) continue;
        placeComponent(panelState, grid, ac.element, pos.row, pos.col, compIdx++);
        placements.push({
          componentCode: ac.code,
          materialSlug: ac.materialSlug,
          row: pos.row,
          col: pos.col,
          rotation,
          slotIndex: ac.slotIndex,
        });
        usedPerSlot[ac.slotIndex]++;
        unused.splice(unused.indexOf(ac), 1);
        placed = true;
        break;
      }
      if (placed) break;
    }
    if (!placed) break;
  }

  return placements.length > state.placements.length
    ? { panelState, placements, usedPerSlot, compIdx }
    : null;
}

// ─── Types ─────────────────────────────────────────────────────────

interface AvailableComponent {
  code: string;
  element: ElementColor;
  linkCells: number; // number of ★ cells
  cellCount: number;
  rotations: { grid: number[][]; rotation: Rotation }[];
  slotIndex: number;
  materialSlug: string;
}

interface BeamState {
  panelState: PanelState;
  placements: (Placement & { slotIndex: number })[];
  usedPerSlot: number[]; // how many components used per slot
  compIdx: number; // next component index for componentIndex tracking
  /** Cached boardScore (states carried forward unchanged keep it). */
  score?: number;
}

interface SlotPool {
  slotIndex: number;
  materialSlug: string; // the slot's material (first candidate)
  components: Component[];
}

// ─── Slot building ─────────────────────────────────────────────────

function buildSlots(
  candidateMaterials: OptimizeRequest["candidateMaterials"],
  cap: number,
  keepDuplicates: boolean,
): SlotPool[] {
  return candidateMaterials.map((candidates, slotIndex) => {
    // Merge the components of the slot's candidate materials into one pool
    const seen = new Set<string>();
    const merged: Component[] = [];
    for (const mat of candidates.slice(0, MAX_CATEGORY_CANDIDATES)) {
      for (const comp of mat.components) {
        if (keepDuplicates || !seen.has(comp.code)) {
          seen.add(comp.code);
          merged.push(comp);
        }
      }
    }
    return {
      slotIndex,
      materialSlug: candidates[0]?.slug ?? "",
      components: merged.slice(0, cap * 3),
    };
  });
}

function buildAvailableComponents(slots: SlotPool[]): AvailableComponent[] {
  return slots.flatMap((slot) =>
    slot.components.map((comp) => {
      const parsed = parseComponent(comp.code);
      const cells = getFilledCells(parsed.grid);
      return {
        code: comp.code,
        element: parsed.element,
        linkCells: cells.filter((c) => c.value === 2).length,
        cellCount: cells.length,
        rotations: getAllRotations(comp.code),
        slotIndex: slot.slotIndex,
        materialSlug: slot.materialSlug,
      };
    }),
  );
}

// ─── Beam pruning ──────────────────────────────────────────────────

function quickScore(state: BeamState, request: OptimizeRequest): number {
  return (state.score ??= boardScore(state.panelState, request));
}

/** Same board ⇒ same score, whatever order the pieces went down in. */
function boardFingerprint(state: PanelState): string {
  return state
    .map((row) =>
      row.map((c) => (c.occupied ? `${c.element}${c.isLink ? "*" : ""}` : ".")).join(""),
    )
    .join("/");
}

function pruneBeam(beam: BeamState[], request: OptimizeRequest): BeamState[] {
  if (beam.length <= BEAM_WIDTH) return beam;
  const sorted = [...beam].sort((a, b) => quickScore(b, request) - quickScore(a, request));
  return topUnique(
    sorted,
    (s) => `${boardFingerprint(s.panelState)}#${s.usedPerSlot.join(",")}`,
    BEAM_WIDTH,
  );
}

// ─── Final result extraction ───────────────────────────────────────

/** The game cannot finish a synthesis while a material has no piece on the board. */
function usesEveryMaterial(state: BeamState, request: OptimizeRequest): boolean {
  return state.usedPerSlot.every((n, slot) => n > 0 || !request.candidateMaterials[slot]?.length);
}

function extractResults(states: BeamState[], request: OptimizeRequest): OptimizationResult[] {
  const nonEmpty = states.filter((s) => s.placements.length > 0);
  // Plans that leave a material unused cannot be finished; only fall back to them if nothing else.
  const finishable = nonEmpty.filter((s) => usesEveryMaterial(s, request));
  const pool = finishable.length > 0 ? finishable : nonEmpty;

  // Full replay (co-op skills in placing order, with the cell search) only for the best few.
  const shortlist = topUnique(
    pool.sort((a, b) => quickScore(b, request) - quickScore(a, request)),
    (s) => boardFingerprint(s.panelState),
    FULL_REPLAYS,
  );

  const materials = request.candidateMaterials.map((mats) => {
    const mat = mats[0];
    return {
      slug: mat?.slug ?? "",
      baseSlug: mat?.baseSlug,
      name: mat?.name,
      instance: mat?.instance,
    };
  }) as OptimizationResult["materials"];
  const evaluate = (s: PanelState) => boardScore(s, request);

  const results = shortlist.map((state): OptimizationResult => {
    const { steps, final } = replayPlan(
      request.recipe.panel,
      state.placements,
      request.coopMaxLevel,
      evaluate,
    );
    const linkCounts = calculateLinks(final);
    return {
      score: evaluate(final),
      materials,
      placements: state.placements,
      fillValues: calculateFillValues(final, request.recipe.panel),
      linkCounts,
      panelState: final,
      qualityGain: qualityGain(final, linkCounts, request.coopMaxLevel),
      greatSuccess: occupiedCells(final),
      steps,
    };
  });

  results.sort((a, b) => b.score - a.score);
  return topUnique(results, (r) => `${r.score}|${JSON.stringify(r.fillValues)}`, TOP_N);
}
