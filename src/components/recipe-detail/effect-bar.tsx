import { ElementIcon } from "../ui/element-icon.tsx";
import { useLocalized } from "../../hooks/use-localized.ts";
import { useT } from "../../lib/i18n.ts";
import { ELEMENT_COLORS } from "../../types/index.ts";
import { lineState } from "../../lib/optimizer/scoring.ts";
import type { EffectLine, ElementColor } from "../../types/index.ts";

export function EffectBarList({
  effects,
  fillValues,
  linkCounts,
}: {
  effects: EffectLine[];
  fillValues: Partial<Record<ElementColor, number>>;
  linkCounts?: Partial<Record<ElementColor, number>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {effects.map((line, i) => {
        const { value, unlocked } = lineState(
          line,
          fillValues[line.elem] ?? 0,
          linkCounts?.[line.elem] ?? 0,
        );
        return <EffectBarRow key={i} line={line} fillValue={value} unlocked={unlocked} />;
      })}
    </div>
  );
}

function EffectBarRow({
  line,
  fillValue,
  unlocked,
}: {
  line: EffectLine;
  fillValue: number;
  unlocked: number;
}) {
  const currentEffect = unlocked > 0 ? line.data[unlocked - 1] : undefined;
  const effectName = useLocalized(currentEffect?.effect?.name ?? currentEffect?.component?.name);
  const t = useT();
  const label = effectName || t("none");
  const maxNum = line.data[line.data.length - 1]?.num ?? 0;
  const elemColor = ELEMENT_COLORS[line.elem];

  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 mb-1">
        <ElementIcon element={line.elem} size={15} />
        <span
          className="flex-1 text-sm font-bold truncate"
          style={
            !currentEffect ? { fontStyle: "italic", color: "#988570", fontWeight: 500 } : undefined
          }
        >
          {label}
        </span>
        <span className="text-xs text-ink-3 font-medium">
          {fillValue} / {maxNum}
        </span>
      </div>
      <SegmentBar line={line} fillValue={fillValue} elemColor={elemColor} />
    </div>
  );
}

function SegmentBar({
  line,
  fillValue,
  elemColor,
}: {
  line: EffectLine;
  fillValue: number;
  elemColor: string;
}) {
  // Build segments from thresholds
  const segments: { start: number; end: number; restricted: boolean; beyondMax: boolean }[] = [];
  const data = line.data;

  for (let i = 0; i < data.length; i++) {
    const start = data[i].num;
    const end = data[i + 1]?.num ?? start + 4; // extend last group a bit
    const isRestricted = line.restrict != null && i >= line.restrict;
    const isBeyondMax = line.maxlv != null && start >= line.maxlv;
    segments.push({ start, end, restricted: isRestricted, beyondMax: isBeyondMax });
  }

  return (
    <div className="flex items-end">
      {segments.map((seg, i) => {
        const count = seg.end - seg.start;
        const filled = Math.max(0, Math.min(fillValue - seg.start, count));
        return (
          <div key={i} className="flex gap-px mr-1 last:mr-0">
            {Array.from({ length: count }, (_, j) => (
              <div
                key={j}
                className="rounded-[1px]"
                style={{
                  width: 8,
                  height: 18,
                  background: j < filled ? elemColor : "#d8ceb8",
                  opacity: seg.restricted ? 0.4 : seg.beyondMax ? 0.6 : 1,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
