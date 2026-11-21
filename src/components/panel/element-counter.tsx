import { ElementIcon } from "../ui/element-icon.tsx";
import type { PanelGrid, ElementColor } from "../../types/index.ts";

const ELEMENTS: ElementColor[] = [4, 1, 3, 2, 5]; // fire, ice, lightning, wind, light

export function ElementCounter({ panel }: { panel: PanelGrid }) {
  const counts = new Map<ElementColor, number>();
  for (const row of panel) {
    for (const cell of row) {
      if (cell !== null && cell !== -1) {
        counts.set(cell, (counts.get(cell) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="flex gap-5 mb-3 px-5 py-1.5 bg-surface/95 rounded-2xl border border-border shadow-sm inline-flex">
      {ELEMENTS.map((elem) => (
        <div key={elem} className="flex items-center gap-1.5">
          <ElementIcon element={elem} size={16} />
          <span className="text-sm font-bold min-w-[14px] text-center">
            {counts.get(elem) ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}
