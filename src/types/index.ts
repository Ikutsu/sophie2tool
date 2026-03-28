export type Language = "en" | "ja" | "ko" | "sc" | "tc";
export type MultiLanguage = Record<Language, string>;
export type ElementColor = 1 | 2 | 3 | 4 | 5;
export type PanelCell = ElementColor | -1 | null;
export type PanelGrid = PanelCell[][];

export type RecipeKind =
  | "attack"
  | "heal"
  | "buff"
  | "debuff"
  | "weapon"
  | "armor"
  | "accessory"
  | "mix";

export interface Component {
  code: string;
  name?: MultiLanguage;
}

export interface EffectData {
  num: number;
  effect?: {
    slug: string;
    name: MultiLanguage;
    desc?: MultiLanguage;
  };
  component?: Component;
}

export interface EffectLine {
  elem: ElementColor;
  order: number;
  data: EffectData[];
  maxlv?: number;
  restrict?: number;
}

export interface Ingredient {
  quantity: number;
  item?: { slug: string; name: MultiLanguage };
  cat?: { slug: string; name: MultiLanguage; icon: string };
}

export interface Recipe {
  slug: string;
  name: MultiLanguage;
  kind: RecipeKind;
  level: number;
  price?: number;
  uses?: number;
  quantity?: number;
  range?: string;
  isDLC?: boolean;
  effects: EffectLine[];
  ingredient: Ingredient[];
  components: Component[];
  categories: { slug: string; name: MultiLanguage; icon?: string }[];
  panel?: PanelGrid;
}

export interface RecipeListItem {
  slug: string;
  name: MultiLanguage;
  kind: RecipeKind;
  level: number;
  isDLC?: boolean;
}

export interface Material {
  slug: string;
  name: MultiLanguage;
  kind: string;
  level: number;
  categories: { slug: string; name: MultiLanguage; icon?: string }[];
  components: Component[];
}

export interface Category {
  pk: number;
  slug: string;
  name: MultiLanguage;
  icon?: string;
}

export interface Effect {
  pk: number;
  slug: string;
  name: MultiLanguage;
  desc?: MultiLanguage;
}

export const ELEMENT_NAMES: Record<ElementColor, string> = {
  1: "ice",
  2: "wind",
  3: "lightning",
  4: "fire",
  5: "light",
};

export const ELEMENT_COLORS: Record<ElementColor, string> = {
  1: "#48b8e8",
  2: "#38d858",
  3: "#e8c840",
  4: "#e87040",
  5: "#c8a0d8",
};

export const KIND_LABELS: Record<RecipeKind, string> = {
  attack: "Attack",
  heal: "Heal",
  buff: "Buff",
  debuff: "Debuff",
  weapon: "Weapon",
  armor: "Armor",
  accessory: "Accessory",
  mix: "Mix",
};
