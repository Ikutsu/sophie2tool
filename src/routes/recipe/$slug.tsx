import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useRecipeStore } from "../../stores/recipe.ts";
import { useOptimizerStore } from "../../stores/optimizer.ts";
import { PanelGrid } from "../../components/panel/panel-grid.tsx";
import { SynthesisPlaque } from "../../components/panel/synthesis-plaque.tsx";
import { PlanGuide } from "../../components/panel/plan-guide.tsx";
import { RecipeLayout } from "../../components/recipe-detail/recipe-layout.tsx";
import { MaterialList } from "../../components/recipe-detail/material-list.tsx";
import { ItemCard } from "../../components/recipe-detail/item-card.tsx";
import { EffectBarList } from "../../components/recipe-detail/effect-bar.tsx";
import { CoopSkills } from "../../components/recipe-detail/coop-skills.tsx";
import { OptimizeControls } from "../../components/recipe-detail/optimize-controls.tsx";
import { useT } from "../../lib/i18n.ts";
import type { Recipe, ElementColor } from "../../types/index.ts";

export const Route = createFileRoute("/recipe/$slug")({
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { slug } = Route.useParams();
  const { recipes, loading, load, getBySlug } = useRecipeStore();
  const clear = useOptimizerStore((s) => s.clear);

  useEffect(() => {
    void load();
  }, [load]);

  // Clear optimizer results when switching recipes
  useEffect(() => {
    clear();
  }, [slug, clear]);

  const t = useT();

  if (loading || !recipes) {
    return <div className="flex items-center justify-center h-full text-ink-3">{t("loading")}</div>;
  }

  const recipe = getBySlug(slug);
  if (!recipe) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to="/" className="text-copper hover:underline text-sm">
          &larr; {t("back")}
        </Link>
        <p className="mt-4 text-ink-3">{t("recipeNotFound")}</p>
      </div>
    );
  }

  return <RecipeDetailView recipe={recipe} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-heading text-[10px] font-semibold text-ink-2 tracking-widest uppercase border-b border-border pb-1 mb-2">
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-2 text-border">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <span className="text-[6px]">&#9670;</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-transparent" />
    </div>
  );
}

function PlanTabs() {
  const t = useT();
  const { results, selectedIndex, setSelectedIndex } = useOptimizerStore();
  if (!results || results.length === 0) return null;

  return (
    <div className="flex gap-1 mt-3">
      {results.map((_, i) => (
        <button
          key={i}
          onClick={() => setSelectedIndex(i)}
          className={`px-4 py-1.5 rounded font-heading text-xs font-semibold cursor-pointer transition-colors ${
            i === selectedIndex
              ? "bg-gold text-ink"
              : "bg-[#38301e] text-[#908068] border border-[#584830] hover:bg-[#48402e]"
          }`}
        >
          {t("plan")} {i + 1}
        </button>
      ))}
    </div>
  );
}

function RecipeDetailView({ recipe }: { recipe: Recipe }) {
  const t = useT();
  const currentResult = useOptimizerStore((s) => s.results?.[s.selectedIndex]);
  const guideStep = useOptimizerStore((s) => s.guideStep);
  const step = guideStep != null ? currentResult?.steps[guideStep] : undefined;
  const highlight = useMemo(
    () => (step ? new Set(step.cells.map((c) => `${c.row},${c.col}`)) : undefined),
    [step],
  );
  const triggers = useMemo(() => currentResult?.steps.flatMap((s) => s.triggers), [currentResult]);

  const fillValues: Partial<Record<ElementColor, number>> = currentResult?.fillValues ?? {};
  const linkCounts: Partial<Record<ElementColor, number>> = currentResult?.linkCounts ?? {};

  return (
    <RecipeLayout
      left={<MaterialList recipe={recipe} />}
      center={
        <>
          {recipe.panel ? (
            <PanelGrid
              panel={recipe.panel}
              fillState={step?.board ?? currentResult?.panelState}
              highlight={highlight}
            />
          ) : (
            <p className="text-ink-3 text-sm">{t("noPanel")}</p>
          )}
          {currentResult ? (
            <SynthesisPlaque
              greatSuccess={currentResult.greatSuccess}
              qualityGain={currentResult.qualityGain}
            />
          ) : null}
          <PlanTabs />
          {currentResult ? <PlanGuide result={currentResult} /> : null}
        </>
      }
      right={
        <>
          <ItemCard recipe={recipe} />
          <Divider />
          <div>
            <SectionTitle>{t("effects")}</SectionTitle>
            <EffectBarList
              effects={recipe.effects}
              fillValues={fillValues}
              linkCounts={linkCounts}
            />
          </div>
          <Divider />
          <div>
            <SectionTitle>{t("coopSkills")}</SectionTitle>
            <CoopSkills coopTriggered={triggers} />
          </div>
          <Divider />
          <div>
            <SectionTitle>{t("optimize")}</SectionTitle>
            <OptimizeControls recipe={recipe} />
          </div>
        </>
      }
    />
  );
}
