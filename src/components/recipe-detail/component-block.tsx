import { ELEMENT_COLORS } from "../../types/index.ts";
import type { Component } from "../../types/index.ts";
import { parseComponent } from "../../lib/optimizer/component.ts";
import { ElementIcon } from "../ui/element-icon.tsx";

/** A piece drawn like the game's material slots: a dark tag with the element
 *  glyph on its rounded end and the 3×3 shape beside it. */
export function ComponentBlock({
  component,
  selected = false,
}: {
  component: Component;
  selected?: boolean;
}) {
  const { element: color, grid } = parseComponent(component.code);
  const elemColor = ELEMENT_COLORS[color];

  return (
    <div
      className={`relative inline-flex rounded-md p-[3px] ${
        selected ? "bg-[#f6c640] shadow-[0_0_8px_rgba(246,198,64,0.7)]" : ""
      }`}
    >
      <div className="inline-flex items-center gap-1 rounded-l-full rounded-r-md bg-[#2c2420] py-1 pl-1.5 pr-1">
        <ElementIcon element={color} size={15} />
        <div
          className="inline-grid gap-[2px]"
          style={{ gridTemplate: "repeat(3, 12px) / repeat(3, 12px)" }}
        >
          {grid.flatMap((row, r) =>
            row.map((cell, c) =>
              cell === 2 ? (
                <span
                  key={`${r}-${c}`}
                  className="flex items-center justify-center text-[12px] leading-none"
                  style={{ color: elemColor }}
                >
                  ★
                </span>
              ) : (
                <span
                  key={`${r}-${c}`}
                  className="rounded-[2px]"
                  style={{ background: cell === 0 ? "#4a403a" : elemColor }}
                />
              ),
            ),
          )}
        </div>
      </div>
      {selected ? (
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#a08030] bg-gold text-[7px] font-bold text-white">
          ✓
        </span>
      ) : null}
    </div>
  );
}
