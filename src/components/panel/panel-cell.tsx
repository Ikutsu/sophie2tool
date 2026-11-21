import { ELEMENT_NAMES } from "../../types/index.ts";
import type { PanelCell as PanelCellType } from "../../types/index.ts";
import type { PanelCellState } from "../../lib/optimizer/types.ts";

export function PanelCell({
  value,
  fillState,
  highlight = false,
}: {
  value: PanelCellType;
  fillState?: PanelCellState;
  /** Cell placed in the guide's current step. */
  highlight?: boolean;
}) {
  const ring = highlight
    ? { outline: "3px solid #f0c040", outlineOffset: "-3px", borderRadius: "22%" }
    : undefined;
  // Placed component cell → clearly visible (placed)
  if (fillState?.occupied && fillState.element) {
    const elem = fillState.element;
    const className = `panel-cell--${ELEMENT_NAMES[elem]}${fillState.isLink ? "-bright" : ""}`;
    return (
      <div
        className={`panel-cell panel-cell--elem panel-cell--placed ${className}`}
        style={ring}
        title={`${ELEMENT_NAMES[elem]}${fillState.isLink ? " ★" : " ■"}`}
      />
    );
  }

  // Empty cell (no element)
  if (value === null || value === -1) {
    return <div className="panel-cell panel-cell--empty" />;
  }

  // Native panel element cell (unfilled) → dark bg with faint icon only
  return (
    <div
      className={`panel-cell panel-cell--native-icon panel-cell--native-icon-${ELEMENT_NAMES[value]}`}
      title={ELEMENT_NAMES[value]}
    />
  );
}
