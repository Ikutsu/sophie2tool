import { ElementIcon } from "../ui/element-icon.tsx";
import { useLocalized } from "../../hooks/use-localized.ts";
import { useT } from "../../lib/i18n.ts";
import { lineState } from "../../lib/optimizer/scoring.ts";
import { parseComponent } from "../../lib/optimizer/component.ts";
import { elementVars } from "../../lib/element-style.ts";
import { ELEMENT_COLORS } from "../../types/index.ts";
import type { Component, EffectLine, ElementColor } from "../../types/index.ts";

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
        const links = linkCounts?.[line.elem] ?? 0;
        const { value, unlocked } = lineState(line, fillValues[line.elem] ?? 0, links);
        return (
          <EffectBarRow key={i} line={line} fillValue={value} unlocked={unlocked} links={links} />
        );
      })}
    </div>
  );
}

function EffectBarRow({
  line,
  fillValue,
  unlocked,
  links,
}: {
  line: EffectLine;
  fillValue: number;
  unlocked: number;
  links: number;
}) {
  const currentEffect = unlocked > 0 ? line.data[unlocked - 1] : undefined;
  const effectName = useLocalized(currentEffect?.effect?.name ?? currentEffect?.component?.name);
  const t = useT();
  const label = effectName || t("none");
  const maxNum = line.data[line.data.length - 1]?.num ?? 0;

  return (
    <div className="flex items-start gap-2 border-b border-dashed border-[#cfc5b4] pb-2 last:border-b-0">
      <ElementIcon element={line.elem} size={15} badge className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-1.5">
          <span
            className={`flex-1 truncate font-game text-sm ${
              currentEffect ? "font-bold text-ink" : "font-medium text-ink-3"
            }`}
          >
            {label}
          </span>
          <span className="font-game text-xs font-bold text-ink-3 tabular-nums">
            {fillValue} / {maxNum}
          </span>
        </div>
        <SegmentBar line={line} fillValue={fillValue} links={links} />
      </div>
      {currentEffect?.component ? (
        <GrantedComponent component={currentEffect.component} name={effectName} />
      ) : null}
    </div>
  );
}

const GROUP = 5;

/** The in-game gauge: one block per point up to the last threshold this line can
 *  unlock, in groups of five split by a dot. Threshold blocks are tall; points
 *  above the current cap (max level + links) are grey. */
function SegmentBar({
  line,
  fillValue,
  links,
}: {
  line: EffectLine;
  fillValue: number;
  links: number;
}) {
  const usable = line.data.slice(0, Math.min(line.restrict ?? line.data.length, line.data.length));
  const total = usable[usable.length - 1]?.num ?? 0;
  const thresholds = new Set(usable.map((d) => d.num));
  const cap = (line.maxlv ?? Infinity) + links;

  const groups: number[][] = [];
  for (let p = 1; p <= total; p++) {
    if ((p - 1) % GROUP === 0) groups.push([]);
    groups[groups.length - 1].push(p);
  }

  return (
    <div className="flex flex-wrap items-end gap-y-1" style={elementVars(line.elem)}>
      {groups.map((points, g) => (
        <div key={g} className="flex items-end">
          {g > 0 ? <span className="mx-1 mb-[3px] h-1 w-1 rotate-45 bg-[#b8ad9a]" /> : null}
          <div className="flex items-end gap-px">
            {points.map((p) => (
              <span
                key={p}
                className="w-[7px] rounded-[2px]"
                style={{
                  height: thresholds.has(p) ? 18 : 11,
                  background:
                    p > cap
                      ? "#bdb5a6"
                      : p <= fillValue
                        ? "linear-gradient(var(--el-hi), var(--el-base) 70%)"
                        : "#3a322c",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small 3×3 icon of the component an effect adds to the finished item, as the game
 *  shows at the right of the line. */
function GrantedComponent({ component, name }: { component: Component; name: string }) {
  const { element, grid } = parseComponent(component.code);
  const color = ELEMENT_COLORS[element];
  return (
    <div
      className="mt-0.5 inline-grid shrink-0 gap-px rounded-[3px] bg-[#2c2420] p-[2px]"
      style={{ gridTemplate: "repeat(3, 7px) / repeat(3, 7px)" }}
      title={name}
    >
      {grid.flatMap((row, r) =>
        row.map((cell, c) =>
          cell === 2 ? (
            <span
              key={`${r}-${c}`}
              className="flex items-center justify-center text-[8px] leading-none"
              style={{ color }}
            >
              ★
            </span>
          ) : (
            <span
              key={`${r}-${c}`}
              className="rounded-[1px]"
              style={{ background: cell === 0 ? "#4a403a" : color }}
            />
          ),
        ),
      )}
    </div>
  );
}
