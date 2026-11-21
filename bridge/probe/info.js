// Basic process info: main module, sections, writable memory totals.
const m = Process.mainModule;
send(`main: ${m.name} base=${m.base} size=0x${m.size.toString(16)} arch=${Process.arch}`);

const ranges = Process.enumerateRanges("rw-");
let total = 0;
for (const r of ranges) total += r.size;
send(`rw ranges: ${ranges.length}, total ${(total / 1048576).toFixed(1)} MB`);

for (const s of ["AutoSave", "SystemData", "GameData%02d"]) {
  const pat = Array.from(s).map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
  const hits = Memory.scanSync(m.base, m.size, pat);
  send(`"${s}" in main module: ${hits.map((h) => "+0x" + h.address.sub(m.base).toString(16)).join(", ")}`);
}
send({ type: "done" });
