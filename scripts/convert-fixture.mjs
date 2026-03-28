#!/usr/bin/env node
/**
 * Convert barrelwisdom a23_data.json.gz fixture into structured JSON files
 * for the Sophie 2 Synthesis Optimizer.
 *
 * Usage: node scripts/convert-fixture.mjs
 *
 * Output:
 *   data/recipes.json    — synthesis items with effects, ingredients, components
 *   data/materials.json   — material items with component pools
 *   data/categories.json  — category definitions
 *   data/effects.json     — effect definitions (reference)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { gunzipSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_ROOT = join(ROOT, "..");
const FIXTURE = join(DATA_ROOT, "barrelwisdom", "backend", "fixtures", "a23_data.json.gz");
const OUT = join(ROOT, "data");

// XML data files
const ITEM_DATA_XML = join(DATA_ROOT, "itemdata.xml");
const RECIPE_DATA_XML = join(DATA_ROOT, "itemrecipedata.xml");
const PANEL_DATA_XML = join(DATA_ROOT, "mixrecipepaneldata.xml");
const TEXT_DIRS = { en: "text_en", ja: "text_jp", ko: "text_kr", sc: "text_sc", tc: "text_tc" };

const LANGS = ["en", "ja", "ko", "sc", "tc"];

// ─── 1. Load & group by model ────────────────────────────────────────────────

console.log("Loading fixture...");
const raw = JSON.parse(gunzipSync(readFileSync(FIXTURE)).toString());

/** @type {Record<string, Record<number, any>>} model → pk → fields */
const db = {};
for (const rec of raw) {
  const m = rec.model;
  if (!db[m]) db[m] = {};
  db[m][rec.pk] = rec.fields;
}

const models = Object.keys(db).sort();
console.log(`Loaded ${raw.length} records across ${models.length} models`);

// ─── 2. Lookup helpers ───────────────────────────────────────────────────────

function t(obj) {
  return obj ?? null;
}

/** Get multilingual name from a language-table FK pattern (item_en, item_ja, ...) */
function langFromFk(mainRecord, prefix, langTable, field = "name") {
  const result = {};
  for (const lang of LANGS) {
    const fk = mainRecord[`${prefix}_${lang}`];
    if (fk != null && langTable[fk]) {
      result[lang] = t(langTable[fk][field]);
    }
  }
  return result;
}

/** Get multilingual value from inline fields (cat_en, cat_ja, ...) */
function langInline(record, prefix) {
  const result = {};
  for (const lang of LANGS) {
    result[lang] = t(record[`${prefix}_${lang}`]);
  }
  return result;
}

// ─── 3. Build lookup maps ────────────────────────────────────────────────────

// Items
const items = db["items_a23.item"] ?? {};
const itemLang = {};
for (const lang of LANGS) {
  itemLang[lang] = db[`items_a23.item_${lang}`] ?? {};
}

// Kept for fixture inspection and ad hoc data debugging.
// eslint-disable-next-line no-unused-vars
function resolveItemName(pk) {
  const item = items[pk];
  if (!item) return null;
  return {
    slug: item.slug,
    name: langFromFk(item, "item", itemLang.en, "name"),
  };
}

// Fix: langFromFk needs all lang tables, not just en
function resolveItemNames(pk) {
  const item = items[pk];
  if (!item) return null;
  const name = {};
  for (const lang of LANGS) {
    const fk = item[`item_${lang}`];
    if (fk != null && itemLang[lang][fk]) {
      name[lang] = itemLang[lang][fk].name;
    }
  }
  return { slug: item.slug, name };
}

