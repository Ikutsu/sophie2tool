import { useEffect } from "react";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useMaterialsStore } from "../../stores/materials.ts";
import { useInventoryStore } from "../../stores/inventory.ts";
import { coopLevelFromHearts } from "../../stores/optimizer.ts";
import { useT } from "../../lib/i18n.ts";
import type { Recipe } from "../../types/index.ts";
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
    selectedIndex,
    fillBoard,
    setFillBoard,
  } = useOptimizerStore();
  const selected = results?.[selectedIndex];
  const { materials, load: loadMaterials, loading: materialsLoading } = useMaterialsStore();

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
      <div className="flex flex-col gap-1 mb-3">
        {MODES.map((m) => (
          <label
            key={m.value}
            className="flex items-center gap-2 py-1 text-sm cursor-pointer"
            onClick={() => setMode(m.value)}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                mode === m.value ? "border-copper" : "border-border"
              }`}
            >
              {mode === m.value ? <span className="w-2 h-2 rounded-full bg-copper" /> : null}
            </span>
            {m.label}
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{t("maxComponents")}</span>
        <select
          value={maxComponents}
          onChange={(e) => setMaxComponents(Number(e.target.value))}
          className="text-xs bg-surface-dim border border-border rounded px-2 py-1 text-ink-2 cursor-pointer"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <label
        className="flex items-center gap-2 mb-3 text-sm cursor-pointer"
        title={t("fillBoardHint")}
      >
        <input
          type="checkbox"
          checked={fillBoard}
          onChange={(e) => setFillBoard(e.target.checked)}
          className="accent-copper"
        />
        {t("fillBoard")}
      </label>
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
          {selected ? (
            <div className="mt-1 text-sm font-semibold text-copper">
              {t("quality")} +{selected.qualityGain} · {t("greatSuccess")} {selected.greatSuccess}%
            </div>
          ) : null}
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
