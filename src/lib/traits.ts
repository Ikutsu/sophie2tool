import { create } from "zustand";
import type { MultiLanguage, RecipeKind } from "../types/index.ts";
import type { OptimizationResult } from "./optimizer/types.ts";

/** One trait from public/data/traits.json (built by scripts/build-traits.py). */
export interface TraitInfo {
  name: MultiLanguage;
  /** The two traits that merge into this one when both are inherited. */
  from?: [number, number];
  /** Recipe kinds that can take this trait; absent = all. */
  kinds?: RecipeKind[];
}
export type TraitTable = Record<number, TraitInfo>;

interface TraitsState {
  table: TraitTable | null;
  load: () => Promise<void>;
}

export const useTraitsStore = create<TraitsState>((set, get) => ({
  table: null,
  load: async () => {
    if (get().table) return;
    const res = await fetch("/data/traits.json");
    set({ table: (await res.json()) as TraitTable });
  },
}));

export interface InheritedTrait {
  id: number;
  /** Set when the trait came from merging two others. */
  from?: [number, number];
  /** Whether this recipe's kind can take the trait (intermediate "mix" items take all). */
  allowed: boolean;
}

/**
 * The game's inherit list: every trait on the materials used, duplicates once,
 * with pairs that have a combination merged into it (攻擊加成 + 防禦加成 → 攻防加成),
 * repeated until nothing merges. When a trait could merge two ways, the lower
 * result id wins (not verified in game).
 */
export function inheritableTraits(
  traitIds: number[],
  table: TraitTable,
  kind: RecipeKind,
): InheritedTrait[] {
  const list: InheritedTrait[] = [];
  for (const id of traitIds) {
    if (!list.some((t) => t.id === id)) list.push({ id, allowed: true });
  }
  const recipes = Object.entries(table)
    .filter(([, t]) => t.from)
    .map(([id, t]) => ({ id: Number(id), from: t.from as [number, number] }));
  for (let merged = true; merged; ) {
    merged = false;
    for (const r of recipes) {
      const a = list.findIndex((t) => t.id === r.from[0]);
      const b = list.findIndex((t) => t.id === r.from[1]);
      if (a < 0 || b < 0 || a === b) continue;
      list.splice(Math.max(a, b), 1);
      list.splice(Math.min(a, b), 1, { id: r.id, from: r.from, allowed: true });
      merged = true;
      break;
    }
  }
  for (const t of list) {
    const kinds = table[t.id]?.kinds;
    t.allowed = kind === "mix" || !kinds || kinds.includes(kind);
  }
  return list;
}

/** Traits carried by the owned instances a plan uses (inventory mode only). */
export function planTraitIds(result: OptimizationResult): number[] | null {
  const instances = result.materials.map((m) => m.instance);
  if (instances.some((i) => !i)) return null;
  return instances.flatMap((i) => i!.traits);
}

/**
 * Quality before trait effects: the materials' average (rounded down) plus what the
 * board adds. Null outside inventory mode, where material qualities aren't known.
 */
export function planQuality(result: OptimizationResult): { base: number; gain: number } | null {
  const instances = result.materials.map((m) => m.instance);
  if (instances.length === 0 || instances.some((i) => !i)) return null;
  const base = Math.floor(instances.reduce((s, i) => s + i!.quality, 0) / instances.length);
  return { base, gain: result.qualityGain };
}
