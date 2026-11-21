"""Find pointer chains from static .data to a heap target, using a saved snapshot (offline).

Usage: python analyze/pointerscan.py SNAP TARGET_HEX [max_offset_hex] [levels]
Level 1: every 8-byte-aligned value in the snapshot (and live .data) pointing into
[TARGET - max_offset, TARGET]. Then repeat for each hit's containing object, up to `levels`.
Stops at hits that live in the exe's static .data (stable address).
"""
import os
import pickle
import sys
import zlib

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402

DUMPS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dumps")
DATA_LO, DATA_HI = 0x1415F4000, 0x1415F4000 + 0x57CE48


def load_blocks(name):
    index = pickle.load(open(os.path.join(DUMPS, f"snap_{name}.idx"), "rb"))
    f = open(os.path.join(DUMPS, f"snap_{name}.bin"), "rb")
    for base, (off, ln, _) in sorted(index.items()):
        f.seek(off)
        yield base, zlib.decompress(f.read(ln))


def find_refs(blocks, targets, max_off):
    """targets: list of addresses; returns {target: [(addr_of_pointer, offset)]}"""
    t = np.array(sorted(targets), np.uint64)
    res = {int(x): [] for x in t}
    for base, raw in blocks:
        v = np.frombuffer(raw[: len(raw) // 8 * 8], np.uint64)
        mask = (v >= t[0] - np.uint64(max_off)) & (v <= t[-1])
        for i in np.nonzero(mask)[0]:
            p = int(v[i])
            j = np.searchsorted(t, np.uint64(p))  # first target >= p
            if j < len(t) and int(t[j]) - p <= max_off:
                res[int(t[j])].append((base + int(i) * 8, int(t[j]) - p))
    return res


def main():
    snap, target = sys.argv[1], int(sys.argv[2], 16)
    max_off = int(sys.argv[3], 16) if len(sys.argv) > 3 else 0x400
    levels = int(sys.argv[4]) if len(sys.argv) > 4 else 3
    with sb.GameMemory() as g:
        static = (DATA_LO, g.read(DATA_LO, DATA_HI - DATA_LO))
    frontier = {target: []}  # address -> chain (list of (ptr_addr, offset))
    for lvl in range(1, levels + 1):
        blocks = list(load_blocks(snap)) + [static]
        refs = find_refs(blocks, list(frontier), max_off)
        nxt = {}
        n = 0
        for tgt, lst in refs.items():
            for ptr_addr, off in lst:
                chain = [(ptr_addr, off)] + frontier[tgt]
                n += 1
                if DATA_LO <= ptr_addr < DATA_HI:
                    print("STATIC CHAIN:", " -> ".join(f"[{a:#x}]+{o:#x}" for a, o in chain), f"=> {target:#x}")
                nxt[ptr_addr] = chain
        print(f"level {lvl}: {n} pointers")
        if not nxt or n > 20000:
            break
        frontier = nxt


if __name__ == "__main__":
    main()
