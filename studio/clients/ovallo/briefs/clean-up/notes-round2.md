# Round 2 notes, Ovallo clean up

Source. Filip's video of 2026-10-15, 3 minutes 15 seconds, transcribed. Each note carries the second
it was said and the direction on screen, read from the direction switcher in that frame.

| # | At | On screen | Filip's words | What it means |
|---|---|---|---|---|
| 1 | 0m20 | Ovallo6 hero | "I really like this hero, I think the hero should be kept the same." | The hero stays Ovallo6's, unchanged |
| 2 | 0m28 to 1m03 | B plans | "I like this version better, where it's on light mode, but we need to play more a bit with the fonts" ... "this is the biggest font" ... "mostly three different types of sizing of fonts on this section" | Plans from B. The title is the largest type in the section, all else smaller, three sizes at most |
| 3 | 1m07 | B bento, with photos | "for the second section, we can keep this as it is" | Misread. Filip meant the Ovallo6 bento, see notes-round3.md |
| 4 | 1m29 to 1m40 | C add funds | "I like this section most, but this title needs to be aligned with here, and then you need to fix up the spacing" | Add funds from C. The title's top lines up with the paragraph on the right. Spacing tidied |
| 5 | 1m40 to 1m51 | C add funds, the Debit and Visa chips, then the network chips | "For the visa debit cards here, let's do icons please, same here too, so text plus icon" | Every chip in that section gets an icon beside its text |
| 6 | 1m49 to 2m03 | C rewards | "Then I really like this section here" | Rewards from C |
| 7 | 2m04 to 2m09 | C testimonials | "I really like this version best for the testimonials" | Quote from C |
| 8 | 2m15 to 2m39 | C footer, then B footer | "this type of footer too, right? As well" ... "this is something that we can do for the footer" | Footer from B, since B was on screen when both lines were said |
| 9 | 2m35 to 3m06 | Srdjan's Slack thread, the ovallo4 Why Choose shot | "we have to have these lines that were initially there on this feedback" ... "something going on in the background, some lines" | Thin background lines return, the ellipses from the mark as on ovallo4, without the planet and its cards |

## Defaults for what the video does not name

Each is a one line swap in `src/dir/d/HomeD.tsx`.

1. Why Choose. C's indexed table, with the ovallo4 line drawing above the title, per note 9.
2. FAQ. C's.
3. Partners. Stays inside C's add funds section, where C put it.
4. Nav. Ovallo6's, it comes with the hero.

## Plan

- A new combined page, D, at `?dir=d`, with "D Combined" in the switcher. Ovallo6, A, B and C stay
  exactly as they are.
- Copied and changed in `src/dir/d/` only. Plans from B, add funds from C, Why Choose from C, the B
  footer, and one line drawing component. Every other section is imported unchanged.
- Background lines, 1px, static and faint, in Plans, Why Choose and the footer CTA.
- Checks. Build, shots at 1440 and 390, the Ovallo6 pixel compare, baselint.

Versions touched. Only the fork branch. Ovallo6, A, B and C do not change.
