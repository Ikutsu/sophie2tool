import { KIND_LABELS } from "../../types/index.ts";
import type { RecipeKind } from "../../types/index.ts";

const ALL_KINDS: RecipeKind[] = [
  "attack",
  "heal",
  "buff",
  "debuff",
  "mix",
  "weapon",
  "armor",
  "accessory",
];

export function RecipeFilters({
  search,
  onSearchChange,
  activeKinds,
  onToggleKind,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  activeKinds: Set<RecipeKind>;
  onToggleKind: (kind: RecipeKind) => void;
}) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      <input
        type="text"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-ink placeholder:text-ink-3 outline-none focus:border-copper transition-colors text-sm"
      />
      <div className="flex flex-wrap gap-1.5">
        {ALL_KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => onToggleKind(kind)}
            className={`px-3 py-1 text-xs font-heading font-semibold rounded-md cursor-pointer transition-colors ${
              activeKinds.has(kind)
                ? "bg-copper text-white"
                : "bg-surface-dim text-ink-3 hover:text-ink-2"
            }`}
          >
            {KIND_LABELS[kind]}
          </button>
        ))}
      </div>
    </div>
  );
}
