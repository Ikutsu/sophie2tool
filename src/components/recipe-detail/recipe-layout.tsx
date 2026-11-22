import { useState, type ReactNode } from "react";
import { useT } from "../../lib/i18n.ts";

type MobileTab = "recipe" | "panel" | "effects";

export function RecipeLayout({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<MobileTab>("panel");

  const tabs: { key: MobileTab; label: string }[] = [
    { key: "recipe", label: t("tabRecipe") },
    { key: "panel", label: t("tabPanel") },
    { key: "effects", label: t("tabEffects") },
  ];

  return (
    <>
      {/* Desktop: three columns */}
      <div className="hidden lg:grid h-full" style={{ gridTemplateColumns: "320px 1fr 300px" }}>
        <aside
          className="overflow-y-auto bg-[#ebe5da] border-r border-border"
          style={{ backgroundImage: "url(/textures/clean_textile.webp)" }}
        >
          {left}
        </aside>
        <main
          className="overflow-y-auto flex flex-col items-center py-4"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #2e2218, #0c0804)" }}
        >
          {center}
        </main>
        <aside
          className="overflow-y-auto bg-[#ebe5da] border-l border-border px-4 py-4 flex flex-col gap-3"
          style={{ backgroundImage: "url(/textures/clean_textile.webp)" }}
        >
          {right}
        </aside>
      </div>

      {/* Tablet: narrower columns */}
      <div
        className="hidden md:grid lg:hidden h-full"
        style={{ gridTemplateColumns: "240px 1fr 240px" }}
      >
        <aside
          className="overflow-y-auto bg-[#ebe5da] border-r border-border"
          style={{ backgroundImage: "url(/textures/clean_textile.webp)" }}
        >
          {left}
        </aside>
        <main
          className="overflow-y-auto flex flex-col items-center py-4"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #2e2218, #0c0804)" }}
        >
          {center}
        </main>
        <aside
          className="overflow-y-auto bg-[#ebe5da] border-l border-border px-3 py-3 flex flex-col gap-3"
          style={{ backgroundImage: "url(/textures/clean_textile.webp)" }}
        >
          {right}
        </aside>
      </div>

      {/* Mobile: tab switching */}
      <div className="md:hidden h-full flex flex-col">
        <div className="flex border-b border-border bg-surface-dim shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-heading font-semibold cursor-pointer transition-colors ${
                activeTab === tab.key ? "text-copper border-b-2 border-copper" : "text-ink-3"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === "recipe" && (
            <div
              className="bg-[#ebe5da] min-h-full"
              style={{ backgroundImage: "url(/textures/clean_textile.webp)" }}
            >
              {left}
            </div>
          )}
          {activeTab === "panel" && (
            <div
              className="flex flex-col items-center py-4 min-h-full"
              style={{ background: "radial-gradient(ellipse at 50% 40%, #2e2218, #0c0804)" }}
            >
              {center}
            </div>
          )}
          {activeTab === "effects" && (
            <div
              className="bg-[#ebe5da] px-4 py-4 flex flex-col gap-3 min-h-full"
              style={{ backgroundImage: "url(/textures/clean_textile.webp)" }}
            >
              {right}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
