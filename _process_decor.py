"""
One-off processing script: takes the 5 pasted illustrations, feathers their
outer edges, and shifts their near-white background toward the site's cream
tone (partially dissolving it) so they sit naturally as background art behind
site sections. Subject pixels (colored / saturated / dark) are left intact.
Not part of the site runtime -- just a build step.
"""
import math
from PIL import Image

CREAM_TARGET = (250, 246, 240)  # sits between --cream (#fdfaf6) and --cream-2 (#f7f1ea)
MAX_DIM = 1000

DECOR_SRC = r"C:\Users\Gleb\Downloads\Telegram Desktop\ChatExport_2026-08-06\site\assets\декор"

SOURCES = {
    # --- already processed (skip if output exists) ---
    "corgi.png": r"C:\Users\Gleb\Downloads\Max_a_Redraw_the_people_an (2).png",
    "wedding.png": r"C:\Users\Gleb\Downloads\пример.jpg",
    "bed-closeup.png": r"C:\Users\Gleb\Downloads\lina-f-alpha_b_Redraw_the_people_an.png",
    "holiday-couple.png": r"C:\Users\Gleb\Downloads\Max_a_Redraw_the_people_an.png",
    "chocolate.png": r"C:\Users\Gleb\Downloads\Max_a_Redraw_the_people_an (1).png",
    # --- new batch from декор folder ---
    "couple-kiss.png":   DECOR_SRC + r"\iron-bloom_a_Redraw_the_people_an.png",
    "bed-closeup-2.png": DECOR_SRC + r"\Max_a_Redraw_the_people_an (3).png",
    "mugs.png":          DECOR_SRC + r"\Max_a_Redraw_the_people_an (4).png",
    "winter-corgi.png":  DECOR_SRC + r"\Max_a_Redraw_the_people_an (5).png",
    "green-jacket.png":  DECOR_SRC + r"\Max_a_Redraw_the_people_an (6).png",
    "corgi-dinner.png":  DECOR_SRC + r"\Max_a_Redraw_the_people_an (7).png",
    "disco-couple.png":  DECOR_SRC + r"\Max_a_Redraw_the_people_an (8).png",
    "cat-bucket.png":    DECOR_SRC + r"\Max_a_Redraw_the_people_an (9).png",
    "mountain-kiss.png": DECOR_SRC + r"\Max_a_Redraw_the_people_an (10).png",
    "cat-car.png":       DECOR_SRC + r"\Max_a_Redraw_the_people_an (11).png",
    "cat-bed.png":       DECOR_SRC + r"\Max_a_Redraw_the_people_an (12).png",
    "corgi-garden.png":  DECOR_SRC + r"\Max_a_Redraw_the_people_an (13).png",
    "cat-table.png":     DECOR_SRC + r"\Max_a_Redraw_the_people_an (14).png",
}

OUT_DIR = r"C:\Users\Gleb\Downloads\Telegram Desktop\ChatExport_2026-08-06\site\assets\decor"


def smoothstep(edge0, edge1, x):
    if edge0 == edge1:
        return 0.0 if x < edge0 else 1.0
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)


def process(path, out_path):
    img = Image.open(path).convert("RGBA")

    # Downscale for a lighter background asset.
    w, h = img.size
    scale = MAX_DIM / max(w, h)
    if scale < 1:
        img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    w, h = img.size

    px = img.load()
    cx, cy = w / 2.0, h / 2.0
    # Ellipse feather radii (normalized): fully opaque core, fading out toward
    # the corners so the whole thing reads as a soft blob, not a rectangle.
    inner = 0.60
    outer = 1.02

    for y in range(h):
        ny = (y - cy) / cy
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue

            whiteness = min(r, g, b) / 255.0
            blend = smoothstep(0.80, 0.97, whiteness)

            nr = r + (CREAM_TARGET[0] - r) * blend
            ng = g + (CREAM_TARGET[1] - g) * blend
            nb = b + (CREAM_TARGET[2] - b) * blend

            nx = (x - cx) / cx
            dist = math.sqrt(nx * nx + ny * ny)
            edge_alpha = 1.0 - smoothstep(inner, outer, dist)

            bg_alpha_reduction = blend * 0.55
            new_a = a * edge_alpha * (1.0 - bg_alpha_reduction)

            px[x, y] = (round(nr), round(ng), round(nb), round(new_a))

    img.save(out_path, "PNG", optimize=True)
    print(f"{out_path}  {w}x{h}")


import os
for name, src in SOURCES.items():
    out = f"{OUT_DIR}\\{name}"
    if os.path.exists(out):
        print(f"skip (exists): {name}")
        continue
    if not os.path.exists(src):
        print(f"skip (missing src): {src}")
        continue
    process(src, out)

print("done")
