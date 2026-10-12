"""Builds a side-by-side review image: approved design (left) vs rendered login (right).

Usage: python3 scripts/compare-design.py
Requires Pillow. Output: docs/evidence/design-comparison-login.png
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
REFERENCE = ROOT.parent / "designs" / "accounts" / "01-login.png"
RENDERED = ROOT / "docs" / "evidence" / "login-1440.png"
OUTPUT = ROOT / "docs" / "evidence" / "design-comparison-login.png"
HEIGHT = 720
LABEL = 32


def scaled(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    return image.resize((round(image.width * HEIGHT / image.height), HEIGHT), Image.Resampling.LANCZOS)


reference, rendered = scaled(REFERENCE), scaled(RENDERED)
canvas = Image.new("RGB", (reference.width + rendered.width + 24, HEIGHT + LABEL), "#202020")
canvas.paste(reference, (0, LABEL))
canvas.paste(rendered, (reference.width + 24, LABEL))
draw = ImageDraw.Draw(canvas)
draw.text((8, 8), f"Approved: {REFERENCE.name} (flattened source)", fill="white")
draw.text((reference.width + 32, 8), "Rendered: localhost:3000/login @1440x900 (Docker BFF runtime)", fill="white")
canvas.save(OUTPUT)
print(OUTPUT)
