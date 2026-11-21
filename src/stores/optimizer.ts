import { create } from "zustand";
import type { Recipe, ElementColor, Material } from "../types/index.ts";
import type { OptimizationResult, OptimizeRequest, OptMode } from "../lib/optimizer/types.ts";
import OptimizerWorker from "../lib/optimizer/worker.ts?worker";
import { cropPanel } from "../lib/optimizer/placement.ts";
import { useInventoryStore } from "./inventory.ts";

export type GridSize = 5 | 6 | 7;

type CoopLevels = Partial<Record<ElementColor, number>>;
const COOP_KEY = "sophie2.coopMaxLevel.v1";
const DEFAULT_COOP: CoopLevels = { 1: 7, 2: 7, 3: 7, 4: 7, 5: 7 };

function loadCoop(): CoopLevels {
  try {
    const raw = localStorage.getItem(COOP_KEY);
    return raw ? { ...DEFAULT_COOP, ...(JSON.parse(raw) as CoopLevels) } : DEFAULT_COOP;
  } catch {
    return DEFAULT_COOP;
  }
}

function saveCoop(levels: CoopLevels): void {
  try {
    localStorage.setItem(COOP_KEY, JSON.stringify(levels));
  } catch {
    /* not persisted; still applies for this session */
  }
}

/**
 * Highest co-op skill a companion can trigger, from friendship hearts (per the PRD:
 * 2 hearts → 3-link skill, 3 → 5-link, 4 → 7-link; 5 → 10-link "add material" is not modelled).
 * Not yet verified in game.
 */
export function coopLevelFromHearts(hearts: number): number {
  return hearts >= 4 ? 7 : hearts === 3 ? 5 : hearts === 2 ? 3 : 0;
}

interface OptimizerState {
  results: OptimizationResult[] | null;
  selectedIndex: number;
  /** Step shown by the placement guide (index into result.steps); null = finished board. */
  guideStep: number | null;
  running: boolean;
  /** Inventory mode only: some ingredient slot has fewer owned items than needed. */
  inventoryShortage: boolean;
  coopMaxLevel: CoopLevels; // 0=off, 3, 5, 7
  mode: OptMode;
  gridSize: GridSize;
  maxComponents: number; // max components to pick per material (1-4)
  fillBoard: boolean;
  setFillBoard: (on: boolean) => void;

  setMode: (mode: OptMode) => void;
  setCoopLevel: (element: ElementColor, level: number) => void;
  /** Set every companion's max co-op level at once (e.g. from game friendship). */
  setCoopLevels: (levels: CoopLevels) => void;
  setSelectedIndex: (index: number) => void;
  setGuideStep: (step: number | null) => void;
  setGridSize: (size: GridSize) => void;
  setMaxComponents: (n: number) => void;
  optimize: (recipe: Recipe, materials: Material[]) => void;
  clear: () => void;
}

export const useOptimizerStore = create<OptimizerState>((set, get) => ({
  results: null,
  selectedIndex: 0,
  guideStep: null,
  running: false,
  inventoryShortage: false,
  coopMaxLevel: loadCoop(),
  mode: "global",
  gridSize: 5,
  maxComponents: 4,
  fillBoard: false,
  setFillBoard: (on) => set({ fillBoard: on }),

  setMode: (mode) => set({ mode }),
  setCoopLevel: (element, level) => get().setCoopLevels({ [element]: level }),
  setCoopLevels: (levels) => {
    const coopMaxLevel = { ...get().coopMaxLevel, ...levels };
    saveCoop(coopMaxLevel);
    set({ coopMaxLevel });
  },
  setSelectedIndex: (index) => set({ selectedIndex: index, guideStep: null }),
  setGuideStep: (step) => set({ guideStep: step }),
  setGridSize: (size) => set({ gridSize: size, results: null, selectedIndex: 0 }),
  setMaxComponents: (n) => set({ maxComponents: n }),

  optimize: (recipe: Recipe, allMaterials: Material[]) => {
    if (!recipe.panel) return;
    set({ running: true, results: null, selectedIndex: 0, guideStep: null });

    const croppedPanel = cropPanel(recipe.panel, get().gridSize);

    // Build candidate materials per ingredient slot
    // Expand quantity > 1 into multiple slots (e.g., Taun x2 → 2 slots)
    const matchesIngredient = (m: Material, ing: Recipe["ingredient"][number]) =>
      ing.item
        ? m.slug === ing.item.slug
        : ing.cat
          ? m.categories.some((c) => c.slug === ing.cat!.slug)
          : false;

    const inv = useInventoryStore.getState();
    const instanceMode = inv.useInventory && inv.items != null;
    let candidateMaterials: OptimizeRequest["candidateMaterials"];

    if (instanceMode) {
      // Inventory mode: every owned item is its own candidate with fixed components.
      const bySlug = new Map(allMaterials.map((m) => [m.slug, m]));
      const ownedPerIngredient = recipe.ingredient.map((ing) =>
        inv.items!.flatMap((o) => {
          const mat = bySlug.get(o.slug);
          if (!mat || !matchesIngredient(mat, ing)) return [];
          return [
            {
              slug: `${mat.slug}#${o.id}`,
              baseSlug: mat.slug,
              name: mat.name,
              components: o.components,
              instance: {
                id: o.id,
                quality: o.quality,
                traits: o.traits,
                components: o.components,
              },
            },
          ];
        }),
      );
      candidateMaterials = recipe.ingredient.flatMap((ing, i) =>
        Array.from({ length: ing.quantity }, () => ownedPerIngredient[i]),
      );
      if (recipe.ingredient.some((ing, i) => ownedPerIngredient[i].length < ing.quantity)) {
        set({ running: false, results: [], inventoryShortage: true });
        return;
      }
    } else {
      candidateMaterials = recipe.ingredient.flatMap((ing) => {
        const mats = allMaterials.filter((m) => matchesIngredient(m, ing));
        return Array.from({ length: ing.quantity }, () => mats);
      });
    }
    set({ inventoryShortage: false });

    const request: OptimizeRequest = {
      recipe: { panel: croppedPanel, effects: recipe.effects },
      candidateMaterials,
      instanceMode,
      mode: get().mode,
      coopMaxLevel: { ...get().coopMaxLevel },
      maxComponents: get().maxComponents,
      fillBoard: get().fillBoard,
    };

    const worker = new OptimizerWorker();
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        set({ results: e.data.results, running: false });
        worker.terminate();
      }
    };
    worker.onerror = () => {
      set({ running: false });
      worker.terminate();
    };
    worker.postMessage(request);
  },

  clear: () => set({ results: null, selectedIndex: 0, guideStep: null, running: false }),
}));
