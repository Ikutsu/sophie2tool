/**
 * The Atelier icon font draws each element as a solid disc with the symbol cut out,
 * so tinting the glyph colors the disc, not the symbol. The game shows the symbol
 * itself in color. At startup this draws each glyph to a canvas, keeps only the
 * cut-out symbol, and exposes it as a CSS mask: --el-mask-<name> (see index.css).
 */
const GLYPHS: Record<string, string> = {
  ice: "",
  wind: "",
  lightning: "",
  fire: "",
  light: "",
};

const SIZE = 128;

function symbolMask(glyph: string): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE * 1.5;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  ctx.font = `${SIZE}px Atelier`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 1. Find the glyph's disc: bounding box of its opaque pixels.
  ctx.fillText(glyph, x, y);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      if (data[(py * width + px) * 4 + 3] > 128) {
        x0 = Math.min(x0, px);
        x1 = Math.max(x1, px);
        y0 = Math.min(y0, py);
        y1 = Math.max(y1, py);
      }
    }
  }
  if (x1 < 0) return null; // font not loaded

  // 2. Fill a circle just inside the disc, then erase the glyph: only the cut-out
  //    symbol stays opaque.
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const r = Math.min(x1 - x0, y1 - y0) / 2 - 2;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillText(glyph, x, y);

  // 3. Crop to the disc so the mask is centered and square.
  const side = Math.ceil(r * 2);
  const out = document.createElement("canvas");
  out.width = out.height = side;
  out.getContext("2d")?.drawImage(canvas, cx - r, cy - r, side, side, 0, 0, side, side);
  return out.toDataURL();
}

export async function installElementMasks(): Promise<void> {
  try {
    await document.fonts.load(`${SIZE}px Atelier`);
  } catch {
    return; // icons stay blank rather than breaking the page
  }
  const root = document.documentElement.style;
  for (const [name, glyph] of Object.entries(GLYPHS)) {
    const url = symbolMask(glyph);
    if (url) root.setProperty(`--el-mask-${name}`, `url(${url})`);
  }
}
