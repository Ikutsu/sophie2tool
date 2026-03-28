import { useLanguageStore } from "../stores/language.ts";
import type { MultiLanguage } from "../types/index.ts";

export function useLocalized(ml: MultiLanguage | undefined): string {
  const lang = useLanguageStore((s) => s.lang);
  if (!ml) return "";
  return ml[lang] ?? ml.en ?? "";
}
