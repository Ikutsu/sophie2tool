import { ELEMENT_NAMES } from "../../types/index.ts";
import type { PanelCell as PanelCellType } from "../../types/index.ts";
import type { PanelCellState } from "../../lib/optimizer/types.ts";
import { elementVars } from "../../lib/element-style.ts";

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
  const hl = highlight ? " panel-cell--hl" : "";

  if (fillState?.occupied && fillState.element) {
    const elem = fillState.element;
    const name = ELEMENT_NAMES[elem];
    const shape = fillState.isLink ? "panel-cell--star" : `el-glyph-${name}`;
    return (
      <div
        className={`panel-cell panel-cell--placed ${shape}${hl}`}
        style={elementVars(elem)}
        title={`${name}${fillState.isLink ? " ★" : " ■"}`}
      />
    );
  }

  if (value === null || value === -1) {
    return <div className={`panel-cell panel-cell--empty${hl}`} />;
  }

  const name = ELEMENT_NAMES[value];
  return <div className={`panel-cell panel-cell--native el-glyph-${name}${hl}`} title={name} />;
}
