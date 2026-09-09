# Fonts

`NewBlack Typeface` is the display face in the Figma design. It is a licensed
retail font, so it is not committed here and not on npm.

Drop the file in as:

    public/fonts/NewBlackTypeface-Medium.woff2

The `@font-face` in `src/components/FigmaHero/FigmaHero.css` already points at
that exact path, and `--fh-display` / `--d-display` fall back to Onest Variable
until it lands, so the site renders correctly either way.

Only a `.woff2` is needed. Given a `.otf` or `.ttf`, convert with:

    pip install fonttools brotli
    python -c "from fontTools.ttLib import TTFont; f=TTFont('in.otf'); f.flavor='woff2'; f.save('public/fonts/NewBlackTypeface-Medium.woff2')"
