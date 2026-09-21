# Galano Grotesque — licensed webfonts go here

This directory is intentionally empty of font binaries. The eight files the
site's `@font-face` rules in `src/styles/fonts.css` point at are commercial
webfonts from The Northern Block and have to come from the client's licence.
They are not on Google Fonts, not on npm, and must not be sourced from a font
mirror.

Drop them in here under exactly these names:

    GalanoGrotesque-ExtraLight.woff2   GalanoGrotesque-ExtraLight.woff   (200)
    GalanoGrotesque-Regular.woff2      GalanoGrotesque-Regular.woff      (400)
    GalanoGrotesque-Medium.woff2       GalanoGrotesque-Medium.woff       (500)
    GalanoGrotesque-SemiBold.woff2     GalanoGrotesque-SemiBold.woff     (600)

Nothing else needs to change: the rules already reference these paths and Vite
picks them up on the next build. Until then the page renders on the fallback
stack documented on `--font-label` in `src/styles/tokens.css`.
