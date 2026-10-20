# Brief, the landing page redo, lusty-lagoon-5

Filip, 2026-10-20. "Redoing the landing page, should be mobile first, focus on mobile." Run in its own
session, per the doctrine's one session per round.

## Where it starts

- Today's landing page is `/` (`src/features/landing`), the Figma 1 to 1 build of the Landing page
  frame in the Pro team copy (`README.md`, Reference). The Figma also has its mobile frame at 440.
- The product's look is picked, variant 1, Neon arcade (`src/features/variants/v1`, taste entry of
  2026-10-20 11:24). The landing page sits in front of it, so a visitor who signs up lands somewhere
  that feels the same, sharing type, keys, the sheen hover, the icon style and the brand art.
- Mobile carries most casino traffic (taste entry of 2026-10-20 11:24, mobile first). Design and build
  at 375 and 425 first, then hold the page at 1440, 1920 and 2560.
- Brand rules in `README.md` and every rule in `taste.md` apply, the art recipe in
  `briefs/round-7/art-recipe.md` above all, since every round so far rejected art that reads pasted on.

## Gate

The landing page is a redesign, so `/newui` runs, references first and one argued direction, and it
stops for Filip's pick twice. If the job is judged by how it moves as you scroll, `/story` runs instead,
per the doctrine. The kickoff gate in `CLAUDE.md` runs once first. Proposed defaults. Scope, the whole
landing page, free to change layout and sections. Reference, the Figma Landing page frames for content,
variant 1 for the look, three to five live casino landing pages for mobile patterns. Baseline, the
pushed commit this session starts from. Output, the prototype in this repo, reviewed on Filip's
localhost while Vercel previews stay on hold. Done, `/uireview` shows no open sev 1 at all five widths.
