# Fonts

`NewBlack Typeface` — the display face from the Figma design. Five static
weights, converted from the supplied TTFs to woff2 with fontTools:

| file                              | weight | notes                          |
|-----------------------------------|--------|--------------------------------|
| NewBlackTypeface-UltraLight.woff2 | 200    |                                |
| NewBlackTypeface-Regular.woff2    | 400 500| also answers 500 — see below   |
| NewBlackTypeface-SemiBold.woff2   | 600    |                                |
| NewBlackTypeface-Bold.woff2       | 700    |                                |
| NewBlackTypeface-ExtraBold.woff2  | 800    |                                |

The design sets `font-weight: 500` everywhere it uses `--fh-display`, but the
family ships no Medium. The Regular face is declared over the range `400 500`
so a request for 500 resolves to it rather than being synthesised or falling
through to Onest. Swap that range onto SemiBold in
`src/components/FigmaHero/FigmaHero.css` if the headlines should sit heavier.

The `@font-face` rules live in that same file and are global, so every section
and the dashboard pick them up.

To add a weight later: `pip install fonttools brotli`, then
`python -c "from fontTools.ttLib import TTFont; f=TTFont('in.ttf'); f.flavor='woff2'; f.save('public/fonts/out.woff2')"`
