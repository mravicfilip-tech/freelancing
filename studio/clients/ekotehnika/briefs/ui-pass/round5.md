# Round 5 plan, Filip's notes after the round 4 merge

Seven notes from `notes-r5-live.md`, planned in one pass on 13 October. Every note touches version 5 Sistem only, the one live version after note 4. Baseline is b9db9c0 on `claude/awesome-faraday-lkhnn2`, which holds the merged round 4 (b484763) plus the L fork fix. Vercel previews are on hold, so each change is shown on Filip's localhost by its commit.

Deadline. Filip named none.

Answers. Filip replied "go" on 13 October, which approves every default. Q1 yes, the S pane hairlines halve with the grid. Q3 delete the version 2 and 4 code. Q2 came back on 13 October as a relay from the planning chat, "keep the layout, only change the timing". It waits on Filip's own confirmation in the round 5 chat before item 3 builds. In anything written to Filip, beats go by their screen names, Najam, Servis, Prodaja, Automatizacija, not by letter.

## Items

1. **L fork move.** Built as dd39bd7. The top row draws over the steel, the blade docks on the rule, lowers 8px and backs out to the left by L k 0.9. Merged into the default branch as 46a05c3 (PR 13) with the preview hold commit b8850ba, checked in git. The ship line "ship dd39bd7" came as a relay from the planning chat and is not yet confirmed in the round 5 chat.

2. **S grid at half strength, plus marks at full.** On the dark tone the grid line pair goes from 0.4 to 0.2, both halves, in `.s2-grid[data-tone='white']` in `shell/shell.css`. `.s2-plus` is not touched. The dark tone covers the push into the forklift, S and the first half of L, and only S is a hold, so S is where it shows.
   - **Q1.** The block rules inside the S pane, the hairline over Hitan servis and the marker's top line, are `--line` at 0.3 white under `[data-ink='dark']`. Default is to halve them to 0.15 with the grid, so every line on S drops together and only the plus marks stay bright.

3. **L into N, N comes in as the tine backs out.** Today N's layer turns on at 9600, L k 1.0, and the frame holds an empty white page from L k 0.6. The default draws N on behind the retreating tip. N's layer turns on at L k 0.58, clipped to the part of the frame right of the blade's tip, so each column of N appears the moment the steel uncovers it and nothing of N ever sits under the blade. The tip's screen x comes from one shared function, the way `darkTop.ts` shares the dark span, so the canvas and the page can never disagree. The curtain is cut at the tip the same way, so N's ground and its forklift rows come in with the pane. N's own wipes, or the note 5 letter reveal, start per column as the tip passes.
   - **Q2, layout, its own line.** Default keeps N's layout exactly as it is and changes only the timing and the reveal. If "rearrange everything" means moving N's blocks, say which ones and where.
   - **Risk.** The N scene's camera and rows may not exist before u 12. If they do not, the builder reports it before changing the camera path.

4. **Versions 2 Linija and 4 Grad leave the app.** `variants/index.ts` lists version 5 only, so `/` and any `?v=` value land on version 5. The version chip and the 2 and 4 keys go. `Linija` and `Grad` leave `story2/versions.tsx` and `story2/scenes/index.ts`, and `story2/scenes/linija` and `story2/scenes/grad` are deleted, about 320KB. Git keeps the history. Every file that only versions 2 or 4 use is listed and read before it is deleted, never a sweep. Storyline 1 code under `src/story` and `src/variants` stays unless it is only reachable from 2 or 4.
   - **Q3.** Default deletes the code. The other choice is to unlink only, leaving the folders in place.

5. **Text load in, letter by letter, a board of five.** The block wipe is REJECTED on text (taste.md 10.05). Five reveals built on N's title and lede, all driven by the scroll like today, none fading (taste 2026-10-12 17.55, nothing fades). Shown on one board with `variants.mjs` from localhost, Filip picks by number, then it goes on every beat pane and the sections after the story.
   - 1, Rise. Each letter rises 0.4em out of a mask at its baseline, 14ms apart.
   - 2, Type on. Letters set one by one at a steady pace behind a 2px ink caret, the caret leaves at the line end.
   - 3, Ink up. Every letter waits in text grey and turns ink in reading order, the same move as the lede fill already on C1, used as the load in.
   - 4, Word slide. Whole words slide in 24px from the left, each clipped at its own box, 40ms apart.
   - 5, Settle. Each letter cycles through two other letters of its own word before it lands, left to right.
   - Image, figure and cell reveals keep their wipes. They are not part of this ruling.

6. **Primary call to action on every beat pane.** Notes 6 and 7 have one cause. PPane, SPane, NPane and ATPane in `shell/panes.tsx` all pass `kind="secondary"` to their main button. All four become the primary, red with the black sweep hover (taste 2026-10-09 11.23, 2026-10-12 23.50). Same size and place, so no layout moves.

## Order of work

1. Filip answers the deadline, Q1, Q2 and Q3. "Go" approves every default but Q2, which needs its own answer.
2. A fresh session builds the round from this file, per the one session per round rule.
3. Items 6, 2 and 4 first, they are small and independent. Then item 3. Then the item 5 board, sent as one image.
4. After Filip's board pick, the reveal goes on every pane, then the self check, the before and after shots of the changed beats, and `/uireview`.

## Done means

- No open sev 1 on the `/uireview` card for the round 5 head.
- The real scroll check shows no layer of one beat on another, from S through N.
- Filip has looked at the round 5 head on his localhost and given a ship line for that commit.

## Branches

One branch, `claude/awesome-faraday-lkhnn2`, built by the round 5 session. Resume check-in, per the Sessions rule in the README, `trig_012UYHimVstoCorm7cHhZn3Q`, hourly at minute 18 into that session, deleted when the round is done.
