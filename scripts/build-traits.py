"""Build public/data/traits.json: trait names, combinations and which item kinds take them.

    python scripts/build-traits.py

Reads game text extracted next to this repo (../text_{en,jp,kr,sc,tc}/) and the
barrelwisdom fixture (../barrelwisdom/backend/fixtures/a22_data.json.gz).

- Ids are str_item_potential indices, as the bridge reports them (655 = empty slot).
- "from": the two traits that merge into this one. The game's trait library entry
  STR_LIBRARY_ESP_<id> starts with "<CLEG>A×B<CLNR>" for trait <id> (checked:
  263 攻防加成 = 攻擊加成×防禦加成, 276 全能力加成 = 攻防加成×攻速加成).
- "kinds": recipe kinds the trait can be inherited by; omitted when all can.
  From barrelwisdom's trans_* flags (its index is the potential id + 1).
"""

import gzip
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ATELIER = os.path.join(HERE, "..", "..")
OUT = os.path.join(HERE, "..", "public", "data", "traits.json")
LANGS = {"en": "text_en", "ja": "text_jp", "ko": "text_kr", "sc": "text_sc", "tc": "text_tc"}
EMPTY = 655
TRANS = {
    "trans_atk": "attack",
    "trans_heal": "heal",
    "trans_dbf": "debuff",
    "trans_buff": "buff",
    "trans_wpn": "weapon",
    "trans_arm": "armor",
    "trans_acc": "accessory",
}
STR = re.compile(r'String_ID="STR_(?:ITEM_POTENTIAL|LIBRARY_ESP)_(\d+)"[^>]*Text="([^"]*)"')


def read(lang_dir: str, name: str) -> dict[int, str]:
    with open(os.path.join(ATELIER, lang_dir, name), encoding="utf-8-sig") as f:
        return {int(i): html.unescape(t) for i, t in STR.findall(f.read())}


names = {lang: read(d, "str_item_potential.xml") for lang, d in LANGS.items()}
ids = sorted(i for i in names["tc"] if i != EMPTY and names["tc"][i])
by_tc = {}
for i in ids:
    by_tc.setdefault(names["tc"][i], i)

traits: dict[int, dict] = {i: {"name": {lang: names[lang].get(i, "") for lang in LANGS}} for i in ids}

for i, text in read(LANGS["tc"], "str_library_esp.xml").items():
    m = re.match(r"<CLEG>(.+?)×(.+?)<CLNR>", text)
    if m and i in traits and m.group(1) in by_tc and m.group(2) in by_tc:
        traits[i]["from"] = [by_tc[m.group(1)], by_tc[m.group(2)]]

fixture = json.load(gzip.open(os.path.join(ATELIER, "barrelwisdom", "backend", "fixtures", "a22_data.json.gz"), "rt", encoding="utf-8"))
for o in fixture:
    if o["model"] != "traits_a22.trait":
        continue
    i = o["fields"]["index"] - 1
    kinds = [kind for flag, kind in TRANS.items() if o["fields"][flag]]
    if i in traits and len(kinds) < len(TRANS):
        traits[i]["kinds"] = kinds

with open(OUT, "w", encoding="utf-8") as f:
    json.dump({str(i): t for i, t in traits.items()}, f, ensure_ascii=False, separators=(",", ":"))
print(f"{len(traits)} traits, {sum('from' in t for t in traits.values())} combinations, "
      f"{sum('kinds' in t for t in traits.values())} limited to some kinds -> {os.path.getsize(OUT)} bytes")
