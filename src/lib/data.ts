import type { RecipeListItem } from "../types/index.ts";
import recipesIndex from "../../data/recipes.json";

export const recipeList: RecipeListItem[] = recipesIndex as RecipeListItem[];
