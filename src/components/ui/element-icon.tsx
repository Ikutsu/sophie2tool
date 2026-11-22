import { ELEMENT_NAMES, ELEMENT_COLORS } from "../../types/index.ts";
import type { ElementColor } from "../../types/index.ts";

/**
 * The element symbol in its color, as the game draws it (see lib/element-glyphs.ts).
 * `badge` puts it on a dark round plate like the counter bar and effect lines.
 */
export function ElementIcon({
  element,
  className = "",
  size = 16,
  badge = false,
}: {
  element: ElementColor;
  className?: string;
  size?: number;
  badge?: boolean;
}) {
  const name = ELEMENT_NAMES[element];
  const symbol = (
    <span
      className={`el-shape el-${name} ${badge ? "" : className}`}
      style={{ width: size * 1.25, height: size * 1.25, color: ELEMENT_COLORS[element] }}
      title={name}
    />
  );
  if (!badge) return symbol;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#2c2622] shadow-[inset_0_0_0_1.5px_#4a423c] ${className}`}
      style={{ width: size * 1.75, height: size * 1.75 }}
    >
      {symbol}
    </span>
  );
}
