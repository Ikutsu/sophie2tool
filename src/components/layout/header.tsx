import { LanguageSwitcher } from "./language-switcher.tsx";
import { useT } from "../../lib/i18n.ts";

export function Header() {
  const t = useT();
  return (
    <header className="flex items-center px-5 h-14 gap-3 bg-gradient-to-br from-[#3a2818] via-[#52382a] to-[#3e2c1e] border-b-2 border-[#261c12] shadow-md shrink-0">
      <span className="font-heading text-base font-semibold text-[#e8d8c0] tracking-wider">
        Sophie 2
      </span>
      <span className="text-[#ffffff18] text-lg font-light">&middot;</span>
      <span className="text-sm text-[#b8a890] italic font-body">{t("synthesisOptimizer")}</span>
      <div className="ml-auto">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
