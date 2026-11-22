import { useLocalized } from "../../hooks/use-localized.ts";
import { useT } from "../../lib/i18n.ts";
import { KindBadge } from "../ui/kind-badge.tsx";
import type { Recipe } from "../../types/index.ts";

const CDN_BASE = "https://media.barrelwisdom.com/file/barrelwisdom/games/sophie2/items/";

/** Item header styled like the game's synthesis info panel: LV badge over a
 *  round item frame, stats in dark pills. */
export function ItemCard({
  recipe,
  quality,
}: {
  recipe: Recipe;
  /** The selected plan's predicted quality; base is null when material qualities aren't known. */
  quality?: { base: number | null; gain: number };
}) {
  const name = useLocalized(recipe.name);
  const t = useT();
  const stats: [string, string | number][] = [];
  if (recipe.uses) stats.push([t("uses"), recipe.uses]);
  if (recipe.quantity) stats.push([t("quantity"), recipe.quantity]);
  if (recipe.range) stats.push([t("range"), recipe.range]);

  return (
    <div>
      <div className="flex items-center gap-3 pb-1 pt-2">
        <div className="relative shrink-0">
          <img
            src={`${CDN_BASE}${recipe.slug}.webp`}
            alt={name}
            className="h-[72px] w-[72px] rounded-full border-4 border-[#cfc1a4] bg-[#f4eddf] object-contain p-2 shadow-[inset_0_0_0_1.5px_#ad9d7e,0_2px_6px_rgba(60,40,20,0.25)]"
          />
          <div className="absolute -left-2.5 -top-2.5 flex h-10 w-10 flex-col items-center justify-center rounded-full border-2 border-[#8a7e70] bg-white font-game leading-none shadow-[0_0_0_2px_#fff,0_1px_4px_rgba(0,0,0,0.25)]">
            <span className="text-[8px] font-bold text-ink-2">LV</span>
            <span className="text-base font-extrabold text-ink">{recipe.level}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 truncate font-game text-base font-bold">{name}</div>
          <div className="mb-1.5">
            <KindBadge kind={recipe.kind} />
          </div>
          <div className="flex flex-col gap-1">
            {stats.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-full bg-[#2c2622] px-3 py-0.5 font-game text-xs text-[#f2ece2]"
              >
                <span>{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {quality ? <QualityBox {...quality} /> : null}
    </div>
  );
}

/** The game's 品質 box: number, bar split into material quality (blue) and what the board adds (gold). */
function QualityBox({ base, gain }: { base: number | null; gain: number }) {
  const t = useT();
  const total = (base ?? 0) + gain;
  const basePct = base == null || total === 0 ? 0 : (base / total) * 100;
  return (
    <div
      className="mt-2 rounded-lg border-2 border-[#3a322c] bg-[#f6f1e8] px-3 pb-2 pt-1 font-game shadow-sm"
      title={
        base == null
          ? undefined
          : t("qualityBreakdown").replace("{base}", String(base)).replace("{gain}", `+${gain}`)
      }
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-2">{t("quality")}</span>
        <span className="text-xl font-bold tabular-nums text-ink">
          {base == null ? `+${gain}` : total}
        </span>
      </div>
      <div className="mt-0.5 flex h-2 overflow-hidden rounded-full bg-[#3a322c]">
        <div className="h-full bg-[#3fa8e0]" style={{ width: `${basePct}%` }} />
        <div className="h-full flex-1 bg-gradient-to-r from-[#f0c040] to-[#e8a020]" />
      </div>
    </div>
  );
}
