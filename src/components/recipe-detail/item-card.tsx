import { useLocalized } from "../../hooks/use-localized.ts";
import { useT } from "../../lib/i18n.ts";
import { KindBadge } from "../ui/kind-badge.tsx";
import type { Recipe } from "../../types/index.ts";

const CDN_BASE = "https://media.barrelwisdom.com/file/barrelwisdom/games/sophie2/items/";

export function ItemCard({ recipe }: { recipe: Recipe }) {
  const name = useLocalized(recipe.name);
  const t = useT();

  return (
    <div className="text-center pb-3">
      <img
        src={`${CDN_BASE}${recipe.slug}.webp`}
        alt={name}
        className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-border bg-white object-contain"
      />
      <div className="font-heading text-base font-semibold">{name}</div>
      <div className="text-sm text-ink-2 italic mb-2">
        Lv.{recipe.level} / <KindBadge kind={recipe.kind} />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm max-w-48 mx-auto">
        {recipe.uses ? (
          <>
            <span className="text-right text-ink-3">{t("uses")}</span>
            <span className="font-bold">{recipe.uses}</span>
          </>
        ) : null}
        {recipe.quantity ? (
          <>
            <span className="text-right text-ink-3">{t("quantity")}</span>
            <span className="font-bold">{recipe.quantity}</span>
          </>
        ) : null}
        {recipe.range ? (
          <>
            <span className="text-right text-ink-3">{t("range")}</span>
            <span className="font-bold">{recipe.range}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
