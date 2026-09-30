# Maximum Leverage asset kit

Board: https://claude.ai/artifact/VK4EXaDuBYXqtFBAgRmCWc (`kit-board.html`). Everything is generated from `geometry.py`,
the single source of truth for the mark. `ml-asset-kit.zip` bundles the finished files.

## What's here
- `logo/svg` 20 SVGs: symbol (4 colours), stacked and horizontal lockups (6 colours each), wordmark (4 colours).
  Strokes are filled shapes and the name is outlined, so no fonts are needed.
- `logo/png` transparent PNGs, `logo/pdf` vector PDFs for print.
- `logo/app` favicon-16/32/48 and favicon.ico, apple-touch-icon, android-chrome-192/512, maskable-512,
  social avatars (Carbon, Signal, Chalk, 1000px), og-image-1200x630, site.webmanifest.
- `patterns/tiles` seamless tiles: momentum, hatch, steps, peaks, each in Carbon, Chalk, Signal.
  `patterns/panels` one-off graphics: rising dots and supergraphic (16:9, 4:5, 1:1), step band (1920x240, 1500x500, 600x120).
- `icons/svg` 12 service icons (24px grid, 2px round stroke, currentColor), `icons/ml-icons.svg` sprite.

## Colour versions
signal: on Carbon, Chalk or white · signal-chalk: on Carbon · signal-carbon: on Chalk or white ·
chalk: on Signal or photos · carbon: one-colour print · white: embroidery, foil, video.

## Rebuild
```
python3 build_logo.py && python3 build_app.py && python3 build_patterns.py && python3 build_icons.py
node render.cjs logo/jobs.json logo/app/jobs.json patterns/jobs.json   # needs Playwright + Chromium
```
Then rebuild favicon.ico from the 16/32/48 PNGs (see git history) and re-zip.

## Rules
Clear space: one bar width on every side (about 15% of the symbol width). Symbol minimum 16px wide; drop the name below 120px.
Patterns: one per layout, tonal by default, never behind the logo, tiles at 50% to 200% scale.
Type: Michroma for the name and tagline only, Host Grotesk for everything else. Never a mono font.
