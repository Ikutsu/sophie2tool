import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "../types/index.ts";

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
    }),
    { name: "sophie2-lang" },
  ),
);
