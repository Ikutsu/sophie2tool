import type { CSSProperties } from "react";
import type { PanelGrid as PanelGridType } from "../../types/index.ts";
import type { PanelState } from "../../lib/optimizer/types.ts";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import type { GridSize } from "../../stores/optimizer.ts";
import { PanelCell } from "./panel-cell.tsx";
import { cropPanel } from "../../lib/optimizer/placement.ts";
import { ConnectionLines } from "./connection-lines.tsx";
import { ElementCounter } from "./element-counter.tsx";
import "./panel.css";

// Cell, gap and padding keep the same proportions at every size so the link
// overlay (drawn in desktop units, scaled by its viewBox) stays aligned.
const SIZES = {
  mobile: { cell: 46, gap: 8, pad: 6 },
  tablet: { cell: 60, gap: 10, pad: 8 },
  desktop: { cell: 76, gap: 12, pad: 10 },
};

export function PanelGrid({
  panel,
  fillState,
  highlight,
}: {
  panel: PanelGridType;
  fillState?: PanelState;
  /** "row,col" keys of cells to outline (the guide's current step). */
  highlight?: Set<string>;
}) {
  const gridSize = useOptimizerStore((s) => s.gridSize);
  const setGridSize = useOptimizerStore((s) => s.setGridSize);
  const { cell: cellSize, gap, pad: padding } = SIZES.desktop;

  const visiblePanel = cropPanel(panel, gridSize);
  // fillState is already sized to gridSize by the optimizer — don't crop again
  const rows = visiblePanel.length;
  const cols = visiblePanel[0]?.length ?? 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <ElementCounter panelState={fillState} />
      <div className="flex gap-1 mb-1">
        {([5, 6, 7] as GridSize[]).map((s) => (
          <button
            key={s}
            onClick={() => setGridSize(s)}
            className={`px-3 py-1 rounded text-xs font-heading font-semibold cursor-pointer transition-colors ${
              s === gridSize
                ? "bg-gold text-ink"
                : "bg-[#2a2218] text-[#908068] border border-[#48402e] hover:bg-[#38301e]"
            }`}
          >
            {s}&times;{s}
          </button>
        ))}
      </div>
      <div className="panel-frame">
        <div
          className="panel-grid relative"
          style={
            {
              gridTemplateColumns: `repeat(${cols}, var(--cell-size))`,
              gridTemplateRows: `repeat(${rows}, var(--cell-size))`,
              "--cell-size": `${cellSize}px`,
              "--cell-gap": `${gap}px`,
              "--grid-pad": `${padding}px`,
            } as CSSProperties
          }
        >
          {fillState ? (
            <ConnectionLines
              panelState={fillState}
              cellSize={cellSize}
              gap={gap}
              padding={padding}
            />
          ) : null}
          {visiblePanel.flatMap((row, r) =>
            row.map((cell, c) => (
              <PanelCell
                key={`${r}-${c}`}
                value={cell}
                fillState={fillState?.[r]?.[c]}
                highlight={highlight?.has(`${r},${c}`)}
              />
            )),
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .panel-grid { --cell-size: ${SIZES.mobile.cell}px !important; --cell-gap: ${SIZES.mobile.gap}px !important; --grid-pad: ${SIZES.mobile.pad}px !important; }
          .panel-frame { padding: 6px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .panel-grid { --cell-size: ${SIZES.tablet.cell}px !important; --cell-gap: ${SIZES.tablet.gap}px !important; --grid-pad: ${SIZES.tablet.pad}px !important; }
        }
      `}</style>
    </div>
  );
}
