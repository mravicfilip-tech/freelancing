# Round 3 notes, Ovallo clean up

Source. Filip's video of 2026-10-15, 2 minutes 30 seconds, transcribed. Each note carries the second it
was said and what was on screen, read from the direction switcher and the cursor in that frame.

| # | At | On screen | Filip's words | What it means |
|---|---|---|---|---|
| 1 | 0m07 to 0m35 | D hero, then plans, back to the hero's bottom edge | "this section, this is fine, but if we can somehow make this go towards here, the bottom, it would be dope" | The hero stays. Its dashboard sinks to the hero's bottom edge and crosses into the plans section, as on rho.co |
| 2 | 0m35 | D bento, B's photos | "This section, I don't want, I told you not to do this" | The photo bento goes. Round 2 note 3 was misread, see below |
| 3 | 0m42 to 0m53 | D add funds, partners, rewards, then Why Choose | "This section is fine" ... "but I don't want, like, why choose a little like this" | Add funds stays. D's Why Choose is rejected |
| 4 | 1m03 to 1m20 | The line graphics in the footer, Why Choose and plans | "we're repeating the same type of lines" ... "it needs to be a more mix and match" | Each place gets a different kind of line |
| 5 | 1m20 to 1m44 | D bento, then A's bento, back and forth | "we need to bring back this section here instead of this section" | The Ovallo6 bento comes back, as A shows it |
| 6 | 1m45 to 2m28 | A's rewards, then D's, then A's again | "get this section back instead of here, but why choose a little content needs to be in this section here somehow, so this section needs to be restructured and executed better" | The Ovallo6 rewards come back, and the Why Choose content moves into that section |

## Round 2 correction

Round 2 note 3, "for the second section, we can keep this as it is", was read as B's photo bento
because B was on screen. Filip meant the bento as it already was in Ovallo6. Lesson for later rounds.
"Keep this as it is" means the version already live, not the version on screen.

## Built, fork commit `13e883c`

- Hero. Ovallo6's, with the dashboard sunk 80 to 128px past the hero's bottom edge on desktop. The plans
  section gets the same amount of extra top space. Phone unchanged.
- Bento. The Ovallo6 bento inside A's root, so it carries A's label and one tone heading and no caret.
- Rewards. The Ovallo6 showcase, with Why Choose as the closing band of the same panel. The heading and
  intro sit on the left, and the six reasons sit in a 3 by 2 grid on hairlines. The standalone Why Choose
  is gone.
- Lines. The Ovallo6 mark outline in the hero, the Ovallo6 drawings in the bento, globe meridians under
  the plan terms, and horizon arcs behind the footer call to action. No graphic repeats.
- Unchanged from round 2. Plans type, add funds, partners, quote, FAQ, footer.
