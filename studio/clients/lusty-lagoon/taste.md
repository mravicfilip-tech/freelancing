# Taste log, lusty-lagoon

Newest entry at the top. `/taste` writes here the turn Filip picks or rejects a look. The
`/uireview` critic and every builder read this whole file before judging or building, so each
entry is a rule. Entries marked SUPERSEDED are not rules and move to `taste-archive.md` once this
file passes 8,000 characters.

Entry format.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

- **2026-10-19 11:59, Glossy gold pill buttons (Register account, Figma 339:445, same style on Play now and Claim bonus), rejected.** REJECTED. Said: "buttoni su isto previse fun ... ne daju utisak usabilitija ... kad se skalira" (forwarded review, Filip endorsed). Why: the sunburst, gloss highlight and bevel make each button a one-off promo graphic, not a control that carries through the product. Carry forward: buttons have no sunburst, gloss highlight, bevel or outer glow, and one button component serves both the landing page and the product.
- **2026-10-19 11:57, Feature tiles in Why choose Lusty Lagoon (Figma 339:936) and the FAQ rows (339:1360), rejected.** REJECTED. Said: "ovi delovi izgledaju dost genericki sa ovim ikonicama i ponavljanjem tog gradijenta u svakom boksu" (forwarded review, Filip endorsed, FAQ added at 11:58). Why: a stock 3D icon set and the same purple gradient box repeated six times read as a template. Carry forward: no stock 3D icon set on feature tiles, and repeated tiles or rows never each carry their own gradient fill.
- **2026-10-19 11:56, Rank progress card (Figma 339:1655), rejected.** REJECTED. Said: "ovde su isto prejaki efekti i 3d progres bara i senke koju baca i gradijent" (forwarded review, Filip endorsed). Why: the bevelled bar, its cast shadow and the gradient track outshine the number they report. Carry forward: a progress bar is a flat fill on a flat track, with no bevel, cast shadow, glow or track gradient.
- **2026-10-19 11:55, Text glow and 3D wallet tabs (Tabs, Figma 475:397), rejected.** REJECTED. Said: "sav tekst ima glow sto je mozda malo previse ... tabovi nemaju potrebu za tom unutrasnjom senkom" (forwarded review, Filip endorsed). Why: a glow on every label softens the type, and the inset shadow fakes a depth tabs do not need. Carry forward: no text-shadow or glow on UI text, and tabs carry no inset shadow.
- **2026-10-19 11:54, Strong gradients on cards and surfaces, payment method picker (Figma 473:62), rejected.** REJECTED. Said: "ovi gradijenti ovde su prejaki previse forsirani, to bih smanjio skoro svuda" (forwarded review, Filip endorsed). Why: the gradients feel forced, and on the picker they hide state, so the reviewer could not tell whether Visa was selected or just brighter. Carry forward: on every screen, surfaces are flat or carry one low contrast gradient at most, and a selected state never relies on a gradient difference.
