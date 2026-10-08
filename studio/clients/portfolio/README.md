# portfolio

Brand rules for Filip's own portfolio site (repo mravicfilip-tech/filip-portfolio). Facts here come
from `src/styles/base.css`, `src/data/content.js` and the taste log in this folder.

## Brand

Palette, from the tokens in `src/styles/base.css`.

| Token | Light | Dark | Job |
|---|---|---|---|
| bg | `#f4f2ee` | `#090909` | Page ground, with the site's 60 px dot grid |
| surface | `#ffffff` | `#1c1a18` | Raised panels and sheets |
| ink | `#14120f` | `#f2efe9` | Headlines and body text |
| ink-soft | `#55524c` | `#a39e94` | Secondary text |
| line | `#d8d4cc` | `#34312c` | Rules and borders |
| accent | `#ff4213` | `#ff4213` | The orange stop, the M.'s full stop, the hero rim light |
| accent-text | `#b8330c` | `#ff4213` | Accent used as text, so it passes contrast on paper |

Type. Anton for every headline (uppercase, tight, `--font-head`), Geist Variable for everything
else. Hollow headline words carry the left to right outline fade, app wide (taste log).

Logo. The M. mark (`MARK_D` in `src/components/BrandLogo.jsx`) with its orange full stop.

Background. The horizon glow, `src/atmo/variants/08-horizon-glow.js`, dark theme only.

## Rules that never bend

- Dark mode stays dark. From Filip, recorded in this session's standing constraints.
- No hover movement on buttons. From Filip.
- The unapproved testimonial ("Jelena") never ships in a production build. Check `grep -rl Jelena dist`.
- Every rule in `taste.md` in this folder. Its entries are the rules.

## Accessibility

WCAG 2.2 AA. Text contrast 4.5 to 1, large text and UI parts 3 to 1. `prefers-reduced-motion`
freezes the intro, the plate moves and the dot field. Keyboard focus keeps the global accent ring.

## Reference

The public site, filip-portfolio-public.vercel.app, holds the content Filip treats as approved
(three projects, four logos). Its source was pulled through the Vercel API on 2026-10-07.

## Widths

1440, 390

## Run

- Code lives in `/home/user/filip-portfolio`, a separate repo, branch `claude/halftone-slice`.
- `npm ci`, then `npm run build`, then `npx vite preview --port 4173`. Base URL
  `http://localhost:4173`. `npx vite` serves dev on 5173.
- Routes to shoot `home=/,sectors=/#sectors,work=/#work-brp,toolkit=/#toolkit,contact=/#contact,case=/work/lyrie`.
  The home page is full screen plates on desktop and one scroll on phones.
- Motion switches. `?off=atmo,field,chroma,bust,accent` turns layers off. Headless browsers skip the intro.
- Previews are on Vercel, project `filip-portfolio`. Production deploys only with Filip's consent.
