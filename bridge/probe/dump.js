// Dump a raw memory region to a local file.  PARAMS: { addr: "0x...", size: n, file: "path" }
const p = ptr(PARAMS.addr);
send({ file: PARAMS.file }, p.readByteArray(PARAMS.size));
send({ type: "done" });
