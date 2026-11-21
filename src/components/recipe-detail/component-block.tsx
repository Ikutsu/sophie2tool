import { ELEMENT_COLORS } from "../../types/index.ts";
import type { Component } from "../../types/index.ts";
import { parseComponent } from "../../lib/optimizer/component.ts";

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
      className="inline-grid gap-px p-0.5 rounded relative"
      style={{
        gridTemplate: "repeat(3, 16px) / repeat(3, 16px)",
        background: "#2e2218",
        outline: selected ? `2px solid #c8a84e` : undefined,
        outlineOffset: selected ? "1px" : undefined,
        boxShadow: selected ? "0 0 8px rgba(200,168,78,0.3)" : undefined,
      }}
    >
      {grid.flatMap((row, r) =>
        row.map((cell, c) => {
          if (cell === 0) {
            return (
              <div key={`${r}-${c}`} className="rounded-sm" style={{ background: "#635353" }} />
            );
          }
          if (cell === 2) {
            return (
              <div
                key={`${r}-${c}`}
                className="rounded-sm flex items-center justify-center"
                style={{ background: "#2e2218" }}
              >
                <span style={{ color: elemColor, fontSize: 12, lineHeight: 1 }}>★</span>
              </div>
            );
          }
          return <div key={`${r}-${c}`} className="rounded-sm" style={{ background: elemColor }} />;
        }),
      )}
      {selected ? (
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold text-white text-[7px] font-bold flex items-center justify-center border border-[#a08030]">
          ✓
        </span>
      ) : null}
    </div>
  );
}
