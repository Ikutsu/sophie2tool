import { useEffect } from "react";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useLanguageStore } from "../../stores/language.ts";
import { useT } from "../../lib/i18n.ts";
import { inheritableTraits, planTraitIds, useTraitsStore } from "../../lib/traits.ts";
import type { Recipe } from "../../types/index.ts";

/** The game's 繼承特性一覽: traits this plan's materials pass on, merges applied. */
export function InheritedTraits({ recipe }: { recipe: Recipe }) {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const result = useOptimizerStore((s) => s.results?.[s.selectedIndex]);
  const { table, load } = useTraitsStore();
  useEffect(() => void load(), [load]);

  if (!result) return null;
  const ids = planTraitIds(result);
  const name = (id: number) => table?.[id]?.name[lang] || table?.[id]?.name.en || `#${id}`;

  return (
    <div className="mx-2 my-3 overflow-hidden rounded-lg border border-[#d4c9b6] bg-[#f6f1e8]/95 shadow-[0_1px_3px_rgba(60,40,20,0.15)]">
      <div className="bg-[#2c2622] px-3 py-1.5 text-center font-game text-sm font-bold text-[#f2ece2]">
        {t("inheritedTraits")}
      </div>
      {ids == null ? (
        <p className="px-3 py-2.5 text-xs text-ink-3">{t("traitsNeedInventory")}</p>
      ) : !table ? null : (
        <ul className="flex flex-col gap-1.5 p-2">
          {inheritableTraits(ids, table, recipe.kind).map((tr) => (
            <li
              key={tr.id}
              className={`rounded-md border px-3 py-1.5 ${
                !tr.allowed
                  ? "border-[#ddd4c4] bg-[#eee8dd] text-ink-3"
                  : tr.from
                    ? "border-[#e0b830] bg-[#f8dc5a] text-[#4a3a10]"
                    : "border-[#ddd4c4] bg-white/80 text-ink"
              }`}
            >
              <div className={`font-game text-sm font-bold ${tr.allowed ? "" : "line-through"}`}>
                {name(tr.id)}
              </div>
              {tr.from ? (
                <div className="font-game text-[11px] text-[#6a5a20]">
                  {name(tr.from[0])} × {name(tr.from[1])}
                </div>
              ) : null}
              {!tr.allowed ? (
                <div className="font-game text-[11px]">{t("traitNotForKind")}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
