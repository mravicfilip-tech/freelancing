# The service and company pages, round 3 notes

Filip, 19 November, after commit e25f7ab. Each note as he sent it, then what it points at.

1. "repeatable section which is really bad rework it". His screenshot shows Delovi, the black call band "Uz servis" and the black close
   band "Ponuda za delove" stacked one on the other, the same Band (Pages.tsx, .pg-cta) twice. Every page carries that band twice, mid
   page and at the close.
2. "work on these cards more". His screenshot marks the four term cards 36, 48, 60 and 72 meseci in the Najam hero's rental card
   (.pg-month in Pages.tsx RentCard).

## Filip's go, and what was built

- Note 1. One black band per page, mid page. The close is QuickAsk.tsx, a short inquiry on white with the page's topic set, the fields
  the form's server needs, the message filled in and the page's number large beside it. Built, on the branch.
- Note 2. Four versions of the term picker on one board, n2-term-cards-board.png beside this file. Filip, "go with 3", the stepper. The
  other three and the ?kartice switch are gone, the stepper is in the kit as term-stepper (taste 2026-11-19 14:32).
