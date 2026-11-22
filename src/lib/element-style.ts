import type { CSSProperties } from "react";
import type { ElementColor } from "../types/index.ts";

/** Gem shades per element, matched to the in-game synthesis board. */
const PALETTE: Record<ElementColor, { hi: string; base: string; low: string }> = {
  1: {
    hi: "#b4ecff",
    base: "#3fb2ec",
    low: "#14609c",
  },
  2: {
    hi: "#c4ff96",
    base: "#4fd636",
    low: "#1c7a12",
  },
  3: {
    hi: "#fff6a8",
    base: "#f0cc30",
    low: "#987c0c",
  },
  4: {
    hi: "#ffc8a4",
    base: "#f0703a",
    low: "#9a3412",
  },
  5: {
    hi: "#f4e2ff",
    base: "#c89ae0",
    low: "#6e4c94",
  },
};

/** CSS custom properties consumed by .panel-cell (see panel.css). */
export function elementVars(el: ElementColor): CSSProperties {
  const p = PALETTE[el];
  return {
    "--el-hi": p.hi,
    "--el-base": p.base,
    "--el-low": p.low,
  } as CSSProperties;
}
