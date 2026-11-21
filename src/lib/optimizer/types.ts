import type { PlanStep } from "./replay.ts";
import type { Component, ElementColor, MultiLanguage, PanelGrid } from "../../types/index.ts";

export type Rotation = 0 | 90 | 180 | 270;

export interface ParsedComponent {
  element: ElementColor;
  grid: number[][]; // 3×3, values: 0=empty, 1=normal, 2=link
  code: string;
}

export interface Placement {
  componentCode: string;
  materialSlug: string;
  /** Ingredient slot the piece comes from (index into OptimizationResult.materials). */
  slotIndex?: number;
  /** Top-left of the piece's rotated 3×3 grid; may be negative when the grid has empty edges. */
  row: number;
  col: number;
  rotation: Rotation;
}

/** Each cell on the panel during optimization */
export interface PanelCellState {
  occupied: boolean;
  element?: ElementColor;
  isLink?: boolean; // ★ cell
  componentIndex?: number; // which component piece this cell belongs to
}

export type PanelState = PanelCellState[][];

/** A concrete owned item (inventory mode): fixed components, quality and traits. */
export interface InstanceInfo {
  id: number;
  quality: number;
  traits: number[];
  components: Component[];
}

export interface OptimizationResult {
  score: number;
  /** One entry per ingredient slot. In inventory mode `slug` is "<baseSlug>#<id>". */
  materials: { slug: string; baseSlug?: string; name: MultiLanguage; instance?: InstanceInfo }[];
  placements: Placement[];
  fillValues: Partial<Record<ElementColor, number>>;
  linkCounts: Partial<Record<ElementColor, number>>;
  panelState: PanelState;
  /** The plan piece by piece, in placing order; each step lists the co-op skills it set off. */
  steps: PlanStep[];
  /** Quality added on the board (cells + co-op quality up). */
  qualityGain: number;
  /** Great-success chance in %: one per occupied cell (verified while no row/column is full). */
  greatSuccess: number;
}

export type OptMode = "global" | "single" | "combo";

export interface OptimizeRequest {
  recipe: {
    panel: PanelGrid;
    effects: { elem: ElementColor; maxlv?: number; restrict?: number; data: { num: number }[] }[];
  };
  candidateMaterials: {
    slug: string;
    baseSlug?: string;
    name: MultiLanguage;
    components: Component[];
    instance?: InstanceInfo;
  }[][];
  /**
   * Inventory mode: each candidate is one owned item with fixed components.
   * The engine then picks one distinct instance per slot instead of merging pools.
   */
  instanceMode?: boolean;
  /** Prefer plans that occupy every cell (e.g. to test the full-board great-success bonus). */
  fillBoard?: boolean;
  mode: OptMode;
  targetLineIndex?: number; // for "single" mode: which effect line to maximize
  targetThresholds?: (number | null)[]; // for "combo" mode: target num per effect line (null = don't care)
  coopMaxLevel: Partial<Record<ElementColor, number>>;
  maxComponents: number; // max components to pick per material (1-4)
}
