#!/usr/bin/env python3
"""
Sprite sheet icon extractor for Pintalú.
Usage: python3 scripts/extract_icons.py <path-to-sprite.png> [output-dir]

Algorithm:
  1. Detect the beige background colour from the image corners.
  2. Flood-fill from every corner → binary mask of non-background pixels.
  3. Find connected rectangular "card" regions (the white rounded-rect chips).
  4. For each card, flood-fill the white chip background → transparent PNG.
  5. Trim transparent padding and save with the provided label names.
"""

import sys
import os
import math
from PIL import Image, ImageDraw

# ── CLI args ──────────────────────────────────────────────────────────────────
if len(sys.argv) < 2:
    print("Usage: python3 extract_icons.py <sprite.png> [output-dir]")
    sys.exit(1)

SRC = sys.argv[1]
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src/assets/icons"
)
os.makedirs(OUTDIR, exist_ok=True)

# Expected icon names in reading order (left→right, top→bottom per section)
NAMES = [
    # Header buttons
    "btn_undo", "btn_redo", "btn_trash", "btn_cloud", "btn_save", "btn_menu",
    # Tool icons
    "tool_paintbrush", "tool_pastel", "tool_crayon",
    "tool_paintpot", "tool_bucket", "tool_palette", "tool_scissors", "tool_eraser",
    # Brush sizes
    "size_xs", "size_sm", "size_md", "size_lg",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def color_distance(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])))

def sample_bg_color(img: Image.Image, samples=5):
    """Average colour from the four corners + centre-edges."""
    w, h = img.size
    pts = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1),
    ]
    px = img.load()
    cols = [px[p] for p in pts]
    r = sum(c[0] for c in cols) // len(cols)
    g = sum(c[1] for c in cols) // len(cols)
    b = sum(c[2] for c in cols) // len(cols)
    return (r, g, b)

def make_bg_mask(img: Image.Image, bg_color, tol=30) -> Image.Image:
    """Returns a grayscale mask: 255 = background, 0 = foreground."""
    mask = Image.new("L", img.size, 0)
    px = img.convert("RGB").load()
    mpx = mask.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if color_distance(px[x, y], bg_color) < tol:
                mpx[x, y] = 255
    return mask

def find_card_boxes(bg_mask: Image.Image, min_size=40):
    """
    Find bounding boxes of the white 'card' chips by looking for rectangular
    regions that are NOT background (i.e., foreground blobs).
    Uses a simple row/col projection approach.
    """
    import numpy as np
    arr = (np.array(bg_mask) < 128).astype("uint8")  # 1 = foreground
    row_proj = arr.sum(axis=1)  # sum per row
    col_proj = arr.sum(axis=0)  # sum per col

    def find_runs(proj, threshold):
        runs = []
        in_run = False
        start = 0
        for i, v in enumerate(proj):
            if not in_run and v > threshold:
                in_run = True
                start = i
            elif in_run and v <= threshold:
                in_run = False
                if i - start >= min_size:
                    runs.append((start, i))
        if in_run and len(proj) - start >= min_size:
            runs.append((start, len(proj)))
        return runs

    row_runs = find_runs(row_proj, 5)
    col_runs = find_runs(col_proj, 5)

    boxes = []
    for (y0, y1) in row_runs:
        for (x0, x1) in col_runs:
            boxes.append((x0, y0, x1, y1))
    return boxes

def remove_white_bg(img: Image.Image, white_tol=30) -> Image.Image:
    """Make near-white pixels transparent."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    white = (255, 255, 255)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if color_distance((r, g, b), white) < white_tol:
                px[x, y] = (r, g, b, 0)
    return img

def remove_bg_color(img: Image.Image, bg_color, tol=30) -> Image.Image:
    """Make pixels close to bg_color transparent."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if color_distance((r, g, b), bg_color) < tol:
                px[x, y] = (r, g, b, 0)
    return img

def trim_alpha(img: Image.Image, padding=4) -> Image.Image:
    """Trim transparent edges and add small padding."""
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    w, h = img.size
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(w, x1 + padding)
    y1 = min(h, y1 + padding)
    return img.crop((x0, y0, x1, y1))

# ── Main ──────────────────────────────────────────────────────────────────────

print(f"Loading: {SRC}")
img = Image.open(SRC).convert("RGB")
w, h = img.size
print(f"  Size: {w} × {h}")

bg_color = sample_bg_color(img)
print(f"  Detected background colour: rgb{bg_color}")

print("  Building background mask…")
bg_mask = make_bg_mask(img, bg_color, tol=35)

print("  Finding card regions…")
try:
    boxes = find_card_boxes(bg_mask, min_size=40)
except ImportError:
    print("  numpy not found — falling back to manual grid detection")
    # Fallback: divide image into a rough grid
    cols_n, rows_n = 6, 7
    cw, rh = w // cols_n, h // rows_n
    boxes = [
        (c * cw, r * rh, (c + 1) * cw, (r + 1) * rh)
        for r in range(rows_n) for c in range(cols_n)
    ]

# Sort boxes: top→bottom then left→right
boxes.sort(key=lambda b: (b[1] // 100, b[0]))
print(f"  Found {len(boxes)} card regions")

for i, box in enumerate(boxes):
    name = NAMES[i] if i < len(NAMES) else f"icon_{i:02d}"
    x0, y0, x1, y1 = box

    # Crop the card from original image
    card = img.crop((x0, y0, x1, y1))

    # Remove the beige page background first
    result = remove_bg_color(card, bg_color, tol=35)

    # Remove the white chip background
    result = remove_white_bg(result, white_tol=25)

    # Trim and save
    result = trim_alpha(result, padding=6)
    out_path = os.path.join(OUTDIR, f"{name}.png")
    result.save(out_path, "PNG")
    print(f"  [{i+1:2d}] {name:20s} → {result.size[0]}×{result.size[1]}  {out_path}")

print(f"\nDone. {min(len(boxes), len(NAMES))} icons saved to: {OUTDIR}")
