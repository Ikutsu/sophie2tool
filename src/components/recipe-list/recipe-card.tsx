import { Link } from "@tanstack/react-router";
import { useLocalized } from "../../hooks/use-localized.ts";
import { KindBadge } from "../ui/kind-badge.tsx";
import type { RecipeListItem } from "../../types/index.ts";

const KIND_BG: Record<string, string> = {
  attack: "bg-fire",
  heal: "bg-wind",
  buff: "bg-ltng",
  debuff: "bg-light-el",
  weapon: "bg-ink-2",
  armor: "bg-ice",
  accessory: "bg-gold",
  mix: "bg-copper",
};

export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const name = useLocalized(recipe.name);

  return (
    <Link
      to="/recipe/$slug"
      params={{ slug: recipe.slug }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface border border-border-lt hover:border-copper/40 hover:shadow-sm transition-all group"
    >
      <img
        src={`https://media.barrelwisdom.com/file/barrelwisdom/games/sophie2/items/${recipe.slug}.webp`}
        alt={name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-md border border-border bg-white object-contain"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          el.nextElementSibling?.classList.remove("hidden");
        }}
      />
      <div
        className={`hidden w-10 h-10 rounded-md flex items-center justify-center ${KIND_BG[recipe.kind] ?? "bg-ink-3"} text-white font-heading font-bold text-sm`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-ink truncate group-hover:text-copper transition-colors">
          {name}
        </div>
        <div className="text-xs text-ink-3">Lv.{recipe.level}</div>
      </div>
      <KindBadge kind={recipe.kind} />
    </Link>
  );
}
