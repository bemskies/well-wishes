from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "static" / "festive" / "images" / "social-card.png"
WIDTH, HEIGHT = 1200, 630


def font(size, serif=False):
    candidates = (
        [
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
            "/Library/Fonts/Georgia.ttf",
            "C:/Windows/Fonts/georgia.ttf",
        ]
        if serif
        else [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/Library/Fonts/Arial.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
    )
    for candidate in candidates:
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size=size)


def centered(draw, y, text, selected_font, fill, spacing=0):
    bounds = draw.textbbox((0, 0), text, font=selected_font, spacing=spacing)
    draw.text(((WIDTH - (bounds[2] - bounds[0])) / 2, y), text, font=selected_font, fill=fill, spacing=spacing)


def sparkle(draw, x, y, radius, fill):
    draw.polygon(
        [
            (x, y - radius),
            (x + radius * 0.2, y - radius * 0.2),
            (x + radius, y),
            (x + radius * 0.2, y + radius * 0.2),
            (x, y + radius),
            (x - radius * 0.2, y + radius * 0.2),
            (x - radius, y),
            (x - radius * 0.2, y - radius * 0.2),
        ],
        fill=fill,
    )


def main():
    image = Image.new("RGB", (WIDTH, HEIGHT), "#10382b")
    pixels = image.load()
    start = (9, 41, 31)
    end = (29, 82, 57)
    for y in range(HEIGHT):
        blend = y / HEIGHT
        color = tuple(round(start[i] * (1 - blend) + end[i] * blend) for i in range(3))
        for x in range(WIDTH):
            pixels[x, y] = color

    draw = ImageDraw.Draw(image)
    gold = "#dfc27e"
    draw.rounded_rectangle((24, 24, 1176, 606), radius=27, outline=gold, width=2)
    draw.rounded_rectangle((36, 36, 1164, 594), radius=21, outline="#a78b514f", width=1)
    for x in range(75, 1130, 23):
        draw.ellipse((x - 2, 91, x + 2, 95), fill="#a88d5b")
    for x, color, radius in [
        (95, "#f1d68e", 6),
        (221, "#e5bd68", 4),
        (985, "#f1d68e", 6),
        (1104, "#d5b567", 4),
    ]:
        draw.ellipse((x - radius, 91 - radius, x + radius, 91 + radius), fill=color)

    centered(draw, 182, "A LITTLE JOY TO SHARE", font(22), gold)
    centered(draw, 252, "Festive Well Wishes", font(68, serif=True), "#fffaf0")
    centered(draw, 346, "Make a wish. Share the wonder. Pass the joy along.", font(25), "#e8e7dc")
    centered(draw, 462, "Merry Christmas & Happy New Year", font(37, serif=True), gold)
    sparkle(draw, 178, 484, 10, gold)
    sparkle(draw, 1022, 484, 10, gold)
    image.save(OUTPUT, format="PNG", optimize=True)
    print(f"Generated {OUTPUT} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
