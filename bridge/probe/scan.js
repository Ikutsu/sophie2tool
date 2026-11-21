// Scan all rw memory for byte patterns; for each hit dump surrounding bytes.
setTimeout(() => {
// PARAMS: { patterns: {name: "hex pattern"}, before: n, after: n, maxHits: n }
const before = PARAMS.before ?? 64;
const after = PARAMS.after ?? 64;
const maxHits = PARAMS.maxHits ?? 20;

const ranges = Process.enumerateRanges({ protection: PARAMS.prot ?? "rw-", coalesce: true });
for (const [name, pat] of Object.entries(PARAMS.patterns)) {
  const hits = [];
  for (const r of ranges) {
    try {
      for (const h of Memory.scanSync(r.base, r.size, pat)) {
        hits.push(h.address);
        if (hits.length > 5000) break;
      }
    } catch (e) {
      /* unreadable range */
    }
    if (hits.length > 5000) break;
  }
  send(`== ${name} "${pat}": ${hits.length} hits`);
  for (const a of hits.slice(0, maxHits)) {
    try {
      const start = a.sub(before);
      const bytes = new Uint8Array(start.readByteArray(before + after));
      const words = [];
      for (let i = 0; i < bytes.length; i += 2) words.push(bytes[i] | (bytes[i + 1] << 8));
      send({ addr: a.toString(), s16: words.map((w) => (w >= 0x8000 ? w - 0x10000 : w)).join(",") });
    } catch (e) {
      send(`${a}: unreadable`);
    }
  }
}
send({ type: "done" });
}, 0);