// Kept for fixture inspection and ad hoc data debugging.
// eslint-disable-next-line no-unused-vars
function resolveItemFull(pk) {
  const item = items[pk];
  if (!item) return null;
  const name = {};
  const desc = {};
  for (const lang of LANGS) {
    const fk = item[`item_${lang}`];
    if (fk != null && itemLang[lang][fk]) {
      const rec = itemLang[lang][fk];
      name[lang] = rec.name;
      // Collect non-null descs
      const d = {};
      for (let i = 1; i <= 4; i++) {
        if (rec[`desc${i}`]) d[`desc${i}`] = rec[`desc${i}`];
      }
      if (Object.keys(d).length) desc[lang] = d;
    }
  }
  return { slug: item.slug, name, desc };
}

// Effects
const effects = db["effects_a23.effect"] ?? {};
const effLang = {};
for (const lang of LANGS) {
  effLang[lang] = db[`effects_a23.effect_${lang}`] ?? {};
}

function resolveEffect(pk) {
  if (pk == null) return undefined;
  const eff = effects[pk];
  if (!eff) return undefined;
  const name = {};
  const desc = {};
  for (const lang of LANGS) {
    const fk = eff[`eff_${lang}`];
    if (fk != null && effLang[lang][fk]) {
      name[lang] = effLang[lang][fk].name;
      if (effLang[lang][fk].desc) desc[lang] = effLang[lang][fk].desc;
    }
  }
  return { slug: eff.slug, name, desc: Object.keys(desc).length ? desc : undefined };
}

// Components
const components = db["items_a23.component"] ?? {};

function resolveComponent(pk) {
  if (pk == null) return undefined;
  const comp = components[pk];
  if (!comp) return undefined;
  const name = langInline(comp, "com");
  // Check if all names are null
  const hasName = Object.values(name).some((v) => v != null);
  return { code: comp.code, name: hasName ? name : undefined };
}

// Categories
const categories = db["items_a23.category"] ?? {};

function resolveCategory(pk) {
  if (pk == null) return undefined;
  const cat = categories[pk];
  if (!cat) return undefined;
  return {
    slug: cat.slug,
    name: langInline(cat, "cat"),
    icon: cat.icon || undefined,
  };
}

// Characters
const characters = db["misc_a23.character"] ?? {};

// Kept for fixture inspection and ad hoc data debugging.
// eslint-disable-next-line no-unused-vars
function resolveCharacter(pk) {
  if (pk == null) return undefined;
  const ch = characters[pk];
  if (!ch) return undefined;
  return { slug: ch.slug, name: langInline(ch, "char") };
}

// ─── 4. Process EffectLines & EffectData ─────────────────────────────────────

const effectlines = db["items_a23.effectlines"] ?? {};
const effectdata = db["items_a23.effectdata"] ?? {};

// Group effectdata by line pk
const dataByLine = {};
for (const [pk, fields] of Object.entries(effectdata)) {
  const linePk = fields.line;
  if (!dataByLine[linePk]) dataByLine[linePk] = [];
  dataByLine[linePk].push({ pk: Number(pk), ...fields });
}

// Group effectlines by item pk
const linesByItem = {};
for (const [pk, fields] of Object.entries(effectlines)) {
  const itemPk = fields.item;
  if (!linesByItem[itemPk]) linesByItem[itemPk] = [];
  linesByItem[itemPk].push({ pk: Number(pk), ...fields });
}

function resolveEffectLines(itemPk) {
  const lines = linesByItem[itemPk];
  if (!lines) return [];

  return lines
    .sort((a, b) => a.order - b.order)
    .map((line) => {
      const data = (dataByLine[line.pk] || [])
        .sort((a, b) => a.num - b.num)
        .map((d) => {
          const entry = { num: d.num };
          if (d.effect != null) entry.effect = resolveEffect(d.effect);
          if (d.component != null) entry.component = resolveComponent(d.component);
          return entry;
        });

      const result = {
        elem: Number(line.elem),
        order: line.order,
        data,
      };
      if (line.maxlv != null) result.maxlv = line.maxlv;
      if (line.restrict != null) result.restrict = line.restrict;
      return result;
    });
}

// ─── 5. Process Ingredients ──────────────────────────────────────────────────

const ingredients = db["items_a23.ingredient"] ?? {};

