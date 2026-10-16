# Tasks, milan-peulic

Claude keeps this file current as a side effect of normal work and never asks first. A task is one
thing Filip would say out loud in a status call, titled the way he would say it. Keys run
`milan-peulic-1`, `milan-peulic-2` and so on, one higher than the highest key in this file.

Rules
- New work goes under Backlog, or under In progress when it starts at once.
- When the state changes, cut the whole task block and paste it under the new heading.
- Steps are the checklist under a task. Add them as the shape of the work becomes clear and tick
  each one the moment the conversation shows it done. Ticking a step never moves the task.
- Steps are for this file only. They never appear in anything sent to a client, a status note, an
  invoice line or a summary. Those read at task level.
- Put the preview URL, the ticket number or the design link in the task line.

Task format

```
- milan-peulic-1 Pricing page prototype. Link https://example.com/preview
  - [x] Capture the reference
  - [ ] Build the page
```

## Backlog

## In progress

## Review

- milan-peulic-1 Rebrand the Diversify portfolio as Milan Peulic, in first person. File
  milan-peulic-portfolio/Portfolio_Milan_Peulic_2026.pdf, commit 2eac116
  - [x] Swap the Diversify name on the cover, page 2, 20 headers and 24 footers
  - [x] Remove the Diversify mark, the 4 watermarks and the letsdiversify.com pill
  - [x] Change we to I on pages 2, 8, 10, 13, 15, 16, 17 and 19
  - [x] Clean the quote baked into the page 19 photo
  - [x] Pixel diff against the source, changes only where planned
  - [x] Strip the hidden Diversify contact page the source kept behind bookmark 26
  - [ ] Filip's call on the MP monogram, the kept tagline and the empty pill spot
  - [ ] Milan's URL or email for the header pill
- milan-peulic-2 Rebrand the Diversify iGaming portfolio as Milan Peulic, in first person. File
  milan-peulic-portfolio/Portfolio_iGaming_Milan_Peulic_2026.pdf, commit 2eac116
  - [x] Swap the Diversify name on the cover, page 2, the closing page, 11 headers and 17 footers
  - [x] Remove the Diversify mark, the 2 watermarks and the letsdiversify.com pill
  - [x] Remove Diversify's email, LinkedIn and website from the closing page, links included
  - [x] Change we to I on pages 2, 3, 5, 11 and 13, the page 5 paragraph on outlines only
  - [x] Rewrite the tagged ActualText so copy and search read the new words
  - [x] Pixel diff against the source and a full file scan, no Diversify left
  - [ ] Milan's email, LinkedIn and website for the closing page
- milan-peulic-3 Compress both portfolio decks without losing quality. General 12.4 MB to 10.2 MB,
  iGaming 8.5 MB to 4.9 MB, commit 2eac116
  - [x] Round outline coordinates to 0.005pt, keep transforms and text positions exact
  - [x] Drop the 16 near opaque iGaming alpha masks
  - [x] Rewrite JPEG tables losslessly, pixels checked identical
  - [x] Render diff at 2x, text, tags, bookmarks and the Diversify scan all checked

## Done
