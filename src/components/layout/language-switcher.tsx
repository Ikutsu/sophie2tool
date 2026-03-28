import { useLanguageStore } from "../../stores/language.ts";
import type { Language } from "../../types/index.ts";

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ja", label: "JA" },
  { code: "ko", label: "KO" },
  { code: "sc", label: "SC" },
  { code: "tc", label: "TC" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguageStore();

  return (
    <div className="flex gap-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-0.5 text-xs font-heading tracking-wide rounded cursor-pointer transition-colors ${
            lang === l.code ? "bg-gold/90 text-ink" : "text-ink-3 hover:text-ink-2"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