// Group by synth item pk
const ingBySynth = {};
for (const [pk, fields] of Object.entries(ingredients)) {
  const synthPk = fields.synth;
  if (!ingBySynth[synthPk]) ingBySynth[synthPk] = [];
  ingBySynth[synthPk].push({ pk: Number(pk), ...fields });
}

function resolveIngredients(itemPk) {
  const ings = ingBySynth[itemPk];
  if (!ings) return [];

  return ings.map((ing) => {
    const entry = { quantity: ing.quantity };
    if (ing.item != null) entry.item = resolveItemNames(ing.item);
    if (ing.cat != null) entry.cat = resolveCategory(ing.cat);
    return entry;
  });
}

// ─── 6. Parse XML panel data ─────────────────────────────────────────────────

console.log("\nParsing XML panel data...");

/** Simple XML attribute extractor */
function attrs(line) {
  const out = {};
  for (const m of line.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

// 6a. itemdata.xml → itemTag → nameID
const itemTagToNameId = {};
for (const line of readFileSync(ITEM_DATA_XML, "utf8").split("\n")) {
  if (!line.includes("itemTag=")) continue;
  const a = attrs(line);
  if (a.itemTag && a.nameID) itemTagToNameId[a.itemTag] = a.nameID;
}
console.log(`  itemdata.xml: ${Object.keys(itemTagToNameId).length} items`);

// 6b. text_en/str_item_name.xml → nameID → english name
const nameIdToEnName = {};
const enTextFile = readFileSync(join(DATA_ROOT, TEXT_DIRS.en, "str_item_name.xml"), "utf8");
for (const line of enTextFile.split("\n")) {
  if (!line.includes("String_ID=")) continue;
  const a = attrs(line);
  if (a.String_ID && a.Text) nameIdToEnName[a.String_ID] = a.Text;
}
console.log(`  str_item_name.xml (en): ${Object.keys(nameIdToEnName).length} names`);

// 6c. Build english name → itemTag reverse map
const enNameToItemTag = {};
for (const [tag, nameId] of Object.entries(itemTagToNameId)) {
  const name = nameIdToEnName[nameId];
  if (name) enNameToItemTag[name] = tag;
}

// 6d. itemrecipedata.xml → itemTag → panelTag
const itemTagToPanel = {};
for (const line of readFileSync(RECIPE_DATA_XML, "utf8").split("\n")) {
  if (!line.includes("Panel=")) continue;
  const a = attrs(line);
  if (a.ItemTag && a.Panel) itemTagToPanel[a.ItemTag] = a.Panel;
}
console.log(`  itemrecipedata.xml: ${Object.keys(itemTagToPanel).length} panel mappings`);

// 6e. mixrecipepaneldata.xml → panelTag → 7×7 grid
// Element mapping: XML 0=Fire→4, 1=Ice→1, 2=Lightning→3, 3=Wind→2, 4=Light→5
const PANEL_ELEM_MAP = { 0: 4, 1: 1, 2: 3, 3: 2, 4: 5 };

const panelGrids = {};
const panelXml = readFileSync(PANEL_DATA_XML, "utf8");
const panelBlocks = panelXml.split("<RecipePanelData ");
for (let i = 1; i < panelBlocks.length; i++) {
  const block = panelBlocks[i];
  const tagMatch = block.match(/tag="([^"]*)"/);
  if (!tagMatch) continue;
  const tag = tagMatch[1];

  const rows = [];
  for (const rowMatch of block.matchAll(/colList="([^"]*)"/g)) {
    const cells = rowMatch[1]
      .split(",")
      .filter((v) => v !== "")
      .map(Number);
    rows.push(
      cells.map((v) => {
        if (v === -2) return null; // off (outside boundary)
        if (v === -1) return -1; // active, no element
        return PANEL_ELEM_MAP[v] ?? v; // convert to fixture element numbering
      }),
    );
  }
  panelGrids[tag] = rows;
}
console.log(`  mixrecipepaneldata.xml: ${Object.keys(panelGrids).length} panels`);

