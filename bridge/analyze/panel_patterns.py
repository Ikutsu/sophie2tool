"""Build memory search patterns for a recipe's synthesis panel (from mixrecipepaneldata.xml).

Usage: python analyze/panel_patterns.py <english recipe name> > patterns.json
The 7x7 colList (−1 = plain cell, −2 = special, 0..4 = element cell in memory color codes) is emitted
row-major as int8/int16/int32, full 7x7 and center-cropped 5x5 / 6x6 (default board without catalyst is 5x5).
"""
import json
import os
import re
import struct
import sys

BRIDGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
# The game's extracted XML sits next to the sophie2tool repo, not inside it.
ATELIER = os.path.join(BRIDGE, "..", "..")


def recipe_grid(en_name: str):
    items = json.load(open(os.path.join(BRIDGE, "data", "items.json"), encoding="utf-8"))
    tag = next(i["tag"] for i in items if i["en"] == en_name)
    x = open(os.path.join(ATELIER, "mixrecipepaneldata.xml"), "rb").read().decode("cp932")
    m = re.search(r'<RecipePanelData tag="MIX_RECIPE_PANEL_' + re.escape(tag) + r'">(.*?)</RecipePanelData>', x, re.S)
    rows = [[int(v) for v in r.strip(",").split(",")] for r in re.findall(r'colList="([^"]*)"', m.group(1))]
    return tag, rows


def crop(rows, n):
    o = (7 - n) // 2
    return [r[o : o + n] for r in rows[o : o + n]]


if __name__ == "__main__":
    tag, rows = recipe_grid(sys.argv[1])
    sys.stderr.write(f"{tag}\n" + "\n".join(" ".join(f"{v:2d}" for v in r) for r in rows) + "\n")
    pats = {}
    for n in (7, 6, 5):
        g = crop(rows, n)
        flat = [v for r in g for v in r]
        for fmt, name in (("b", "i8"), ("h", "i16"), ("i", "i32")):
            pats[f"{n}x{n}/{name}"] = struct.pack(f"<{len(flat)}{fmt}", *flat).hex()
    print(json.dumps(pats))
