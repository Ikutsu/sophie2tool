import type { PanelGrid as PanelGridType } from "../../types/index.ts";
import type { PanelState } from "../../lib/optimizer/types.ts";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import type { GridSize } from "../../stores/optimizer.ts";
import { PanelCell } from "./panel-cell.tsx";
import { cropPanel } from "../../lib/optimizer/placement.ts";
import { ConnectionLines } from "./connection-lines.tsx";
import { ElementCounter } from "./element-counter.tsx";
import "./panel.css";

const CELL_SIZES = { mobile: 48, tablet: 60, desktop: 80 };

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
  const cellSize = CELL_SIZES.desktop;
  const gap = 6;
  const padding = 8;

  const visiblePanel = cropPanel(panel, gridSize);
  // fillState is already sized to gridSize by the optimizer — don't crop again
  const rows = visiblePanel.length;
  const cols = visiblePanel[0]?.length ?? 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <ElementCounter panel={visiblePanel} />
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
          style={{
            gridTemplateColumns: `repeat(${cols}, var(--cell-size, ${cellSize}px))`,
            gridTemplateRows: `repeat(${rows}, var(--cell-size, ${cellSize}px))`,
            // @ts-expect-error CSS custom properties
            "--cell-size": `${cellSize}px`,
          }}
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
          .panel-grid { --cell-size: ${CELL_SIZES.mobile}px !important; gap: 3px !important; padding: 4px !important; }
          .panel-frame { padding: 4px; }
          .panel-cell::after { font-size: 24px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .panel-grid { --cell-size: ${CELL_SIZES.tablet}px !important; gap: 4px !important; }
          .panel-cell::after { font-size: 30px !important; }
        }
      `}</style>
    </div>
  );
}
