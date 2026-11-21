import { useState } from "react";
import { recipeList } from "../../lib/data.ts";
import type { RecipeKind, RecipeListItem } from "../../types/index.ts";
import { RecipeCard } from "./recipe-card.tsx";
import { RecipeFilters } from "./recipe-filters.tsx";
import { useT } from "../../lib/i18n.ts";

function matchesSearch(recipe: RecipeListItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return Object.values(recipe.name).some((n) => n?.toLowerCase().includes(q));
}

export function RecipeGrid() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [activeKinds, setActiveKinds] = useState<Set<RecipeKind>>(new Set());

  const toggleKind = (kind: RecipeKind) => {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const filtered = recipeList.filter((r) => {
    if (activeKinds.size > 0 && !activeKinds.has(r.kind)) return false;
    return matchesSearch(r, search);
  });

  return (
    <div>
      <RecipeFilters
        search={search}
        onSearchChange={setSearch}
        activeKinds={activeKinds}
        onToggleKind={toggleKind}
      />
      <div className="text-xs text-ink-3 mb-3">
        {filtered.length} {t("recipeCount")}
      </div>
      <div className="grid gap-2">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.slug} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
