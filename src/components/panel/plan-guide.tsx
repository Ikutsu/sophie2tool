import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useLocalized } from "../../hooks/use-localized.ts";
import { useT } from "../../lib/i18n.ts";
import { SKILL_NAME_KEY, cellLabel, companionNameKey } from "../../lib/companions.ts";
import { rotateCode } from "../../lib/optimizer/component.ts";
import type { OptimizationResult } from "../../lib/optimizer/types.ts";
import type { PlanTrigger } from "../../lib/optimizer/replay.ts";
import { ComponentBlock } from "../recipe-detail/component-block.tsx";
import { ElementIcon } from "../ui/element-icon.tsx";

/** Step-by-step instructions for placing the selected plan in game. */
export function PlanGuide({ result }: { result: OptimizationResult }) {
  const t = useT();
  const guideStep = useOptimizerStore((s) => s.guideStep);
  const setGuideStep = useOptimizerStore((s) => s.setGuideStep);
  const steps = result.steps;
  if (steps.length === 0) return null;

  const i = guideStep;
  const picks = steps.flatMap((s) => s.triggers).filter((tr) => tr.cell);

  return (
    <div className="w-full max-w-[460px] mt-3 rounded-lg bg-[#2a2218] border border-[#48402e] p-3 text-[#e8dcc0]">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-heading text-sm font-semibold flex-1">{t("guideTitle")}</span>
        <button
          onClick={() => setGuideStep(null)}
          className={`text-xs px-2 py-1 rounded cursor-pointer ${i == null ? "bg-gold text-ink" : "bg-[#38301e] hover:bg-[#48402e]"}`}
        >
          {t("guideOverview")}
        </button>
        <button
          onClick={() => setGuideStep(i == null ? 0 : Math.max(0, i - 1))}
          disabled={i === 0}
          className="text-xs px-2 py-1 rounded bg-[#38301e] hover:bg-[#48402e] cursor-pointer disabled:opacity-40"
        >
          ◀
        </button>
        <span className="text-xs tabular-nums w-16 text-center">
          {i == null ? `— / ${steps.length}` : `${i + 1} / ${steps.length}`}
        </span>
        <button
          onClick={() => setGuideStep(i == null ? 0 : Math.min(steps.length - 1, i + 1))}
          disabled={i === steps.length - 1}
          className="text-xs px-2 py-1 rounded bg-[#38301e] hover:bg-[#48402e] cursor-pointer disabled:opacity-40"
        >
          ▶
        </button>
      </div>

      {i == null ? (
        <>
          <p className="text-xs text-[#b8a888]">{t("guideIntro")}</p>
          {picks.length > 0 ? (
            <ul className="mt-2 text-xs space-y-1">
              {picks.map((tr, k) => (
                <TriggerLine key={k} trigger={tr} withStep />
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <>
          <StepDetail result={result} index={i} />
          {i === steps.length - 1 ? (
            <p className="mt-2 text-xs text-[#b8a888]">{t("guideDone")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

function StepDetail({ result, index }: { result: OptimizationResult; index: number }) {
  const t = useT();
  const step = result.steps[index];
  const p = step.placement;
  const mat = p.slotIndex != null ? result.materials[p.slotIndex] : undefined;
  const name = useLocalized(mat?.name);
  const anchor = step.cells.find((c) => c.link) ?? step.cells[0];

  return (
    <div className="flex gap-3 items-start">
      <ComponentBlock component={{ code: rotateCode(p.componentCode, p.rotation) }} />
      <div className="text-xs space-y-1 flex-1">
        <div>
          <span className="text-[#b8a888]">{t("guideMaterial")}:</span>{" "}
          <span className="font-semibold">{name}</span>
          {mat?.instance ? (
            <span className="text-[#b8a888]">
              {" "}
              · {t("quality")} {mat.instance.quality}
            </span>
          ) : null}
        </div>
        <div>
          {p.rotation === 0 ? t("guideNoRotate") : `${t("guideRotate")} ${p.rotation}°`}
          {anchor ? ` · ${anchor.link ? "★" : "■"} → ${cellLabel(anchor.row, anchor.col)}` : null}
        </div>
        <div className="text-[#b8a888]">
          {t("guideCells")}:{" "}
          {step.cells.map((c) => `${cellLabel(c.row, c.col)}${c.link ? "★" : ""}`).join(" ")}
        </div>
        {step.triggers.length > 0 ? (
          <ul className="space-y-1 pt-1">
            {step.triggers.map((tr, k) => (
              <TriggerLine key={k} trigger={tr} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function TriggerLine({ trigger, withStep = false }: { trigger: PlanTrigger; withStep?: boolean }) {
  const t = useT();
  return (
    <li className="flex items-center gap-1.5 text-[#f0c040]">
      <ElementIcon element={trigger.element} size={12} />
      {withStep ? `${t("guideAfterStep")} ${trigger.afterStep + 1}: ` : null}
      {t(companionNameKey(trigger.element))} {t(SKILL_NAME_KEY[trigger.level])}
      {trigger.cell
        ? ` → ${t("coopPick")} ${cellLabel(trigger.cell[0], trigger.cell[1])}`
        : trigger.level > 3
          ? ` → ${t("guideAnyCell")}`
          : null}
    </li>
  );
}
