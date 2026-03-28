import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRecipeStore } from "../../stores/recipe.ts";
import { useLocalized } from "../../hooks/use-localized.ts";
import { KindBadge } from "../../components/ui/kind-badge.tsx";
import { ElementIcon } from "../../components/ui/element-icon.tsx";
import type { EffectLine, EffectData, Ingredient } from "../../types/index.ts";

export const Route = createFileRoute("/recipe/$slug")({
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { slug } = Route.useParams();
  const { recipes, loading, load, getBySlug } = useRecipeStore();

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !recipes) {
    return <div className="max-w-3xl mx-auto px-6 py-8 text-ink-3">Loading...</div>;
  }

  const recipe = getBySlug(slug);
  if (!recipe) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/" className="text-copper hover:underline text-sm">
          &larr; Back
        </Link>
        <p className="mt-4 text-ink-3">Recipe not found.</p>
      </div>
    );
  }

  return <RecipeDetail recipe={recipe} />;
}

function RecipeDetail({
  recipe,
}: {
  recipe: NonNullable<ReturnType<typeof useRecipeStore.getState>["recipes"]>[number];
}) {
  const name = useLocalized(recipe.name);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link to="/" className="text-copper hover:underline text-sm">
        &larr; Back to recipes
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-ink-2">
            <span>Lv.{recipe.level}</span>
            <KindBadge kind={recipe.kind} />
            {recipe.uses ? <span>Uses: {recipe.uses}</span> : null}
            {recipe.range ? <span>Range: {recipe.range}</span> : null}
          </div>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="font-heading text-sm font-semibold text-ink-2 tracking-wider uppercase border-b border-border pb-1 mb-3">
          Ingredients
        </h2>
        <div className="flex flex-col gap-2">
          {recipe.ingredient.map((ing, i) => (
            <IngredientRow key={i} ing={ing} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-sm font-semibold text-ink-2 tracking-wider uppercase border-b border-border pb-1 mb-3">
          Effects
        </h2>
        <div className="flex flex-col gap-3">
          {recipe.effects.map((line, i) => (
            <EffectLineRow key={i} line={line} />
          ))}
        </div>
      </section>

      {recipe.panel ? (
        <section className="mt-6">
          <h2 className="font-heading text-sm font-semibold text-ink-2 tracking-wider uppercase border-b border-border pb-1 mb-3">
            Panel
          </h2>
          <p className="text-sm text-ink-3">
            {recipe.panel.length}&times;{recipe.panel[0]?.length} grid (visualization in Phase 2)
          </p>
        </section>
      ) : null}
    </div>
  );
}

function IngredientRow({ ing }: { ing: Ingredient }) {
  const itemName = useLocalized(ing.item?.name);
  const catName = useLocalized(ing.cat?.name);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 h-5 rounded-full bg-copper text-white text-xs font-bold flex items-center justify-center shrink-0">
        {ing.quantity}
      </span>
      <span className="font-medium">
        {ing.item ? itemName : <span className="italic text-ink-3">{catName}</span>}
      </span>
    </div>
  );
}

function EffectLineRow({ line }: { line: EffectLine }) {
  return (
    <div className="flex items-start gap-2">
      <ElementIcon element={line.elem} size={18} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-ink-3">
          {line.maxlv != null ? <span>maxlv: {line.maxlv}</span> : null}
          {line.restrict != null ? <span>restrict: {line.restrict}</span> : null}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {line.data.map((d, i) => (
            <EffectDataItem
              key={i}
              data={d}
              index={i}
              restrict={line.restrict}
              maxlv={line.maxlv}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EffectDataItem({
  data,
  index,
  restrict,
  maxlv,
}: {
  data: EffectData;
  index: number;
  restrict?: number;
  maxlv?: number;
}) {
  const effectName = useLocalized(data.effect?.name);
  const compName = useLocalized(data.component?.name);
  const label = effectName || compName || "???";

  const isRestricted = restrict != null && index >= restrict;
  const isBeyondMax = maxlv != null && data.num >= maxlv;

  let color = "text-ink";
  if (isRestricted) color = "text-fire";
  else if (isBeyondMax) color = "text-ink-3";

  return (
    <span className={`text-sm ${color}`}>
      {label}
      {data.num > 0 ? <span className="text-xs ml-0.5">({data.num})</span> : null}
    </span>
  );
}
