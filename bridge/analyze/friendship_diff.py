"""Find friendship storage by comparing two .data snapshots with known heart counts.

State A (latest save): Plachta 4, Ramizel 2, Alette 4, Olias 2, Diebold 3
State B (older save):  Plachta 3, Alette 1, Olias 2 (Ramizel, Diebold not yet in the party)

Works whether the game stores hearts directly or friendship points: if points, then
  Alette_B(1) < Olias_A, Olias_B (2) < Plachta_B (3) < Plachta_A, Alette_A (4)
and Ramizel_A sits in the 2-heart band, Diebold_A in the 3-heart band.
"""
import sys

import numpy as np

BASE = 0x1415F4000
a_raw = open(sys.argv[1], "rb").read()
b_raw = open(sys.argv[2], "rb").read()

# character -> index for each plausible ordering
ORDERS = {
    "screen(P,R,A,O,D)": dict(P=0, R=1, A=2, O=3, D=4),
    "element(R,O,D,A,P)": dict(R=0, O=1, D=2, A=3, P=4),
    "code(O,A,D,R,P)": dict(O=0, A=1, D=2, R=3, P=4),
}
DTYPES = [("u8", np.uint8), ("u16", np.uint16), ("u32", np.uint32), ("i32", np.int32), ("f32", np.float32)]

found = []
for dname, dt in DTYPES:
    size = np.dtype(dt).itemsize
    va = np.frombuffer(a_raw[: len(a_raw) // size * size], dtype=dt).astype(np.float64)
    vb = np.frombuffer(b_raw[: len(b_raw) // size * size], dtype=dt).astype(np.float64)
    for align in range(size):  # also try unaligned starts for >1-byte types
        if align:
            va = np.frombuffer(a_raw[align : align + (len(a_raw) - align) // size * size], dtype=dt).astype(np.float64)
            vb = np.frombuffer(b_raw[align : align + (len(b_raw) - align) // size * size], dtype=dt).astype(np.float64)
        n = len(va)
        strides = sorted(set(list(range(1, 129 // size + 1)) + [0x350 // size, 0x100 // size, 0x200 // size]))
        for s in strides:
            for oname, idx in ORDERS.items():
                span = 4 * s
                m = n - span
                if m <= 0:
                    continue
                g = lambda v, c: v[idx[c] * s : idx[c] * s + m]  # noqa: E731
                PA, AA, OA, RA, DA = (g(va, c) for c in "PAORD")
                PB, AB, OB, RB, DB = (g(vb, c) for c in "PAORD")
                ok = (
                    (AB >= 0)
                    & (AB < np.minimum(OA, OB))
                    & (np.maximum(OA, OB) < PB)
                    & (PB < np.minimum(PA, AA))
                    & (PA < 1e6)
                    & (AA < 1e6)
                    & (AB < RA) & (RA < PB)  # Ramizel_A in the 2-heart band
                    & (np.maximum(OA, RA) < DA) & (DA < np.minimum(PA, AA))  # Diebold_A in the 3-heart band
                    & (OB <= OA) & (RB <= AB) & (DB <= AB) & (RB >= 0) & (DB >= 0)  # never decreases; not yet joined in B
                )
                for b in np.nonzero(ok)[0][:20]:
                    addr = BASE + align + int(b) * size
                    vals = {c: (g(va, c)[b], g(vb, c)[b]) for c in "PRAOD"}
                    found.append((dname, s * size, oname, hex(addr), vals))

import collections
print(len(found), "candidates", dict(collections.Counter(f[0] for f in found)))
for f in found[:60]:
    d, stride, o, addr, vals = f
    print(d, f"stride={stride:#x}", o, addr, {k: (int(x), int(y)) if float(x).is_integer() else (round(x, 3), round(y, 3)) for k, (x, y) in vals.items()})
