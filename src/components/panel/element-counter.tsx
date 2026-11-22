import { ElementIcon } from "../ui/element-icon.tsx";
import type { ElementColor } from "../../types/index.ts";
import type { PanelState } from "../../lib/optimizer/types.ts";
import { calculateLinks } from "../../lib/optimizer/scoring.ts";

const ELEMENTS: ElementColor[] = [4, 1, 3, 2, 5]; // fire, ice, lightning, wind, light

/** The bar above the in-game board: link count per element for the board shown. */
export function ElementCounter({ panelState }: { panelState?: PanelState }) {
  const links = panelState ? calculateLinks(panelState) : {};

  return (
    <div className="relative flex max-w-full rounded-xl border-2 border-[#b8b0a2] bg-[#ebe6dc]/95 shadow-md">
      {ELEMENTS.map((elem, i) => (
        <div
          key={elem}
          className={`flex items-center gap-1 px-1.5 py-1.5 sm:gap-1.5 sm:px-2 xl:gap-3 xl:px-4 ${
            i > 0 ? "border-l-2 border-dotted border-[#a8a094]" : ""
          }`}
        >
          <ElementIcon element={elem} size={15} badge />
          <span className="min-w-[1.4em] text-right font-game text-base font-bold sm:text-lg text-[#3a322c] tabular-nums">
            {links[elem] ?? 0}
          </span>
        </div>
      ))}
      {/* pointer toward the board, as in game */}
      <span className="absolute left-1/2 -bottom-[9px] -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-[#b8b0a2]" />
    </div>
  );
}
