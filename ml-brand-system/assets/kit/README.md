# Maximum Leverage asset kit

Board: https://claude.ai/artifact/VK4EXaDuBYXqtFBAgRmCWc (`kit-board.html`). Everything is generated from `geometry.py`,
the single source of truth for the mark. `ml-asset-kit.zip` bundles the finished files.

## What's here
- `logo/svg` 20 SVGs: symbol (4 colours), stacked and horizontal lockups (6 colours each), wordmark (4 colours).
  Strokes are filled shapes and the name is outlined, so no fonts are needed.
- `logo/png` transparent PNGs, `logo/pdf` vector PDFs for print.
- `logo/app` favicon-16/32/48 and favicon.ico, apple-touch-icon, android-chrome-192/512, maskable-512,
  social avatars (Carbon, Signal, Chalk, 1000px), og-image-1200x630, site.webmanifest.
- Patterns v3, redrawn as vectors from the Weave concepts the client picked (p01, p02, p08). v1 and v2 were retired as generic.
  - Summit: contour lines climbing to the mark, which sits at the peak as a Signal outline.
  - Ripple: stripes at 60 degrees, bent and bunched where a hidden lever pushes.
  - Slabs: a field cut along the bar and lever angles in 2 : 3 : 4 widths, a few slabs pushed out of line.
  - Tally (research round, concept I09): a count in the mark's strokes. 3 bars + lever = 4 calls; Signal strokes are calls
    won back, on a 60 degree run. Set `TALLY_DATA` in build_patterns.py to the client's real numbers.
  `patterns/{summit,ripple,slabs,tally}-{carbon,chalk,signal}-{16x9,4x5,1x1,band}.svg` plus PNGs (band is 1920 x 480).
- `templates/` social templates (concepts I06 and I09), type outlined:
  - `lever-post-template-{4x5,1x1,9x16}.svg` photo window cut at 60 degrees with a Signal bar beside it; replace the
    grey `id="photo"` slot with a real owner at work. `lever-post-example-*` use the AI concept photo as a stand-in.
  - `tally-poster-{4x5,9x16}.svg` Tally field plus the result in Host Grotesk.
- `icons/` 24 service icons (24px grid, 1.5px round stroke, currentColor): 12 core services plus 12 for the wider
  growth stack (website, local search, texts, email, quotes, payments, pipeline, referrals, reminders, social, growth, storefront).
  `icons/svg` static, `icons/animated` self-contained animated SVGs (3s loop, CSS inside, respects reduced motion),
  `icons/ml-icons.svg` static sprite, `icons/ml-icons-motion.css` + `icons/icons.json` for animated inline SVG on the web.

## Colour versions
signal: on Carbon, Chalk or white · signal-chalk: on Carbon · signal-carbon: on Chalk or white ·
chalk: on Signal or photos · carbon: one-colour print · white: embroidery, foil, video.

## Rebuild
```
python3 build_logo.py && python3 build_app.py && python3 build_patterns.py && python3 build_templates.py && python3 build_icons.py
node render.cjs logo/jobs.json logo/app/jobs.json patterns/jobs.json templates/jobs.json   # needs Playwright + Chromium
```
Then rebuild favicon.ico from the 16/32/48 PNGs (see git history) and re-zip.

## Rules
Clear space: one bar width on every side (about 15% of the symbol width). Symbol minimum 16px wide; drop the name below 120px.
Patterns: one per layout, full-bleed, never behind the logo; leave the empty side for the message; Chalk for print, Carbon for screens, Signal for social.
Type: Michroma for the name and tagline only, Host Grotesk for everything else. Never a mono font.
