// Find ASCII strings in all readable memory; print context as text.  PARAMS: { needle, ctx, maxHits }
setTimeout(() => {
  const pat = Array.from(PARAMS.needle).map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
  const ranges = Process.enumerateRanges({ protection: "r--", coalesce: true });
  let hits = 0;
  for (const r of ranges) {
    let found;
    try { found = Memory.scanSync(r.base, r.size, pat); } catch (e) { continue; }
    for (const h of found) {
      hits++;
      if (hits <= (PARAMS.maxHits ?? 10)) {
        const ctx = PARAMS.ctx ?? 200;
        let s = "";
        try {
          const b = new Uint8Array(h.address.sub(ctx).readByteArray(ctx * 2));
          for (const x of b) s += x >= 32 && x < 127 ? String.fromCharCode(x) : x === 10 ? "\n" : "·";
        } catch (e) { s = "(unreadable)"; }
        send(`--- ${h.address} (${r.protection}) ---\n${s}`);
      }
    }
  }
  send(`total hits: ${hits}`);
  send({ type: "done" });
}, 0);
