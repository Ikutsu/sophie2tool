import { KIND_LABELS } from "../../types/index.ts";
import type { RecipeKind } from "../../types/index.ts";

const KIND_COLORS: Record<RecipeKind, string> = {
  attack: "bg-fire/15 text-fire",
  heal: "bg-wind/15 text-wind",
  buff: "bg-ltng/15 text-ltng",
  debuff: "bg-light-el/15 text-light-el",
  weapon: "bg-ink-2/15 text-ink-2",
  armor: "bg-ice/15 text-ice",
  accessory: "bg-gold/20 text-ink-2",
  mix: "bg-copper/15 text-copper",
};

export function KindBadge({ kind }: { kind: RecipeKind }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${KIND_COLORS[kind]}`}>
      {KIND_LABELS[kind]}
    </span>
  );
}
