"""Find a recipe's board in game memory without knowing the cell layout (read-only).

The board is searched as n×n cells, row-major, each cell a struct of unknown size (stride) holding
an int field of unknown width. Element cells must match their code under one of several encodings;
all plain cells (−1) must share one value X and all special cells (−2) one value Y (X != Y).

Usage: python analyze/gridscan.py "<English recipe name>" [n ...]   (default n = 5 7)
"""
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402
from memscan import iter_chunks  # noqa: E402
from panel_patterns import crop, recipe_grid  # noqa: E402

# element cell value (memory color 0..4) -> candidate encodings in the live board
ENCODINGS = {"mem": lambda c: c, "code": lambda c: sb.MEM_COLOR_TO_CODE[c], "mem+1": lambda c: c + 1}
MAX_STRIDE_BYTES = 64


def search(view: np.ndarray, grid, stride: int, enc):
    flat = [v for r in grid for v in r]
    n = len(flat)
    span = (n - 1) * stride
    m = len(view) - span
    if m <= 0:
        return []
    lits = [(k, enc(v)) for k, v in enumerate(flat) if v >= 0]
    xs = [k for k, v in enumerate(flat) if v == -1]
    ys = [k for k, v in enumerate(flat) if v == -2]
    k0, v0 = lits[0]
    cand = np.nonzero(view[k0 * stride : k0 * stride + m] == v0)[0]
    for k, v in lits[1:]:
        if not len(cand):
            return []
        cand = cand[view[cand + k * stride] == v]
    if not len(cand):
        return []
    X = view[cand + xs[0] * stride]
    keep = np.ones(len(cand), bool)
    for k in xs[1:]:
        keep &= view[cand + k * stride] == X
    if ys:
        Y = view[cand + ys[0] * stride]
        for k in ys[1:]:
            keep &= view[cand + k * stride] == Y
        keep &= Y != X
    lit_vals = {v for _, v in lits}
    keep &= ~np.isin(X, list(lit_vals))
    return cand[keep].tolist()


def main():
    name = sys.argv[1]
    sizes = [int(a) for a in sys.argv[2:]] or [5, 7]
    tag, rows = recipe_grid(name)
    grids = {n: crop(rows, n) for n in sizes}
    t0 = time.time()
    hits = []
    with sb.GameMemory() as g:
        for addr, raw in iter_chunks(g):
            for width, dt in ((1, np.int8), (2, np.int16), (4, np.int32)):
                view = np.frombuffer(raw[: len(raw) // width * width], dtype=dt)
                for stride_b in range(width, MAX_STRIDE_BYTES + 1, width):
                    for n, grid in grids.items():
                        for ename, enc in ENCODINGS.items():
                            for idx in search(view, grid, stride_b // width, enc):
                                hits.append((addr + idx * width, n, width, stride_b, ename))
                                if len(hits) > 500:
                                    break
    print(f"{tag}: {len(hits)} hits in {time.time() - t0:.0f}s")
    for h in hits[:60]:
        print(f"  addr={h[0]:#x} board={h[1]}x{h[1]} field=i{h[2] * 8} cellStride={h[3]} enc={h[4]}")


if __name__ == "__main__":
    main()
