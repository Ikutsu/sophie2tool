import { createFileRoute } from "@tanstack/react-router";
import { RecipeGrid } from "../components/recipe-list/recipe-grid.tsx";
import { useT } from "../lib/i18n.ts";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const t = useT();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="font-heading text-xl sm:text-2xl font-semibold text-ink mb-6">
        {t("recipes")}
      </h1>
      <RecipeGrid />
    </div>
  );
}
