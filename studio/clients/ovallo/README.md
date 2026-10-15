# ovallo

The code lives in Milos's repo, worked through Filip's fork. Brand and taste have one source,
the fork's `docs/studio/` files, written in Serbian. Read them there and never copy them here, so
the two never drift. Filip ruled this on 2026-10-15.

- Source repo https://github.com/tankosic2324-design/ovallo-landing
- Fork https://github.com/mravicfilip-tech/ovallo-landing, cloned at `/home/user/ovallo-landing`
- Brand file `docs/studio/brend.md`, taste log `docs/studio/ukus.md`, in the fork

## Brand

Read section Brend in `docs/studio/brend.md`. Tokens in code are in `src/styles/tokens.css`. The
fonts in that file are older than Ovallo6. The README of the fork names the current ones.

## Rules that never bend

Read section Pravila koja se ne menjaju in `docs/studio/brend.md`.

## Accessibility

Read section Pristupačnost in `docs/studio/brend.md`. The bar is WCAG 2.2 AA.

## Reference

Baseline is Ovallo6 at https://ovallo6.vercel.app, commit `7a18b5b` on the fork's main. Filip named
it on 2026-10-15. Read section Referenca in `docs/studio/brend.md` for the Figma boards.

## Widths

390 and 1440, from section Širine in `docs/studio/brend.md`.

## Run

Folder `/home/user/ovallo-landing`, branch `claude/<session>` on the fork. `npm ci`, then
`npm run dev` on http://localhost:5173, and `npm run build` before a commit Filip reviews.
Changes reach Milos as a pull request from the fork.
