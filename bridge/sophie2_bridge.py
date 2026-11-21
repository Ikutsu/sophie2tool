"""Read-only access to Atelier Sophie 2 game state (Steam, v1.8.0.0).

Uses ReadProcessMemory only: nothing is injected into or written to the game.
All addresses are static (the exe has no ASLR).
"""
from __future__ import annotations

import ctypes
import ctypes.wintypes as wt
import html
import json
import os
import struct

PROCESS_NAME = "Atelier_Sophie_2.exe"
IMAGE_BASE = 0x140000000
EXPECTED_TIMESTAMP = 0x63D3CFDA  # PE header TimeDateStamp of v1.8.0.0

# Material box (材料箱): static array of BOX_CAPACITY records, REC bytes each; empty slots have item -1.
# Record layout (little-endian):
#   +0  s16 serial          +2  s16 (always 1)      +4  s16 item index (itemdata.xml order)
#   +6  s16 quality         +8  s16 quality copy    +10 s16 traits[3] (EMPTY_TRAIT = none)
#   +16 s16 effects[4] (-1 = none)
#   +24 u8 color[4] (memory colors, 0xff = no component)   +28 u8 shape[4] (shape table index)
#   +32 u8 link[4] (link table index)                       +36 8 bytes unknown
BOX_ADDR = 0x1418778C0
BOX_CAPACITY = 9999
REC = 44
EMPTY_TRAIT = 655

# memory color -> barrelwisdom code digit (1=ice 2=wind 3=thunder 4=fire 5=light)
MEM_COLOR_TO_CODE = {0: 4, 1: 1, 2: 3, 3: 2, 4: 5}

HERE = os.path.dirname(os.path.abspath(__file__))
WEB_DATA = os.path.join(HERE, "..", "public", "data")

# ─── Win32 plumbing ────────────────────────────────────────────────

_k32 = ctypes.WinDLL("kernel32", use_last_error=True)
TH32CS_SNAPPROCESS = 0x2
PROCESS_VM_READ = 0x0010
PROCESS_QUERY_LIMITED_INFORMATION = 0x1000


class _PROCESSENTRY32W(ctypes.Structure):
    _fields_ = [
        ("dwSize", wt.DWORD), ("cntUsage", wt.DWORD), ("th32ProcessID", wt.DWORD),
        ("th32DefaultHeapID", ctypes.c_void_p), ("th32ModuleID", wt.DWORD), ("cntThreads", wt.DWORD),
        ("th32ParentProcessID", wt.DWORD), ("pcPriClassBase", ctypes.c_long), ("dwFlags", wt.DWORD),
        ("szExeFile", ctypes.c_wchar * 260),
    ]


_k32.CreateToolhelp32Snapshot.restype = wt.HANDLE
_k32.OpenProcess.restype = wt.HANDLE
_k32.ReadProcessMemory.argtypes = [wt.HANDLE, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.POINTER(ctypes.c_size_t)]
_k32.CloseHandle.argtypes = [wt.HANDLE]


def find_pid(name: str = PROCESS_NAME) -> int | None:
    snap = _k32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    entry = _PROCESSENTRY32W()
    entry.dwSize = ctypes.sizeof(entry)
    try:
        ok = _k32.Process32FirstW(snap, ctypes.byref(entry))
        while ok:
            if entry.szExeFile.lower() == name.lower():
                return entry.th32ProcessID
            ok = _k32.Process32NextW(snap, ctypes.byref(entry))
    finally:
        _k32.CloseHandle(snap)
    return None


class GameNotRunning(Exception):
    pass


class UnsupportedVersion(Exception):
    pass


