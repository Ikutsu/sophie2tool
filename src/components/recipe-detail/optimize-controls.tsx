import { useEffect } from "react";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useMaterialsStore } from "../../stores/materials.ts";
import { useInventoryStore } from "../../stores/inventory.ts";
import { coopLevelFromHearts } from "../../stores/optimizer.ts";
import { useT } from "../../lib/i18n.ts";
import type { EffectLine, Language, Recipe } from "../../types/index.ts";
import { useLanguageStore } from "../../stores/language.ts";
import { ElementIcon } from "../ui/element-icon.tsx";
import type { OptMode } from "../../lib/optimizer/types.ts";

export function OptimizeControls({ recipe }: { recipe: Recipe }) {
  const t = useT();
  const {
    mode,
    setMode,
    running,
    optimize,
    results,
    maxComponents,
    setMaxComponents,
    inventoryShortage,
    fillBoard,
    setFillBoard,
  } = useOptimizerStore();
  const { materials, load: loadMaterials, loading: materialsLoading } = useMaterialsStore();

  const MODE_HINT: Record<OptMode, string> = {
    global: t("modeGlobalHint"),
    single: t("modeSingleHint"),
    combo: t("modeComboHint"),
  };
  const resetTargets = useOptimizerStore((s) => s.resetTargets);
  useEffect(() => resetTargets(), [recipe.slug, resetTargets]);

  const MODES: { value: OptMode; label: string }[] = [
    { value: "global", label: t("globalOptimum") },
    { value: "single", label: t("maximizeSingle") },
    { value: "combo", label: t("targetCombo") },
  ];

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const handleOptimize = () => {
    if (!materials || running) return;
    optimize(recipe, materials);
  };

  const isReady = materials && !materialsLoading && !running;

  return (
    <div>
      <InventoryControls />
      {/* Mode: segmented pills, then what that mode needs */}
      <div className="mb-2 grid grid-cols-3 gap-1 rounded-full bg-[#2c2622] p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`cursor-pointer rounded-full px-1.5 py-1 font-game text-[11px] font-bold leading-tight transition-colors ${
              mode === m.value ? "bg-gold text-ink shadow" : "text-[#d8cfc0] hover:bg-[#3e3630]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-ink-3">{MODE_HINT[mode]}</p>
      {mode === "single" ? <SingleTarget effects={recipe.effects} /> : null}
      {mode === "combo" ? <ComboTargets effects={recipe.effects} /> : null}

      <div className="mb-3 mt-3 flex flex-col gap-2 rounded-lg border border-[#d4c9b6] bg-[#f6f1e8]/80 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{t("maxComponents")}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setMaxComponents(n)}
                className={`h-6 w-6 cursor-pointer rounded font-game text-xs font-bold ${
                  maxComponents === n ? "bg-[#2c2622] text-white" : "bg-[#e4dccd] text-ink-2"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <label
          className="relative flex cursor-pointer items-center justify-between text-sm"
          title={t("fillBoardHint")}
        >
          {t("fillBoard")}
          <input
            type="checkbox"
            checked={fillBoard}
            onChange={(e) => setFillBoard(e.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 shrink-0 rounded-full bg-[#cfc5b4] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-copper peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-copper" />
        </label>
      </div>
      <button
        onClick={handleOptimize}
        disabled={!isReady}
        className="w-full py-3 rounded-lg font-heading text-sm font-bold tracking-wider text-white cursor-pointer bg-gradient-to-r from-[#985828] via-copper to-copper-hi shadow-md hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running ? t("optimizing") : materialsLoading ? t("loadingData") : `▶ ${t("optimizeBtn")}`}
      </button>
      {inventoryShortage ? (
        <div className="mt-2 text-xs text-red-700 text-center">{t("inventoryShortage")}</div>
      ) : results ? (
        <div className="mt-2 text-xs text-ink-3 text-center">
          {results.length} {t("plansFound")} ({t("bestScore")}: {results[0]?.score ?? 0})
        </div>
      ) : null}
    </div>
  );
}

function InventoryControls() {
  const t = useT();
  const { items, importedAt, importing, error, useInventory, importFromGame, setUseInventory } =
    useInventoryStore();
  const setCoopLevels = useOptimizerStore((s) => s.setCoopLevels);

  // Importing also reads friendship: set each companion's co-op cap from their hearts.
  const handleImport = async () => {
    const companions = await importFromGame();
    if (companions && companions.length > 0) {
      setCoopLevels(
        Object.fromEntries(companions.map((c) => [c.element, coopLevelFromHearts(c.hearts)])),
      );
    }
  };
  const time = importedAt
    ? new Date(importedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="mb-3 pb-3 border-b border-border-lt">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium">{t("inventory")}</span>
        <button
          onClick={() => void handleImport()}
          disabled={importing}
          className="text-xs px-2.5 py-1 rounded border border-copper text-copper hover:bg-copper hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {importing ? t("importing") : t("importFromGame")}
        </button>
      </div>
      {items ? (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={useInventory}
            onChange={(e) => setUseInventory(e.target.checked)}
            className="accent-copper"
          />
          {t("useInventory")}
          <span className="ml-auto text-xs text-ink-3">
            {items.length} {t("itemsImported")} · {time}
          </span>
        </label>
      ) : null}
      {error ? (
        <div className="mt-1 text-xs text-red-700">
          {t(error === "unknown" ? "importFailed" : error)}
        </div>
      ) : null}
    </div>
  );
}

/** Tiers a line can actually unlock (the recipe's `restrict` hides the rest). */
function usableTiers(line: EffectLine) {
  return line.data.slice(0, Math.min(line.restrict ?? line.data.length, line.data.length));
}

function tierName(tier: EffectLine["data"][number], lang: Language): string {
  const ml = tier.effect?.name ?? tier.component?.name;
  return ml ? (ml[lang] ?? ml.en ?? "") : "";
}

/** "single" mode: one card per effect line; the chosen one gets maximized. */
function SingleTarget({ effects }: { effects: EffectLine[] }) {
  const lang = useLanguageStore((s) => s.lang);
  const targetLine = useOptimizerStore((s) => s.targetLine);
  const setTargetLine = useOptimizerStore((s) => s.setTargetLine);
  return (
    <div className="flex flex-col gap-1">
      {effects.map((line, i) => {
        const tiers = usableTiers(line);
        const top = tiers[tiers.length - 1];
        const on = targetLine === i;
        return (
          <button
            key={i}
            onClick={() => setTargetLine(i)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors ${
              on
                ? "border-gold bg-[#fbefc8] shadow-[0_0_0_1px_#c8a84e]"
                : "border-[#d4c9b6] bg-[#f6f1e8]/80 hover:bg-[#f0e8d8]"
            }`}
          >
            <ElementIcon element={line.elem} size={12} badge />
            <span className="min-w-0 flex-1 truncate font-game text-xs font-bold">
              {top ? tierName(top, lang) : "—"}
            </span>
            <span className="font-game text-[11px] text-ink-3 tabular-nums">{top?.num}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "combo" mode: per effect line, the tier that must be reached (or any). */
function ComboTargets({ effects }: { effects: EffectLine[] }) {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const targetTiers = useOptimizerStore((s) => s.targetTiers);
  const setTargetTier = useOptimizerStore((s) => s.setTargetTier);
  return (
    <div className="flex flex-col gap-1">
      {effects.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <ElementIcon element={line.elem} size={12} badge />
          <select
            value={targetTiers[i] ?? ""}
            onChange={(e) =>
              setTargetTier(i, e.target.value === "" ? null : Number(e.target.value))
            }
            className="min-w-0 flex-1 cursor-pointer rounded border border-[#d4c9b6] bg-[#f6f1e8] px-1.5 py-1 font-game text-xs text-ink"
          >
            <option value="">{t("noRequirement")}</option>
            {usableTiers(line).map((tier, k) => (
              <option key={k} value={k}>
                {tier.num}+ {tierName(tier, lang)}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
