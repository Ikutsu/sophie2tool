"""Whole-memory snapshot diffing, read-only (no injection).

  python analyze/snapdiff.py snap NAME            # page hashes + zlib-compressed contents -> dumps/snap_NAME.*
  python analyze/snapdiff.py diff A B [NOISE]     # pages changed A->B, minus pages that also changed A->NOISE
                                                  # (NOISE = an idle snapshot taken with nothing changed)
Pages are 4 KiB. Contents are stored compressed in 1 MiB blocks so a 4 GB snapshot fits in ~1 GB.
"""
import hashlib
import os
import pickle
import sys
import time
import zlib

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402
from memscan import iter_chunks  # noqa: E402

DUMPS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dumps")
PAGE = 4096
BLOCK = 1 << 20


def snap(name):
    t0 = time.time()
    addrs, hashes, index = [], [], {}
    with sb.GameMemory() as g, open(os.path.join(DUMPS, f"snap_{name}.bin"), "wb") as f:
        for addr, raw in iter_chunks(g, BLOCK):
            for p in range(0, len(raw), PAGE):
                addrs.append(addr + p)
                hashes.append(int.from_bytes(hashlib.blake2b(raw[p : p + PAGE], digest_size=8).digest(), "little"))
            comp = zlib.compress(raw, 1)
            index[addr] = (f.tell(), len(comp), len(raw))
            f.write(comp)
    np.savez(os.path.join(DUMPS, f"snap_{name}.npz"), addr=np.array(addrs, np.int64), hash=np.array(hashes, np.uint64))
    pickle.dump(index, open(os.path.join(DUMPS, f"snap_{name}.idx"), "wb"))
    print(f"snap {name}: {len(addrs)} pages, {time.time() - t0:.0f}s")


def load_hashes(name):
    z = np.load(os.path.join(DUMPS, f"snap_{name}.npz"))
    return dict(zip(z["addr"].tolist(), z["hash"].tolist()))


class Contents:
    def __init__(self, name):
        self.f = open(os.path.join(DUMPS, f"snap_{name}.bin"), "rb")
        self.index = pickle.load(open(os.path.join(DUMPS, f"snap_{name}.idx"), "rb"))
        self.cache = {}

    def page(self, addr):
        blk = addr - (addr % BLOCK) if addr % BLOCK else addr
        # blocks start at region base + k*BLOCK, which may not be BLOCK-aligned: search the index
        if blk not in self.index:
            blk = max(b for b in self.index if b <= addr)
        if blk not in self.cache:
            off, ln, _ = self.index[blk]
            self.f.seek(off)
            self.cache = {blk: zlib.decompress(self.f.read(ln))}
        return self.cache[blk][addr - blk : addr - blk + PAGE]


def diff(a, b, noise=None):
    ha, hb = load_hashes(a), load_hashes(b)
    changed = sorted(p for p, h in hb.items() if p in ha and ha[p] != h)
    if noise:
        hn = load_hashes(noise)
        noisy = {p for p, h in hn.items() if p in ha and ha[p] != h}
        changed = [p for p in changed if p not in noisy]
    print(f"{len(changed)} changed pages ({a} -> {b}{', minus noise ' + noise if noise else ''})")
    ca, cb = Contents(a), Contents(b)
    for p in changed[:200]:
        pa, pb = np.frombuffer(ca.page(p), np.uint8), np.frombuffer(cb.page(p), np.uint8)
        idx = np.nonzero(pa != pb)[0]
        spans = []
        for i in idx:
            if spans and i - spans[-1][1] <= 4:
                spans[-1][1] = i
            else:
                spans.append([i, i])
        desc = "; ".join(f"+{s:#05x}: {pa[s:e + 1].tobytes().hex()} -> {pb[s:e + 1].tobytes().hex()}" for s, e in spans[:6])
        print(f"{p:#x} {len(idx):4d}B  {desc}")


if __name__ == "__main__":
    if sys.argv[1] == "snap":
        snap(sys.argv[2])
    else:
        diff(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
