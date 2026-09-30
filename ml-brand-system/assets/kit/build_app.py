"""App icons, favicons, avatars and the link preview image. Writes SVG sources plus a render job list."""
import json, os
from geometry import *

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "logo", "app", "src")
os.makedirs(SRC, exist_ok=True)
FONT = os.path.join(HERE, "fonts", "Michroma.ttf")
SYM = "".join(f'<path d="{p}"/>' for p in symbol_paths())


def square(size, sym_w, bg=None, fg=SIGNAL, radius=0, dy=0):
    s = sym_w / SYMBOL_W
    x = (size - sym_w) / 2
    y = (size - SYMBOL_H * s) / 2 + dy
    rect = f'<rect width="{size}" height="{size}" rx="{radius}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
            f'{rect}<g fill="{fg}" transform="translate({x:.2f} {y:.2f}) scale({s:.5f})">{SYM}</g></svg>\n')


files = {
    # browser tab: symbol only, transparent, edge to edge
    "favicon.svg": square(344, 344),
    # iOS rounds the corners itself, so this is full bleed Carbon
    "apple-touch-icon.svg": square(180, 180 * 0.64, CARBON),
    "android-chrome.svg": square(512, 512 * 0.64, CARBON),
    # maskable: keep the symbol inside the central 80% safe zone
    "maskable.svg": square(512, 512 * 0.52, CARBON),
    # social avatars: the circle crop keeps the symbol clear
    "avatar-carbon.svg": square(1000, 1000 * 0.56, CARBON, dy=6),
    "avatar-signal.svg": square(1000, 1000 * 0.56, SIGNAL, CHALK, dy=6),
    "avatar-chalk.svg": square(1000, 1000 * 0.56, CHALK, dy=6),
}

# link preview (Open Graph) 1200 x 630: stacked lockup and tagline on Carbon
em = 300 / 7.4
d_name, ww, cap = wordmark("MAXIMUM LEVERAGE", FONT, em * 0.75)
d_tag, tw, tcap = wordmark("LESS EFFORT. MORE SCALE.", FONT, 15, tracking_em=0.42)
sw = 300; s = sw / SYMBOL_W; sh = SYMBOL_H * s
gap = em * 0.95
block = sh + gap + cap + 56 + tcap
y0 = (630 - block) / 2
og = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">'
      f'<rect width="1200" height="630" fill="{CARBON}"/>'
      f'<g fill="{SIGNAL}" transform="translate({(1200 - sw) / 2:.2f} {y0:.2f}) scale({s:.5f})">{SYM}</g>'
      f'<path fill="{SIGNAL}" transform="translate({(1200 - ww) / 2:.2f} {y0 + sh + gap:.2f})" d="{d_name}"/>'
      f'<path fill="{CHALK}" transform="translate({(1200 - tw) / 2:.2f} {y0 + sh + gap + cap + 56:.2f})" d="{d_tag}"/>'
      f'</svg>\n')
files["og-image.svg"] = og

for name, body in files.items():
    open(os.path.join(SRC, name), "w").write(body)

# PNG exports: (source, output, width, height)
jobs = [
    ("favicon.svg", "favicon-16.png", 16, 16), ("favicon.svg", "favicon-32.png", 32, 32), ("favicon.svg", "favicon-48.png", 48, 48),
    ("apple-touch-icon.svg", "apple-touch-icon.png", 180, 180),
    ("android-chrome.svg", "android-chrome-192.png", 192, 192), ("android-chrome.svg", "android-chrome-512.png", 512, 512),
    ("maskable.svg", "maskable-512.png", 512, 512),
    ("avatar-carbon.svg", "avatar-carbon-1000.png", 1000, 1000), ("avatar-signal.svg", "avatar-signal-1000.png", 1000, 1000),
    ("avatar-chalk.svg", "avatar-chalk-1000.png", 1000, 1000),
    ("og-image.svg", "og-image-1200x630.png", 1200, 630),
]
json.dump([{"src": os.path.relpath(os.path.join(SRC, a), HERE), "out": os.path.relpath(os.path.join(HERE, "logo", "app", b), HERE), "w": w, "h": h, "type": "png"} for a, b, w, h in jobs],
          open(os.path.join(HERE, "logo", "app", "jobs.json"), "w"), indent=1)

manifest = {
    "name": "Maximum Leverage", "short_name": "Leverage",
    "icons": [
        {"src": "/android-chrome-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "/android-chrome-512.png", "sizes": "512x512", "type": "image/png"},
        {"src": "/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ],
    "theme_color": CARBON, "background_color": CARBON, "display": "standalone",
}
json.dump(manifest, open(os.path.join(HERE, "logo", "app", "site.webmanifest"), "w"), indent=1)
print(len(files), "app sources,", len(jobs), "PNG jobs")
