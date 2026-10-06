# Taste log, portfolio

Filip's own portfolio site (repo mravicfilip-tech/filip-portfolio). Newest entry at the top.
`/taste` writes here the turn Filip picks or rejects a look. The `/uireview` critic and every
builder read this whole file before judging or building, so each entry is a rule. Entries marked
SUPERSEDED are not rules and move to `taste-archive.md` once this file passes 8,000 characters.

Entry format.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

- **2026-10-06 11:43, project cover browser frame (ShotFrame `.proj__shot`), shown before the dots arrive.** REJECTED. Said: "I don't like the fact the browser is already preloaded". Why: the window chrome sits finished on the plate while the halftone is still flying in, so the frame gives away the reveal before it happens (inferred). Carry forward: on a project plate the ShotFrame window (bar, border, address pill) must arrive as part of the field's transition, never be on screen before the cover's dots land.
- **2026-10-06 11:43, cover hand-off from halftone to image, variant pick.** ACCEPTED. Said: "reveal 1 best". Why: a single diagonal front reads as the cover being printed through; the dots leave exactly where the image arrives, so nothing stacks into a grey wash. Losers: 2 bloom (a circle opening from the centre), 3 dissolve (dots drop at random while the image un-blurs). Carry forward: covers resolve with the sweep in `src/lib/coverReveal.js` (135deg, band 0.35, 1.1s, linear); dots and image always share one reveal key, and the halftone stays at alpha 0.1 + 0.46·v.
