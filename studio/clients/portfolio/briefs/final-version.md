# Portfolio final version, plan

Status. Building. Task portfolio-3. Branch claude/halftone-slice in filip-portfolio, baseline f1346d4.

Filip's ask on 2026-10-08. A full /uireview for accessibility and text contrast. A mobile pass so the
motion makes sense from the content, not only the background. Then build the final version.

## Part 1, accessibility and contrast

The /uireview round 1 findings F1 to F11 are in the ledger (studio/.state/ledger/portfolio-3.json).
Sev 1 and sev 2 get fixed in the code before the mobile pass starts. The one taste change is the
hollow-word fade, which now ends at 50% instead of 35% (3.43 to 1 light, 4.78 to 1 dark, was 2.24
and 2.87). Filip can keep 35% and accept the failure.

## Part 2, phone motion

### Direction, one pick

On a phone the content arrives and the glow follows. Each section's content gets its own arrival at
the moment it enters the screen, built from the motions desktop already uses (the rise in masks,
the one 135 degree cover sweep, the deck deal, the stop drop), so phone and desktop read as one
site. The glow stays the brand background but steps back to a bed under the copy.

It refuses new phone-only effects, content scrubbed to scroll, rows that scroll by themselves,
pinned sections on phones, and any change to desktop motion.

Today on a phone, after the hero, no content moves on the five project plates, the toolkit or the
contact. Only the glow dives and floods the screen between sections, and the flood drops body text
to 1.3 to 2.2 to 1 at its peak.

### Rules for every arrival

- Phones only, below 900px, with motion on. Desktop plates keep their own choreography.
- Fires once per load, when the element's top reaches 88% of the screen, with a catch-up for what
  is already on screen. Content is visible by default in CSS, so a failed script leaves it readable.
- Reading order, top to bottom. Nothing re-enters against it.
- Taste rules bind. The window arrives as part of the one cover sweep and has no second animation.
  Tool cards never cross the statement and stay flat. The head is the scan head only, repel only.
  The orange stop lands last.

### Arrivals

1. Hero. Kicker, portrait box and buttons stay hidden while the curtain lifts, then play after it,
   headline, kicker, buttons, in that order. The intro note rises when it enters the screen.
2. Sectors. The kicker rises on entry. The letter fill stays as it is.
3. Project plates. The window stays veiled until it enters the screen, then the one 135 degree sweep
   prints bar and screen together, 1.1s, linear, the same sweep desktop uses. The copy rises in its
   masks, 0.9s, stagger 0.07s, in reading order.
4. Toolkit. Headline and sub rise in their masks. The five cards deal in from the right inside their
   row, 0.08s apart, so the row reads as one that runs past the edge. That is the cue for cards 3
   to 5. The cards never leave the row.
5. Contact. Heading and sub rise as on desktop, 1s, stagger 0.08s. Pill and rail fade up. The
   signature letters rise when the sign-off enters the screen and the orange stop drops last,
   0.55s.
6. Case page. Screenshots fade up when they enter the screen and have decoded. On a deep link the
   cover rises with the hero stack.

### The glow on phones, dark theme only

7. The handover flash is capped so text under it stays readable at the peak. Target 4.5 to 1 for
   body text at the flash peak, measured. The dive itself stays.
8. At rest the drift halves, the brightness wave stops, and the glow draws every other frame.
9. Back to top jumps with the 0.7s cut fade instead of running 8 dives in 0.7s.
10. The glow stops drawing while the drawer or the menu covers it.

### Touch

11. Every hover style that sticks after a tap moves behind the hover and fine pointer query. Sectors
    tilt, copy hint, pill ring, rail and call links, case tile ring and next card ring.
12. Buttons show their press state on iOS.
13. The skip hint reads "Tap or scroll to skip" on a touch screen.
14. The head repels under a finger while it is down, the same repel the mouse gets.

### Reduced motion

15. The menu opens and closes with no wipe, no stagger and no burger morph.
16. The glow draws one still frame, with no scroll pan and no re-fade.
17. The copied email swaps its text with no scramble.
18. The sectors tilt is off.

### Hidden work removed

19. The invisible card swing, shine and pixelation stop once the scan head shows.
20. The rejected rain scrub stops running on phones.
21. The scan head twinkle draws at 30 frames a second on phones and stops off screen.
22. Sectors images load the small size on phones, not 640w for a 50px tile.

### Left over from the map

23. The sectors fill range is measured again after fonts and the hero settle, so loads with no intro
    fill at the right place.
24. Contact type under 14px goes to 14px. The sub (12.5px), drawer labels (11.5px) and the drawer
    trust line (10.9px).
25. The Open case study focus ring is no longer clipped by its mask.
26. Drawer focus skips the hidden honeypot.
27. The copy confirmation is announced through a live region.
28. The pill's accessible name keeps "Quick brief, takes a minute".
29. The sign-off clock shows on phones.

## Checks before it is called done

- Build passes, `grep -rl Jelena dist` finds nothing.
- Shots at 1440 and 390 in both themes against round 1. Nothing at 1440 moves apart from the
  named items.
- Phone frame captures of each arrival at 390.
- Flash peak contrast measured under body text.
- Reduced motion run at 390.
- /uireview re-check, then the card.

## Build split

One shared helper first, then builders split by file so no two touch the same one.

- Helper. `src/lib/phoneReveal.js`, the phone gate and the in-view batch, written before the
  builders start.
- Hero and head. Hero.jsx, hero.css, PortraitTilt.jsx, portrait.css, scanHead.js, Loader.jsx,
  loader.css.
- Sectors and projects. SectorsPlate.jsx, sectors.css, ProjectPlate.jsx, project.css,
  shotframe.css, coverReveal.js.
- Toolkit and contact. ToolkitPlate.jsx, toolkit.css, toolkit/, ContactPlate.jsx, plates.css,
  ContactDrawer.jsx, contactdrawer.css, mobile.css.
- Glow and chrome. Atmosphere.jsx, atmosphere.css, src/atmo/, Nav.jsx, nav.css, main.jsx.
- Case page. src/pages/CaseStudy.jsx, case.css.
