import { ElementIcon } from "../ui/element-icon.tsx";
import { useT } from "../../lib/i18n.ts";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useInventoryStore } from "../../stores/inventory.ts";
import { COMPANIONS, cellLabel } from "../../lib/companions.ts";
import type { PlanTrigger } from "../../lib/optimizer/replay.ts";

const LEVEL_OPTIONS = [0, 3, 5, 7];

export function CoopSkills({ coopTriggered }: { coopTriggered?: PlanTrigger[] }) {
  const t = useT();
  const coopMaxLevel = useOptimizerStore((s) => s.coopMaxLevel);
  const setCoopLevel = useOptimizerStore((s) => s.setCoopLevel);
  const companions = useInventoryStore((s) => s.companions);
  const hearts: Record<string, number> = Object.fromEntries(
    (companions ?? []).map((c) => [c.key, c.hearts]),
  );

  return (
    <div className="flex flex-col gap-1.5">
      {COMPANIONS.map((char) => {
        const name = t(char.nameKey);
        const triggers = coopTriggered?.filter((tr) => tr.element === char.element) ?? [];
        const triggeredLevel =
          triggers.length > 0 ? Math.max(...triggers.map((tr) => tr.level)) : 0;
        const isActive = triggeredLevel >= 3;
        const maxLevel = coopMaxLevel[char.element] ?? 0;

        const picks = triggers.filter((tr) => tr.cell);

        return (
          <div key={char.slug}>
            <div className="flex items-center gap-2 py-0.5 text-sm">
              <img
                src={`/images/characters/${char.slug}.webp`}
                alt={name}
                className={`w-7 h-7 rounded-full object-cover border-2 shrink-0 ${
                  isActive ? "border-copper shadow-[0_0_8px_rgba(176,112,48,0.3)]" : "border-border"
                }`}
              />
              <span className="flex-1 font-medium">
                {name}
                {hearts[char.slug] ? (
                  <span className="ml-1.5 text-[11px] text-copper" title={t("friendship")}>
                    ♥{hearts[char.slug]}
                  </span>
                ) : null}
              </span>
              <ElementIcon element={char.element} size={13} />
              <select
                value={maxLevel}
                onChange={(e) => setCoopLevel(char.element, Number(e.target.value))}
                className="text-xs bg-surface-dim border border-border rounded px-1 py-0.5 text-ink-2 cursor-pointer"
              >
                {LEVEL_OPTIONS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv === 0 ? "Off" : `Lv.${lv}`}
                  </option>
                ))}
              </select>
              {isActive ? (
                <span className="text-xs font-bold text-wind w-8 text-right">
                  Lv.{triggeredLevel}
                </span>
              ) : (
                <span className="text-xs font-bold text-ink-3 w-8 text-right">{t("unmet")}</span>
              )}
            </div>
            {picks.length > 0 ? (
              <div className="ml-9 text-[11px] text-copper" title={t("coopPickHint")}>
                {picks
                  .map(
                    (p) => `Lv.${p.level} → ${t("coopPick")} ${cellLabel(p.cell![0], p.cell![1])}`,
                  )
                  .join("  ·  ")}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
