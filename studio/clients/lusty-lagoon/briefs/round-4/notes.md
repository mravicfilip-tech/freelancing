# Round 4 notes, lusty-lagoon

Filip's feedback on the live variants at https://lusty-lagoon.vercel.app/variants, commit f8ced30,
sent on 2026-10-19 as two Loom videos and one Dribbble image, with "start processing and making
plan". Loom 2 came first in the thread and covers variant 1 only. Loom 1 opens with "Round two of the
feedback" and covers every variant. Notes run in that order.

Each note keeps Filip's words from the transcript, the time in the video, the element under his
cursor in the frame at that time, and the live variants it touches. A reading marked Likely or
Guessing is not settled, and the plan asks about the ones that change what gets built.

Status queued. No code is touched until Filip says go on the plan in `plan.md`.

Variant names. 1 Social lagoon, 2 Sunset stage, 3 Rank road, 4 Casino floor, 5 Quiet vault. Base is
the 1 to 1 lobby at `/lobby`.

## Loom 2, variant 1 (150 seconds)

### 1. 0m12s, the menu button at the top left

- Said "I'm not sure what this menu is doing. We can remove it"
- Under the cursor. The hamburger square left of the wordmark in the variant 1 top bar.
- Touches 1, and 3, which has the same button in its shell.

### 2. 0m24s, the four sidebar promo tiles

- Said "They're cool, but the gradients need more work, we can do a soft border around them. Make this
  really look sharp ... this border here is kind of good ish, but I think we still need to execute"
- Under the cursor. Daily chest, Rank road, Hot streak and Refer friends, the 2 by 2 tiles at the top
  of the sidebar. At 0m30s the cursor sits on Rank road.
- Touches 1 only. `PromoMini` lives in variant 1.

### 3. 0m43s, orange for every primary action, app wide

- Said "since the layout is purple, the best contrasting color is going to be orange for all primary
  CTAs. So this is going to be a global change for all of the CTA and buttons for primary color. So
  let's apply that"
- Touches every live variant, the 1 to 1 lobby and every product screen. Logged as an app-wide ruling
  in `taste.md`. The site list is in `plan.md`.

### 4. 1m14s, the active row in the sidebar

- Said "This sidebar here is cool, but I think the active border color here needs a bit more work"
- Under the cursor. The active Lobby row in the GAMES group.
- He then looked through Dribbble for an example (CryptoRush crash casino, General Settings dark UI)
  and closed with "Not this" at 2m25s. No reference settled.
- Touches 1, 3 and 5, which share `NavItem`.

## Loom 1, all variants (381 seconds)

### 5. 0m16s, five button variants

- Said "Please give me five variants on the buttons, they need to feel more modern, better executed
  and more premium"
- Touches every variant.

### 6. 0m22s, font sizes

- Said "let's address the font size, like we're all over the place with the fonts"
- Measured. Variants 1, 3, 4 and 5 and the shared kit use 16 different text sizes, 8 of them one off
  pixel values (22, 28, 32, 40, 48, 64, 72 and a second 20). Variant 3 alone uses 13.
- Touches 1, 3, 4 and 5.

### 7. 0m31s, the hover that lifts and gets cut off

- Said "I don't like that this, for example this hover, is going up and it's cutting off"
- Under the cursor at 0m44s. The Slots tile in the variant 1 top block.
- Certain. The category tiles and the game covers lift 4px on hover (`hover:-translate-y-1` in
  `VividTile` and `CoverCard`). Likely, the top row lifts under the pinned top bar, so its top edge
  is cut.
- Touches 1, 3, 4 and 5, which all use `CoverCard`.

### 8. 0m47s, the Daily chest card

- Said "I don't like this widget here, how it's executed"
- Under the cursor. The Daily chest card at the top of the variant 1 right column, with the chest
  art, the six digit countdown, the weekday strip and Remind me when it opens.
- Touches 1.

### 9. 0m50s, the balance dropdown does nothing

- Said "this dropdown is not active"
- Under the cursor. The caret after 2,492.00 USDT in the balance pill.
- Certain. The caret is a plain icon inside `BalancePill`, with no button and no menu.
- Touches 1 and 3, which use `BalancePill`. Variants 4 and 5 show the balance their own way.

### 10. 0m59s, the Deposit button

- Said "this deposit button is very really bad"
- Under the cursor. The purple Deposit button beside the balance pill.
- Touches 1, 3 and 4.

### 11. 1m03s, okay but not there

- Said "this is okay ish but still needs a better execution"
- Under the cursor. Between the end of the All games grid and the Latest bets table. Likely the Latest
  bets table.
- Seen in the same frame. The All games grid stops after 10 covers, so its second row at 1920 holds 3
  covers and 4 empty slots.
- Touches 1.

### 12. 1m14s to 1m54s, what better UI means

- Said "to me this is better UI. By UI I mean how the layouts and elements are going ... way better,
  way cleaner. I'm gonna give you all of this here"
- Shown. Two Dribbble shots, Modern Crypto Trading Dashboard Dark UI by Mr Abadul and Task Manager
  Card Dark UI by Mitesh Samal. The second is the image he sent in the thread. Both are saved in
  `references/2026-10-19-round-4/`.
