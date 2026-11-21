import { create } from "zustand";
import type { Material } from "../types/index.ts";

interface MaterialsState {
  materials: Material[] | null;
  loading: boolean;
  load: () => Promise<void>;
  getBySlug: (slug: string) => Material | undefined;
  getByCategory: (categorySlug: string) => Material[];
}

export const useMaterialsStore = create<MaterialsState>((set, get) => ({
  materials: null,
  loading: false,

  load: async () => {
    if (get().materials || get().loading) return;
    set({ loading: true });
    const res = await fetch("/data/materials.json");
    const data: Material[] = await res.json();
    set({ materials: data, loading: false });
  },

  getBySlug: (slug: string) => {
    return get().materials?.find((m) => m.slug === slug);
  },

  getByCategory: (categorySlug: string) => {
    return get().materials?.filter((m) => m.categories.some((c) => c.slug === categorySlug)) ?? [];
  },
}));
