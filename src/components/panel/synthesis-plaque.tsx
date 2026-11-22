import { useT } from "../../lib/i18n.ts";

/** The dark plaque under the in-game board: great-success chance with its bar,
 *  plus the quality the plan adds. */
export function SynthesisPlaque({
  greatSuccess,
  qualityGain,
}: {
  greatSuccess: number;
  qualityGain: number;
}) {
  const t = useT();
  return (
    <div
      className="mt-3 flex w-full max-w-[440px] items-stretch gap-3 rounded-xl border-2 border-[#1c1008] px-4 py-2 font-game text-[#f2e8d6] shadow-[inset_0_0_0_2px_#7a5c36,inset_0_0_0_4px_#2a1a0e,0_6px_18px_rgba(0,0,0,0.5)]"
      style={{ background: "linear-gradient(180deg, #4a301c, #2e1c10)" }}
    >
      <div className="flex shrink-0 flex-col justify-center border-r border-dashed border-[#7a5c36] pr-3">
        <span className="text-[11px] text-[#cbb898]">{t("quality")}</span>
        <span className="text-lg font-extrabold leading-tight tabular-nums">+{qualityGain}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-sm">{t("greatSuccessRate")}</span>
          <span className="text-2xl font-extrabold tabular-nums">
            {greatSuccess}
            <span className="text-base">%</span>
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#1a100a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, greatSuccess)}%`,
              background: "linear-gradient(90deg, #e8762a, #f4a040)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
