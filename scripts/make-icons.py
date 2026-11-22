"""Build the site icons from scripts/icon-source.jpg.

    bridge/.venv/Scripts/python scripts/make-icons.py

icon-source.jpg is Sophie's face cropped from the game's Steam library artwork
(library_hero.jpg, 1920x620), framed like the game's own icon, whose face version
only goes up to 64 px. It is 350 px, so the 512 px icons are upscaled slightly.
"""

import base64
import io
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public")

face = Image.open(os.path.join(HERE, "icon-source.jpg")).convert("RGBA")


def square(size: int) -> Image.Image:
    return face.resize((size, size), Image.LANCZOS)


def rounded(size: int, radius: float = 0.2) -> Image.Image:
    """The face in a rounded square, as the game icon looks on the desktop."""
    mask = Image.new("L", (size * 4, size * 4))
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * 4 - 1, size * 4 - 1], radius=round(size * 4 * radius), fill=255)
    im = square(size)
    im.putalpha(mask.resize((size, size), Image.LANCZOS))
    return im


def save(im: Image.Image, name: str) -> None:
    path = os.path.join(PUBLIC, name)
    if name.endswith(".webp"):
        im.save(path, quality=90)  # illustrations stay ~10x smaller than PNG
    else:
        im.save(path, optimize=True)
    print(name, os.path.getsize(path))


save(rounded(32, 0.18), "favicon-32.png")
save(square(180).convert("RGB"), "apple-touch-icon.png")  # iOS rounds the corners itself
save(rounded(192), "icon-192.webp")
save(rounded(512), "icon-512.webp")
save(square(512).convert("RGB"), "icon-maskable-512.webp")  # Android applies its own mask

# favicon.svg: a 128 px WebP in a rounded clip, so browsers scale it from more pixels.
buf = io.BytesIO()
square(128).convert("RGB").save(buf, "WEBP", quality=88)
data = base64.b64encode(buf.getvalue()).decode()
with open(os.path.join(PUBLIC, "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">'
        '<clipPath id="r"><rect width="128" height="128" rx="24"/></clipPath>'
        f'<image href="data:image/webp;base64,{data}" width="128" height="128" clip-path="url(#r)"/></svg>\n'
    )
print("favicon.svg", os.path.getsize(os.path.join(PUBLIC, "favicon.svg")))
