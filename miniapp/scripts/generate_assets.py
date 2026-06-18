"""Generate tab bar icons and default avatar for WeChat mini program."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 81
OUT = Path(__file__).resolve().parent.parent / "assets"
TAB = OUT / "tab"

GRAY = (102, 102, 102, 255)
ORANGE = (232, 93, 4, 255)
LIGHT_ORANGE = (255, 247, 237, 255)
WHITE = (255, 255, 255, 255)


def blank() -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def stroke(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int], width: int = 4) -> None:
    draw.stroke_width = width


def draw_home(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    stroke(draw, color)
    draw.polygon([(40, 18), (16, 38), (22, 38), (22, 62), (58, 62), (58, 38), (64, 38)], outline=color)
    draw.rectangle([34, 44, 46, 62], outline=color)


def draw_leaderboard(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    stroke(draw, color, 3)
    draw.rectangle([14, 36, 28, 62], outline=color)
    draw.rectangle([34, 24, 48, 62], outline=color)
    draw.rectangle([54, 44, 68, 62], outline=color)
    draw.line([(14, 62), (68, 62)], fill=color, width=3)


def draw_community(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    stroke(draw, color)
    draw.rounded_rectangle([12, 20, 52, 48], radius=10, outline=color)
    draw.polygon([(36, 48), (44, 58), (44, 48)], outline=color)
    draw.rounded_rectangle([32, 32, 70, 56], radius=10, outline=color)


def draw_user(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int]) -> None:
    stroke(draw, color)
    draw.ellipse([28, 14, 54, 40], outline=color)
    draw.arc([18, 34, 64, 70], start=200, end=-20, fill=color, width=4)


def render_icon(draw_fn, color: tuple[int, int, int, int]) -> Image.Image:
    img = blank()
    draw = ImageDraw.Draw(img)
    draw_fn(draw, color)
    return img


def save_tab_icons() -> None:
    TAB.mkdir(parents=True, exist_ok=True)
    icons = [
        ("home", draw_home),
        ("leaderboard", draw_leaderboard),
        ("community", draw_community),
        ("user", draw_user),
    ]
    for name, fn in icons:
        render_icon(fn, GRAY).save(TAB / f"{name}.png")
        render_icon(fn, ORANGE).save(TAB / f"{name}-active.png")


def save_default_avatar() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", (128, 128), LIGHT_ORANGE)
    draw = ImageDraw.Draw(img)
    draw.ellipse([32, 24, 96, 88], fill=ORANGE)
    draw.ellipse([48, 36, 80, 68], fill=WHITE)
    draw.polygon([(32, 96), (96, 96), (96, 78), (64, 62), (32, 78)], fill=ORANGE)
    img.save(OUT / "default-avatar.png")


def save_map_marker() -> None:
    map_dir = OUT / "map"
    map_dir.mkdir(parents=True, exist_ok=True)
    w, h = 48, 64
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([10, 4, 38, 32], fill=ORANGE)
    draw.ellipse([18, 12, 30, 24], fill=WHITE)
    draw.polygon([(24, 30), (14, 58), (34, 58)], fill=ORANGE)
    img.save(map_dir / "marker.png")


def save_logo_mark() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([8, 8, 120, 120], fill=ORANGE)
    draw.polygon([(64, 28), (36, 52), (44, 52), (44, 88), (84, 88), (84, 52), (92, 52)], fill=WHITE)
    draw.rectangle([54, 62, 74, 88], fill=ORANGE)
    img.save(OUT / "logo-mark.png")


if __name__ == "__main__":
    save_tab_icons()
    save_default_avatar()
    save_map_marker()
    save_logo_mark()
    print(f"Assets written to {OUT}")
