# Round 8 plan, lusty-lagoon

From `notes.md` in this folder, 13 notes on commit 1499180. Filip said "Run this", so everything below is
built now. Variant 1 only. Variants 2 and 5 freeze at 1499180. Widths are 1440, 1920, 2560 on desktop
and 375, 425 on the phone.

## Choices Filip makes after the build

Each choice is one switcher entry or one URL, so he answers with a number.

- Hero, `?hero=1`, `?hero=2`, `?hero=3`. Base is the round 7 hero.
- Mobile, `?m=1`, `?m=2`, `?m=3` at a phone width. They pair with any hero.
- Category cards, `?cards=1`, `?cards=2`, `?cards=3`. They were rejected twice, so three treatments
  rather than a fourth single guess.

## A. Hover, done in the main thread

The sheen is the one hover. Primary keys glow orange and secondary keys glow purple (`.k-hov-2`).
Treatments 2 to 4 are removed. Commit 5fa3aeb.

## B. Desktop fixes, notes 2 to 5, 12 and 13. Builder on v1 Tiles, TopBar, ui and a new Notifications

- Cards. No coloured border or rim. No slide-in arrow. The hue only as light behind the art. Three
  treatments on the same data and the same click targets.
  1. Lit stage. Dark v1 panel face, the art large and breaking out of the top, a soft hue light behind
     it, the title and the count under it. On hover the art lifts and the sheen crosses the card.
  2. Deep hue. A rich two-stop face, the hue at the top falling to the panel colour at the bottom, no
     edge, the art large on the right, the title large on the left. On hover the art lifts and turns a
     few degrees.
  3. Compact tiles. Shorter cards, about 160px tall, the art on the right edge cut by the card, the
     title and count on the left, a quiet tinted face. They read as shortcuts under the games grid. On
     hover the face brightens and the art lifts.
- Notifications. A v1 panel, `v1/Notifications.tsx`, in v1's surfaces and type, with the filled
  colour glyphs in tinted squares from the v1 sidebar, an unread dot in the accent purple, Mark all as
  read, the styled scrollbar. Same data as the shared panel. The bell opens it.
- Secondary keys. v1's purple and quiet keys take the sheen with the purple glow.
- Leftover CSS for hover treatments 2 to 4 in `neon.css` is removed.

## C. Hero, note 6, three iterations. Builder on v1 Hero and a new hero folder

Every iteration keeps the headline, the line, Play Sugar Rush, the 1,284 online pill, Top win today and
the 3 day streak, and holds at 1440, 1920, 2560, 375 and 425. The art follows
`briefs/round-7/art-recipe.md`. None of them keeps the woman boxed between two pillars on the left.

1. Spotlight right. The woman moves to the right third, lit by a warm key light. The headline side is
   a clean deep purple with one soft light behind the text, the scene only behind her. Top win today
   sits low on the right and overlaps the scene edge.
2. Poster. The scene runs edge to edge, brighter and warmer, a lagoon at night with lanterns. The woman
   is large, centre right, cropped at the thigh. The headline sits in a frosted glass panel on the
   left. Online now, Top win today and the streak sit in one bar along the bottom.
3. Carousel. Three slides in the same frame, each with its own art in the scene. Welcome with Play
   Sugar Rush, the Hot streak giveaway with Join, the Daily chest with Remind me. Dots and arrows,
   swipe on the phone, auto advance that pauses on hover and stops under `?still`.

## D. Mobile, notes 7 to 11, three iterations. Builder on Variant1 and a new mobile folder

All three under 768px wide. Order, the top bar, the winners feed, the hero (whichever `?hero`), All
games, the category cards, Latest bets. Notifications and account open from the top bar. Chat, the
Daily chest and the Hot streak giveaway open as panels. A bottom menu bar holds Lobby, a few menu items
and More, which opens the full sidebar menu. Desktop moves the category cards below All games too.

1. Tab bar. A fixed five slot bar, Lobby, Games, Chat, Rewards (the Daily chest and the giveaway), More.
   Panels are bottom sheets with a drag handle. Games in a three column grid.
2. Deposit centre. Lobby, Chat, a raised orange Deposit in the middle, Rewards, More. A slim top bar
   with the balance. Games as side scrolling rails by category. Panels open full height.
3. Floating dock. A glass pill dock that hides on scroll down and returns on scroll up. The Daily chest
   and the giveaway as two chips under the top bar. Games in two large columns. Chat slides in from the
   right and the menu from the left.

## Checks

tsc and build, no console errors, no sideways scroll at all five widths, AA on every text touched,
`?still` and reduced motion respected, the e2e suites, after shots with `--compare` and `--interact`,
and one board per choice.
