import type { ElementColor } from "../types/index.ts";
import type { TranslationKey } from "./i18n.ts";

/** Co-op companions and the element whose links set off their skills. */
export const COMPANIONS: { slug: string; element: ElementColor; nameKey: TranslationKey }[] = [
  { slug: "olias", element: 1, nameKey: "charOlias" },
  { slug: "alette", element: 2, nameKey: "charAlette" },
  { slug: "plachta", element: 5, nameKey: "charPlachta" },
  { slug: "ramizel", element: 4, nameKey: "charRamizel" },
  { slug: "diebold", element: 3, nameKey: "charDiebold" },
];

export const companionNameKey = (element: ElementColor): TranslationKey =>
  COMPANIONS.find((c) => c.element === element)!.nameKey;

export const SKILL_NAME_KEY: Record<number, TranslationKey> = {
  3: "skillLv3",
  5: "skillLv5",
  7: "skillLv7",
};

/** 1-based (row, column), as players count on the board. */
export const cellLabel = (row: number, col: number) => `(${row + 1}, ${col + 1})`;
