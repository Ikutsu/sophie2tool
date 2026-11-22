import { useT } from "../../lib/i18n.ts";

const DOWNLOAD_URL =
  "https://github.com/Ikutsu/sophie2tool/releases/latest/download/sophie2-bridge.exe";
const SOURCE_URL = "https://github.com/Ikutsu/sophie2tool/tree/main/bridge";

/** How to get "Import from game" working: the local read-only bridge app. */
export function BridgeSetup() {
  const t = useT();
  return (
    <div className="mt-2 rounded-lg border border-[#d4c9b6] bg-[#f6f1e8] px-3 py-2.5 text-xs text-ink-2">
      <p className="mb-2">{t("bridgeIntro")}</p>
      <ol className="mb-2 flex flex-col gap-1.5">
        {(["bridgeStep1", "bridgeStep2", "bridgeStep3", "bridgeStep4"] as const).map((k, i) => (
          <li key={k} className="flex gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-copper text-[10px] font-bold text-white">
              {i + 1}
            </span>
            {i === 0 ? (
              <a
                href={DOWNLOAD_URL}
                className="font-bold text-copper underline hover:text-copper-hi"
              >
                {t(k)}
              </a>
            ) : (
              <span>{t(k)}</span>
            )}
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-ink-3">
        {t("bridgeNote")}{" "}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="underline">
          {t("bridgeSource")}
        </a>
      </p>
    </div>
  );
}
