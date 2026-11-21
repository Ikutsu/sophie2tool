"""Cheat-Engine style value narrowing, read-only (no injection).

  python analyze/valuescan.py first <name> <value>   # all aligned i32/i16 equal to value -> dumps/vs_<name>.npz
  python analyze/valuescan.py next  <name> <value>   # keep only candidates now equal to value
  python analyze/valuescan.py show  <name> [ctx]     # print surviving candidates with context
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402
from memscan import iter_chunks  # noqa: E402

CHUNK = 16 << 20
TYPES = {"i32": np.int32, "i16": np.int16}


def path(name):
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dumps", f"vs_{name}.npz")


def first(name, value):
    found = {t: [] for t in TYPES}
    with sb.GameMemory() as g:
        for addr, raw in iter_chunks(g, CHUNK):
            for t, dt in TYPES.items():
                w = np.dtype(dt).itemsize
                v = np.frombuffer(raw[: len(raw) // w * w], dtype=dt)
                found[t].append(np.nonzero(v == value)[0].astype(np.int64) * w + addr)
    arrs = {t: np.concatenate(a) if a else np.zeros(0, np.int64) for t, a in found.items()}
    np.savez(path(name), **arrs)
    print({t: len(a) for t, a in arrs.items()})


def next_(name, value):
    arrs = dict(np.load(path(name)))
    out = {}
    with sb.GameMemory() as g:
        for t, addrs in arrs.items():
            dt = TYPES[t]
            w = np.dtype(dt).itemsize
            keep = []
            pages = np.unique(addrs >> 12)
            # read contiguous runs of pages
            runs = np.split(pages, np.nonzero(np.diff(pages) != 1)[0] + 1) if len(pages) else []
            for run in runs:
                start, n = int(run[0]) << 12, len(run) << 12
                for s in range(0, n, CHUNK):
                    ln = min(CHUNK, n - s)
                    try:
                        raw = g.read(start + s, ln)
                    except OSError:
                        continue
                    sel = addrs[(addrs >= start + s) & (addrs < start + s + ln - w + 1)]
                    v = np.frombuffer(raw, dtype=np.uint8)
                    idx = sel - (start + s)
                    vals = np.zeros(len(sel), np.int64)
                    for b in range(w):
                        vals |= v[idx + b].astype(np.int64) << (8 * b)
                    if w == 4:
                        vals = np.where(vals >= 2**31, vals - 2**32, vals)
                    else:
                        vals = np.where(vals >= 2**15, vals - 2**16, vals)
                    keep.append(sel[vals == value])
            out[t] = np.concatenate(keep) if keep else np.zeros(0, np.int64)
    np.savez(path(name), **out)
    print({t: len(a) for t, a in out.items()})


def show(name, ctx=32):
    arrs = dict(np.load(path(name)))
    with sb.GameMemory() as g:
        for t, addrs in arrs.items():
            for a in addrs[:40]:
                try:
                    raw = g.read(int(a) - ctx, 2 * ctx)
                except OSError:
                    continue
                print(t, hex(int(a)), raw.hex(" "))


if __name__ == "__main__":
    cmd, name = sys.argv[1], sys.argv[2]
    if cmd == "first":
        first(name, int(sys.argv[3]))
    elif cmd == "next":
        next_(name, int(sys.argv[3]))
    else:
        show(name, int(sys.argv[3]) if len(sys.argv) > 3 else 32)