// 6f. Build fixture english name → panel grid lookup
function getPanelForEnName(enName) {
  const itemTag = enNameToItemTag[enName];
  if (!itemTag) return undefined;
  const panelTag = itemTagToPanel[itemTag];
  if (!panelTag) return undefined;
  const grid = panelGrids[panelTag];
  if (!grid) return undefined;
  return grid;
}

// Synthesis item kinds (items that can be crafted)
const SYNTH_KINDS = new Set([
  "mix",
  "attack",
  "heal",
  "buff",
  "debuff",
  "weapon",
  "armor",
  "accessory",
]);

const recipesOut = [];
const materialsOut = [];

for (const [pkStr, item] of Object.entries(items)) {
  const pk = Number(pkStr);

  // Resolve names
  const name = {};
  for (const lang of LANGS) {
    const fk = item[`item_${lang}`];
    if (fk != null && itemLang[lang][fk]) {
      name[lang] = itemLang[lang][fk].name;
    }
  }

  const base = {
    slug: item.slug,
    name,
    kind: item.kind,
    level: item.level,
  };

  if (SYNTH_KINDS.has(item.kind)) {
    // This is a synthesis recipe
    const recipe = {
      ...base,
      price: item.price || undefined,
      uses: item.uses || undefined,
      quantity: item.quantity || undefined,
      range: item.range || undefined,
      isDLC: item.isDLC || undefined,
      effects: resolveEffectLines(pk),
      ingredient: resolveIngredients(pk),
      components: (item.components || []).map((cpk) => resolveComponent(cpk)).filter(Boolean),
      categories: (item.categories || []).map((cpk) => resolveCategory(cpk)).filter(Boolean),
    };

    // Attach panel layout via english name bridge
    const panel = getPanelForEnName(name.en);
    if (panel) recipe.panel = panel;

    // Clean undefined values
    for (const key of Object.keys(recipe)) {
      if (recipe[key] === undefined) delete recipe[key];
    }

    recipesOut.push(recipe);
  }

  // All items with components are potential materials
  const compPool = (item.components || []).map((cpk) => resolveComponent(cpk)).filter(Boolean);
  if (compPool.length > 0 || item.kind === "material") {
    const mat = {
      ...base,
      categories: (item.categories || []).map((cpk) => resolveCategory(cpk)).filter(Boolean),
      components: compPool,
    };
    materialsOut.push(mat);
  }
}

// Sort by level then slug
recipesOut.sort((a, b) => a.level - b.level || a.slug.localeCompare(b.slug));
materialsOut.sort((a, b) => a.level - b.level || a.slug.localeCompare(b.slug));

// Categories output
const categoriesOut = Object.entries(categories)
  .map(([pk, cat]) => ({
    pk: Number(pk),
    slug: cat.slug,
    name: langInline(cat, "cat"),
    icon: cat.icon || undefined,
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

// Effects output
const effectsOut = Object.entries(effects)
  .map(([pk, eff]) => {
    const name = {};
    const desc = {};
    for (const lang of LANGS) {
      const fk = eff[`eff_${lang}`];
      if (fk != null && effLang[lang][fk]) {
        name[lang] = effLang[lang][fk].name;
        if (effLang[lang][fk].desc) desc[lang] = effLang[lang][fk].desc;
      }
    }
    return {
      pk: Number(pk),
      slug: eff.slug,
      name,
      desc: Object.keys(desc).length ? desc : undefined,
    };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

// ─── 7. Write output ─────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true });

function write(name, data) {
  const path = join(OUT, name);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`  ${name}: ${Array.isArray(data) ? data.length : Object.keys(data).length} records`);
}

console.log("\nWriting output:");
write("recipes.json", recipesOut);
write("materials.json", materialsOut);
write("categories.json", categoriesOut);
write("effects.json", effectsOut);

console.log("\nDone!");
