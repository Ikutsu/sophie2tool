import { ELEMENT_NAMES, ELEMENT_COLORS } from "../../types/index.ts";
import type { ElementColor } from "../../types/index.ts";

const ICON_CLASS: Record<ElementColor, string> = {
  1: "el-ice",
  2: "el-wind",
  3: "el-lightning",
  4: "el-fire",
  5: "el-light",
};

export function ElementIcon({
  element,
  className = "",
  size = 16,
}: {
  element: ElementColor;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`el ${ICON_CLASS[element]} ${className}`}
      style={{ fontSize: size, color: ELEMENT_COLORS[element] }}
      title={ELEMENT_NAMES[element]}
    />
  );
}
