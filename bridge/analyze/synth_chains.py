"""Check which pointer chains in data/synth_chains.json still resolve on the live game (read-only).

Run while on a synthesis board; chains that fail after re-entering synthesis can be dropped.
"""
import os
import struct
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402

t = sb.Tables()
with sb.GameMemory() as g:
    for i, chain in enumerate(t.synth_chains):
        try:
            a = sb.resolve_chain(g, chain)
            if a is None:
                print(i, "bad pointer")
                continue
            stats = struct.unpack("<11i", g.read(a, 44))
            _, _, item, quality = struct.unpack_from("<4h", g.read(a - 0x170, 8))
            print(i, hex(a), "item", item, "quality", quality, "cells", stats[:5], "links", stats[5:10],
                  "qualityGain", stats[10])
        except OSError as e:
            print(i, "FAILED", e)
