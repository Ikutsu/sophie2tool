import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useT } from "../../lib/i18n.ts";
import { ElementIcon } from "../ui/element-icon.tsx";

/** "Effect combo" found nothing that reaches every target: say so, and how far off it is. */
export function MissedTargets() {
  const t = useT();
  const missed = useOptimizerStore((s) => s.missedTargets);
  if (!missed || missed.length === 0) return null;
  return (
    <div className="mt-3 w-full max-w-[440px] rounded-lg border border-[#8a4a2a] bg-[#3a1e12]/90 px-4 py-3 font-game text-sm text-[#f2e0cc]">
      <p className="mb-2">{t("comboUnreachable")}</p>
      <ul className="flex flex-col gap-1">
        {missed.map((m, i) => (
          <li key={i} className="flex items-center gap-2">
            <ElementIcon element={m.elem} size={12} badge />
            <span>
              {t("targetNeed")} {m.need} · {t("targetBest")} {m.got}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
