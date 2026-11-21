"""Scan all committed private read/write memory of the game for byte patterns (read-only, no injection).

Usage: python analyze/memscan.py patterns.json [--dump DIR]
patterns.json: {"name": "hex bytes", ...}
Prints hits with region info and 64 bytes of context. With --dump, saves every scanned region to DIR
(for later offline diffing between two game states).
"""
import ctypes
import ctypes.wintypes as wt
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402

MEM_COMMIT, MEM_PRIVATE = 0x1000, 0x20000
RW_PROTECT = {0x04, 0x40}  # PAGE_READWRITE, PAGE_EXECUTE_READWRITE
PAGE_GUARD = 0x100


class MBI(ctypes.Structure):
    _fields_ = [
        ("BaseAddress", ctypes.c_void_p), ("AllocationBase", ctypes.c_void_p), ("AllocationProtect", wt.DWORD),
        ("PartitionId", wt.WORD), ("RegionSize", ctypes.c_size_t), ("State", wt.DWORD),
        ("Protect", wt.DWORD), ("Type", wt.DWORD),
    ]


k32 = ctypes.WinDLL("kernel32", use_last_error=True)
k32.VirtualQueryEx.argtypes = [wt.HANDLE, ctypes.c_void_p, ctypes.POINTER(MBI), ctypes.c_size_t]
k32.VirtualQueryEx.restype = ctypes.c_size_t


def regions(handle, max_region=512 << 20):
    addr = 0
    mbi = MBI()
    while k32.VirtualQueryEx(handle, ctypes.c_void_p(addr), ctypes.byref(mbi), ctypes.sizeof(mbi)):
        base, size = mbi.BaseAddress or 0, mbi.RegionSize
        if (
            mbi.State == MEM_COMMIT
            and mbi.Type == MEM_PRIVATE
            and (mbi.Protect & 0xFF) in RW_PROTECT
            and not mbi.Protect & PAGE_GUARD
            and size <= max_region
        ):
            yield base, size
        addr = base + size
        if addr >= 0x7FFFFFFFFFFF:
            break


def iter_chunks(g, chunk=16 << 20):
    """Yield (address, bytes) for every readable chunk of the game's private read/write memory."""
    for base, size in regions(g.handle):
        for off in range(0, size, chunk):
            try:
                yield base + off, g.read(base + off, min(chunk, size - off))
            except OSError:
                continue


def main():
    pats = {k: bytes.fromhex(v) for k, v in json.load(open(sys.argv[1])).items()}
    dump_dir = sys.argv[sys.argv.index("--dump") + 1] if "--dump" in sys.argv else None
    if dump_dir:
        os.makedirs(dump_dir, exist_ok=True)
    hits = {k: [] for k in pats}
    t0, total, n = time.time(), 0, 0
    with sb.GameMemory() as g:
        for addr, data in iter_chunks(g):
            total += len(data)
            n += 1
            if dump_dir:
                with open(os.path.join(dump_dir, f"{addr:016x}.bin"), "wb") as f:
                    f.write(data)
            for name, p in pats.items():
                i = data.find(p)
                while i != -1 and len(hits[name]) < 200:
                    hits[name].append((addr + i, data[max(0, i - 32) : i + 32]))
                    i = data.find(p, i + 1)
    print(f"scanned {n} chunks, {total / 2**20:.0f} MB in {time.time() - t0:.1f}s")
    for name, hs in hits.items():
        print(f"== {name}: {len(hs)} hits")
        for a, ctx in hs[:15]:
            print(f"  {a:#x}  {ctx.hex(' ')}")


if __name__ == "__main__":
    main()
