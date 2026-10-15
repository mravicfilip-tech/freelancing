# Round 7 notes, Ovallo hero variants, second set

Source. Filip's video "Design_Feedback_on_UI_and_Backgrounds.mp4", 2026-10-15. Task ovallo-5. Baseline is fork
commit `3c6a69c`, the round 6 set. Filip watched at about 1920 wide, so the board is shot at 1920 as well as 1440.

| # | Time | Filip's words | What it means |
|---|---|---|---|
| 1 | 0m08s | "Like this is just ridiculous." | The round 6 set missed |
| 2 | 0m10s | "this first version here, it's semi-OK-ish... made the tablet or the screen bigger so it fits here" | Variant 1 survives, with a bigger screen. At 1920 the 1120px screen looked small |
| 3 | 0m25s | "some background gradient where this moves in transitions from here to here" | The hard ink to paper cut becomes a gradient |
| 4 | 0m53s to 2m32s | "modern gradient background", "black to white", "a bit more serious... makes this brand look expensive", "five examples for the background only" | Five backgrounds, mostly monochrome, from his two Pinterest boards |
| 5 | 2m48s | "I don't want any variant to be just fully white. Like this is not happening." | Variant 2 Paper is out, white only as the end of a fade |
| 6 | 2m54s | "maybe this construction here looks good" | Variant 2's layout, copy left and screen right, stays |
| 7 | 3m11s | "I need always this screen to be present, no matter the variant." | The dashboard is in every variant |
| 8 | 3m14s to 3m21s | "this screen here to be in the mockup... and then we have a background here" | Variant 3's white panel gets a background and the screen |
| 9 | 3m25s to 3m28s | "we can do a background interesting here... I still need this screen fitted here" | Variant 4 gets a background and the screen in its empty middle |
| 10 | 3m35s | "never do a background that's full with people here like this" | Variant 5 Photograph is out, no people photos |
| 11 | 3m44s | "five new variants with this feedback in mind" | A second set of five |

## Round 6 correction

My round 6 recommendation was variant 2, the white hero. Filip ruled out fully white heroes. The kept part of it is
the layout, which variant 2 of this set reuses on a dark gradient.

## Built, fork commit in tasks.md

Same switcher and `?hero=1..5`, no param keeps the current hero. Code in `src/dir/d/hero/`. Copy is verbatim. Every
background is built from brand tokens, with a paper coloured grain at 6%.

1. Fade. Centred copy, the dashboard up to 1440 wide, ink fading into paper behind it, which runs on into the plans.
2. Split. Copy left on ink, the dashboard right and cropped, a diagonal from ink to light grey with a soft haze.
   On a phone the light gathers below the copy, so it never sits behind the text.
3. Two tone. Ink half with the copy. The other half is a fluted glass gradient, dark at the top and light at the
   bottom, with the dashboard set into it.
4. Term sheet. The headline across, the plan facts as a list on the left, the dashboard beside them, light rising
   from below behind the screen.
5. Pair. Centred copy, the dashboard with the phone view in front of its right corner, on the brand board gradient
   Coco approved on 2026-10-08 (slate top left, ink, lilac bottom right). The phone copy is inert and hidden from
   screen readers, since it repeats the dashboard.

## Checks

- Text contrast against the pixels behind it, worst case, 5.68 to 1 for the muted headline line of variant 5 at 390.
  Every other line is 5.87 to 1 or more, at 1920, 1440 and 390.
- All five settle with motion on, no page errors. The board shots pass the nav paint check at all three widths.
- baselint, nine warnings kept. Hero tops of 128 to 176px clear the fixed nav, the -256px margin centres the screen
  in variant 3, the 96px room holds the phone in variant 5, and one z-index of -1 sits inside the isolated hero.

## Recommendation

Variant 2. It is the layout Filip said looks good, now dark, with the screen at full size and the diagonal from black
to light that his black to white search was after. Variant 1 second, the one he called semi-OK, now with the bigger
screen and the fade he described. Variant 5 is the closest to another, it shares variant 1's composition and differs
in the brand colour background and the phone.
