# Phone round 3, pathways and content, 4 November

Filip, after the phone version went live. "I'm not sure about the mobile scrolling experience, how content is pressed or showed", "Can we
iterate on multiple pathways for scroll and just work on the content more so it is nice?", "the primary button on bottom bar is squashed".

## Four pathways, picked by number, each its own link with ?m=N

1. **Stops**, production today. A swipe glides to the next stop, the words leave while it moves and come in once it lands.
2. **Free**. The finger moves the story the way a page scrolls, with the phone's own momentum, and when it lets go the story settles on
   the next stop in that direction. The words show as the story reaches them, nothing is hidden while it moves.
3. **Column**. The scene stays in the top half, and the words of every section are one column under it that scrolls like a normal page.
   The scene glides to the section being read. Nothing is pressed into a sheet.
4. **Tap**. Like a story on a phone. A tap on the right of the scene or a swipe goes on, a tap on the left goes back, a row of segments
   at the top fills as the story goes from stop to stop.

## Content, one pass for all four

- The bar at the foot. The menu and the call are plain icons with no box, and the quote button takes the rest at full height, its label
  centred at 16px, without the black plus box that took a fifth of it on a 390px phone.
- More air in every sheet, 20px at the sides, 16px between blocks, and its button the full width of the sheet.

## How it is built

Two builders in their own worktrees, one for Column and one for Tap, each in a new file of its own. The main thread builds Free and the content
pass, and merges. Desktop must not move.