class GameMemory:
    """Context manager holding a read-only handle to the game process."""

    def __enter__(self) -> "GameMemory":
        pid = find_pid()
        if pid is None:
            raise GameNotRunning(PROCESS_NAME)
        self.pid = pid
        self.handle = _k32.OpenProcess(PROCESS_VM_READ | PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if not self.handle:
            raise OSError(ctypes.get_last_error(), "OpenProcess failed")
        self._check_version()
        return self

    def __exit__(self, *exc) -> None:
        _k32.CloseHandle(self.handle)

    def read(self, addr: int, size: int) -> bytes:
        buf = ctypes.create_string_buffer(size)
        got = ctypes.c_size_t()
        if not _k32.ReadProcessMemory(self.handle, ctypes.c_void_p(addr), buf, size, ctypes.byref(got)) or got.value != size:
            raise OSError(ctypes.get_last_error(), f"ReadProcessMemory failed at {addr:#x}")
        return buf.raw

    def _check_version(self) -> None:
        hdr = self.read(IMAGE_BASE, 0x400)
        if hdr[:2] != b"MZ":
            raise UnsupportedVersion("exe not mapped at the expected base")
        pe = struct.unpack_from("<I", hdr, 0x3C)[0]
        ts = struct.unpack_from("<I", hdr, pe + 8)[0]
        if ts != EXPECTED_TIMESTAMP:
            raise UnsupportedVersion(f"exe timestamp {ts:#x}, expected {EXPECTED_TIMESTAMP:#x} (v1.8.0.0)")


# ─── Static tables ─────────────────────────────────────────────────


def _load(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class Tables:
    def __init__(self) -> None:
        self.items = _load(os.path.join(HERE, "data", "items.json"))
        self.shapes = _load(os.path.join(HERE, "data", "shape_table.json"))["shapes"]
        # Link-cell table read from the exe (file offset 0xe18d30): id -> list of link cells.
        self.stars = dict(enumerate(_load(os.path.join(HERE, "data", "star_table_exe.json"))["stars"]))
        self.traits = {int(k): v for k, v in _load(os.path.join(HERE, "data", "traits.json")).items()}
        self.effects = {int(k): v for k, v in _load(os.path.join(HERE, "data", "effects.json")).items()}
        self.synth_chains = _load(os.path.join(HERE, "data", "synth_chains.json"))
        mats = _load(os.path.join(WEB_DATA, "materials.json"))
        self.slug_by_en = {html.unescape(m["name"]["en"]): m["slug"] for m in mats}


# ─── Decoding ──────────────────────────────────────────────────────


def component_code(color: int, shape: int, link: int, t: Tables) -> str | None:
    """Convert a memory component to the web app's 10-char code (color digit + 3×3, 2 = link)."""
    if color not in MEM_COLOR_TO_CODE or shape >= len(t.shapes):
        return None
    grid = ["1" if v else "0" for v in t.shapes[shape]]
    for p in t.stars.get(link, []):
        grid[p] = "2"
    return str(MEM_COLOR_TO_CODE[color]) + "".join(grid)


def decode_box(raw: bytes, t: Tables) -> list[dict]:
    """Owned items the web app knows (by slug). Traits are ids; names come once via `trait_names`."""
    out = []
    for slot in range(BOX_CAPACITY):
        o = slot * REC
        serial, _, item, quality = struct.unpack_from("<4h", raw, o)
        if not 0 <= item < len(t.items):
            continue
        slug = t.slug_by_en.get(html.unescape(t.items[item]["en"] or ""))
        if slug is None:
            continue
        comps = []
        for k in range(4):
            code = component_code(raw[o + 24 + k], raw[o + 28 + k], raw[o + 32 + k], t)
            if code:
                comps.append({"code": code})
        out.append({
            "id": serial,
            "item": item,
            "slug": slug,
            "quality": quality,
            "traits": [x for x in struct.unpack_from("<3h", raw, o + 10) if x != EMPTY_TRAIT],
            "components": comps,
        })
    return out


def trait_names(items: list[dict], t: Tables) -> dict[int, dict]:
    """Multilingual names of the traits that appear in `items`."""
    return {x: t.traits[x] for it in items for x in it["traits"] if x in t.traits}


# Friendship: static array of 20-byte records in screen order (Plachta first); first int32 = hearts - 1.
# Found by diffing two saves (latest: 4/2/4/2/3 hearts, older: 3/-/1/2/- hearts).
FRIENDSHIP_ADDR = 0x141871918
FRIENDSHIP_REC = 0x14
# (key, web element code) in that order: Plachta light, Ramizel fire, Alette wind, Olias ice, Diebold thunder
COMPANIONS = [("plachta", 5), ("ramizel", 4), ("alette", 2), ("olias", 1), ("diebold", 3)]


def read_companions(g: GameMemory) -> list[dict]:
    raw = g.read(FRIENDSHIP_ADDR, FRIENDSHIP_REC * len(COMPANIONS))
    out = []
    for k, (key, element) in enumerate(COMPANIONS):
        level = struct.unpack_from("<i", raw, k * FRIENDSHIP_REC)[0]
        if 0 <= level <= 5:  # 1..6 hearts; anything else means the layout is not what we expect
            out.append({"key": key, "element": element, "hearts": level + 1})
    return out


# Live synthesis stats. The result object lives in a heap arena; these chains (found with
# analyze/pointerscan.py, filtered by re-entering synthesis) lead from static .data to its
# per-element cell-count array. Layout from there (int32): cells[5], links[5], quality gain
# (quality minus base quality; NOT the great-success %, which the game shows as occupied cells).
# 0x170 bytes before it is a 44-byte item record previewing the product (item index, quality).
ELEMENTS = ["fire", "ice", "thunder", "wind", "light"]


def resolve_chain(g: GameMemory, chain: dict) -> int | None:
    addr = int(chain["static"], 16)
    for off in chain["offsets"]:
        ptr = struct.unpack("<Q", g.read(addr, 8))[0]
        if not (0x10000 <= ptr < 0x7FFF_FFFF_FFFF):
            return None
        addr = ptr + int(off, 16)
    return addr


def read_synthesis(t: Tables, g: GameMemory | None = None) -> dict | None:
    """Current synthesis result stats, or None when not on a synthesis board.
    Pass an open GameMemory to reuse it (e.g. when polling)."""
    if g is None:
        with GameMemory() as g:
            return read_synthesis(t, g)
    for chain in t.synth_chains:
        try:
            a = resolve_chain(g, chain)
            if a is None:
                continue
            stats = struct.unpack("<11i", g.read(a, 44))
            preview = g.read(a - 0x170, REC)
            _, _, item, quality = struct.unpack_from("<4h", preview, 0)
        except OSError:
            continue
        cells, links, gain = stats[:5], stats[5:10], stats[10]
        if not (0 <= item < len(t.items) and 0 <= quality <= 999 and 0 <= gain <= 999):
            continue
        if not all(0 <= v <= 99 for v in cells + links):
            continue
        # The preview record's effect slots hold the effect currently unlocked on each effect line.
        effects = list(struct.unpack_from("<4h", preview, 16))
        return {
            "item": item,
            "itemEn": t.items[item]["en"],
            "quality": quality,
            "effects": [
                {"line": i, "id": e, "name": t.effects.get(e)} if e >= 0 else {"line": i, "id": None}
                for i, e in enumerate(effects)
            ],
            "cells": dict(zip(ELEMENTS, cells)),
            "links": dict(zip(ELEMENTS, links)),
            "qualityGain": gain,
        }
    return None


def read_material_box(t: Tables) -> dict:
    with GameMemory() as g:
        raw = g.read(BOX_ADDR, BOX_CAPACITY * REC)
        items = decode_box(raw, t)
        return {"items": items, "traits": trait_names(items, t), "companions": read_companions(g)}
