import { create } from "zustand";
import type { Recipe } from "../types/index.ts";

interface RecipeState {
  recipes: Recipe[] | null;
  loading: boolean;
  load: () => Promise<void>;
  getBySlug: (slug: string) => Recipe | undefined;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: null,
  loading: false,

  load: async () => {
    if (get().recipes || get().loading) return;
    set({ loading: true });
    const res = await fetch("/data/recipes.json");
    const data: Recipe[] = await res.json();
    set({ recipes: data, loading: false });
  },

  getBySlug: (slug: string) => {
    return get().recipes?.find((r) => r.slug === slug);
  },
}));