- What they share. A near black ground, panels with a 1px light edge, one soft purple light per panel,
  quiet small labels, generous inner padding, rows separated by space or a faint line, one strong
  number per panel, and colour kept for status.
- Touches every variant.

### 13. 2m08s, variant 1 Recent wins fills the row

- Said "recent wins, this, we need to populate this full table here"
- Certain. At 1920 the strip holds 12 covers and ends at about 1110px of a 1450px column.
- Touches 1.

### 14. 2m13s, variant 1 the four category tiles

- Said "these four cards here need a bit more work"
- Under the cursor. Slots, Megaways, Hold and win and Refer, the 2 by 2 tiles beside the hero.
- Touches 1.

### 15. 2m13s, variant 1 the hero woman is cut off

- Said "the woman is being cut off here"
- Touches 1.

### 16. 2m21s, variant 1 the art behind her

- Said "this element asset behind it is not fully polished"
- Under the cursor. The flower pillar behind the hero woman.
- Touches 1.

### 17. 2m26s, variant 1 the top block as a whole

- Said "this whole block is not fully exciting. It's a good step but it's not fully there yet. So
  let's please work on this more"
- Touches 1. The hero, the four tiles and the Daily chest card together.

### 18. 2m33s to 3m34s, variant 2 is dropped

- Said "I really don't like the sidebar, I liked the previous sidebar. The hero needs better
  execution, it either needs to be bigger and then the image needs to be upscaled. Then for the
  winners here I don't like this UI, I think that the first UI did it better. Then these cards, no, I
  don't really like this at all. The chat is okay ... I don't think we should keep this variant at
  all, we can skip variant two"
- Touches 2, which leaves. Two lessons carry. The full labelled sidebar of variant 1 beats the icon
  rail, and the variant 1 wins strip beats the podium wins.

### 19. 3m34s, variant 3 an image is cut off

- Said "I don't know what's this doing here, image being cut off here"
- Likely. The hero woman, whose head runs off the top of the hero band, beside the chest.
- Touches 3.

### 20. 3m42s, variant 3 padding in the rank card

- Said "we don't have proper padding here where it says thousand"
- Under the cursor. The 550,000 points line and the "100,000 points to Silver" row under the progress
  bar. Likely the row under the bar, 8px below it (`mt-2`), with no room between the big number, the
  bar and the row.
- Touches 3.

### 21. 3m46s, variant 3 a border

- Said "then this border, right"
- Guessing. The hero edge, where the chest breaks out across the hero card's bottom border. The cursor
  was on the chest at 3m51s.
- Touches 3.

### 22. 3m53s, variant 3 the hero art

- Said "this hero image here should be bigger and this should be more exciting, better designed"
- Touches 3.

### 23. 3m59s, variant 3 the weekly race

- Said "this weekly race here, all of these elements, this has potential, but these two boxes, they
  just feel random on how they're designed"
- Under the cursor at 4m01s. The chest art at the right end of the race panel. Likely the slot machine
  on the left and the chest on the right, floating either side of the prize.
- Touches 3.

### 24. 4m08s to 4m41s, variant 3 order by priority

- Said "this is something that we can keep, but we need to rethink the layout here, what's priority,
  because people when they land they want to see, these would be the first two sections, and then
  this, and then this, and then this, of course these two being the top always"
- Read from the cursor path, 4m22s to 4m37s. Likely order. The hero and the rank card stay on top.
  Then Pick up where you left off with Top wins today, then Hot right now, then the weekly race, then
  the rank road, then the unlock schedule and the bets.
- Touches 3. Moves layout.

### 25. 4m41s, variant 4 execution

- Said "for this layout I don't have any comments ... but the UI needs to be way better executed"
- Touches 4. The layout stays.

### 26. 4m56s, variant 5 the balance box

- Said "this is dope but needs better execution, like this box needs to scream more attention"
- Under the cursor. The balance card with 2,492.00 USDT.
- Touches 5.

### 27. 5m02s, variant 5 quick deposit second

- Said "then this box should be kind of second, but needs better execution"
- Under the cursor. The Quick deposit card.
- Touches 5.

### 28. 5m16s, variant 5 Checkout goes orange, five orange buttons

- Said "this needs to be an orange button, and I'm not sure if this is a good orange button. Let's
  iterate five times on the orange buttons"
- Under the cursor. Checkout, a gold button today.
- Touches 5 and, through note 3, every variant.

### 29. 5m47s, variant 5 Biggest wins runs up

- Said "this we just should be going fully up to here or something like this"
- Under the cursor at 5m48s. The empty space above the Biggest wins card, level with the Live wagers
  heading. Likely the Biggest wins card should start level with the Live wagers section.
- Touches 5.

### 30. 5m53s, variant 5 the giveaway banner

- Said "then this banner should be sticking out more"
- Under the cursor. The Hot streak giveaway banner between the money row and Live wagers.
- Touches 5.

### 31. 6m00s, variant 5 where the user lands

- Said "we need proper visual hierarchy, where the user should go and where the user should land,
  priority wise, is it important for us to go to this box here, is it important to go here"
- Touches 5. With notes 26 and 27 this sets the order balance, then quick deposit, then the giveaway.

Context, not a note. At 5m30s, "this layout is fine ... I feel like we're really close to nailing
down the UI", said of variant 5.
