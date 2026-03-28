import { createFileRoute } from "@tanstack/react-router";
import { RecipeGrid } from "../components/recipe-list/recipe-grid.tsx";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-heading text-2xl font-semibold text-ink mb-6">Recipes</h1>
      <RecipeGrid />
    </div>
  );
}
