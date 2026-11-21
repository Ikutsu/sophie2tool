import { Link } from "@tanstack/react-router";
import { useLocalized } from "../../hooks/use-localized.ts";
import { useT } from "../../lib/i18n.ts";
import { ComponentBlock } from "./component-block.tsx";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import { useMaterialsStore } from "../../stores/materials.ts";
import { useLanguageStore } from "../../stores/language.ts";
import { useInventoryStore } from "../../stores/inventory.ts";
import type { Recipe, Ingredient, Component } from "../../types/index.ts";
import type { InstanceInfo } from "../../lib/optimizer/types.ts";

const CDN_BASE = "https://media.barrelwisdom.com/file/barrelwisdom/games/sophie2/items/";

export function MaterialList({ recipe }: { recipe: Recipe }) {
  const name = useLocalized(recipe.name);
  const t = useT();
  const currentResult = useOptimizerStore((s) => s.results?.[s.selectedIndex]);
  const allMaterials = useMaterialsStore((s) => s.materials);

  // Ingredient rows expand quantity into slots; results.materials is per slot.
  let slot = 0;
  const rows = recipe.ingredient.flatMap((ing) => {
    const start = slot;
    slot += ing.quantity;
    const slotMats = currentResult?.materials.slice(start, start + ing.quantity) ?? [];
    // In inventory mode each slot holds a different instance: one row per slot.
    if (slotMats.some((m) => m.instance)) {
      return slotMats.map((m, k) => ({ ing, optMat: m, qty: 1, slots: [start + k] }));
    }
    const slots = Array.from({ length: ing.quantity }, (_, k) => start + k);
    return [{ ing, optMat: slotMats[0], qty: ing.quantity, slots }];
  });

  // How many times each component code is used by a row's slots
  const usedCounts = (slots: number[]) => {
    const counts = new Map<string, number>();
    for (const p of currentResult?.placements ?? []) {
      if (p.slotIndex != null && slots.includes(p.slotIndex)) {
        counts.set(p.componentCode, (counts.get(p.componentCode) ?? 0) + 1);
      }
    }
    return counts;
  };

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-border bg-surface-dim">
        <Link to="/" className="text-copper font-bold text-lg leading-none hover:text-copper-hi">
          &larr;
        </Link>
        <span className="font-heading text-sm font-semibold flex-1 truncate">{name}</span>
        <Link to="/" className="text-xs text-copper italic hover:underline">
          {t("switchRecipe")}
        </Link>
      </div>
      {rows.map(({ ing, optMat, qty, slots }, i) => {
        const baseSlug = optMat?.baseSlug ?? optMat?.slug ?? ing.item?.slug;
        const matData =
          baseSlug && allMaterials ? allMaterials.find((m) => m.slug === baseSlug) : undefined;
        return (
          <MaterialRow
            key={i}
            index={i + 1}
            ingredient={ing}
            quantity={qty}
            displaySlug={baseSlug}
            optimizedName={optMat?.name}
            instance={optMat?.instance}
            components={optMat?.instance?.components ?? matData?.components}
            usedCounts={currentResult ? usedCounts(slots) : undefined}
          />
        );
      })}
    </div>
  );
}

function MaterialRow({
  index,
  ingredient,
  quantity,
  displaySlug,
  optimizedName,
  instance,
  components,
  usedCounts,
}: {
  index: number;
  ingredient: Ingredient;
  quantity: number;
  displaySlug?: string;
  optimizedName?: Record<string, string>;
  instance?: InstanceInfo;
  components?: Component[];
  usedCounts?: Map<string, number>;
}) {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const traitNames = useInventoryStore((s) => s.traitNames);
  const itemName = useLocalized(ingredient.item?.name);
  const catName = useLocalized(ingredient.cat?.name);
  const optName = useLocalized(optimizedName as any);

  const displayName = optimizedName ? optName : ingredient.item ? itemName : catName;
  const isCategory = !ingredient.item && !optimizedName;

  // Mark exactly as many copies of a code as were used (an instance may hold duplicates).
  const remaining = new Map(usedCounts ?? []);
  const selected = (components ?? []).map((c) => {
    const n = remaining.get(c.code) ?? 0;
    if (n > 0) remaining.set(c.code, n - 1);
    return n > 0;
  });

  return (
    <div className="px-4 py-3 border-b border-border-lt">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-copper text-white text-xs font-heading font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
        {displaySlug ? (
          <img
            src={`${CDN_BASE}${displaySlug}.webp`}
            alt={displayName}
            className="w-9 h-9 rounded border border-border bg-white object-contain"
          />
        ) : null}
        <span className="text-sm font-semibold">
          {isCategory ? (
            <span className="italic text-ink-3">
              {catName} &times;{quantity}
            </span>
          ) : (
            <>
              {displayName} &times;{quantity}
            </>
          )}
        </span>
        {instance ? (
          <span className="ml-auto text-xs font-semibold text-copper whitespace-nowrap">
            {t("quality")} {instance.quality}
          </span>
        ) : null}
      </div>
      {instance && instance.traits.length > 0 ? (
        <div className="ml-8 mb-2 flex flex-wrap gap-1">
          {instance.traits.map((id) => (
            <span
              key={id}
              className="text-[11px] px-1.5 py-0.5 rounded bg-surface-dim border border-border-lt text-ink-2"
            >
              {traitNames[id]?.[lang] ?? traitNames[id]?.en ?? `#${id}`}
            </span>
          ))}
        </div>
      ) : null}
      {components && components.length > 0 ? (
        <div className="flex gap-2.5 flex-wrap ml-8">
          {components.map((comp, i) => (
            <ComponentBlock key={i} component={comp} selected={selected[i]} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
