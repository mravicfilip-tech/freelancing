# Round 8 notes, bullhill

Filip's notes of 20 October 2026, after bullhill.co went live at 048c0fb. Planned in one pass in a fresh session.

1. Phone hero. "I don't like how the mobile hero animation is executed - reiterate." Task bullhill-17.
   Logged REJECTED in taste.md, 2026-10-20 14:45. The redraw is proposed in words with one reference,
   built only after Filip's yes.
2. Speed. "I think the browsing speed is not smooth, animations etc - browsing feels heavy - deep
   analyze and optimize everything." Task bullhill-18. Measure first, fix by measured cost, shots
   before and after, nothing that was not named moves.

## First numbers, read from the public build at 2ea6165

- Scripts 1.5MB raw. The largest chunk is three.js and the scene code, 903KB raw and 239KB gzipped.
  Foundry 240KB, the entry 223KB. Two Scene chunks ship, hero 6 and hero 7.
- public holds 43MB, much of it hero 6 renders the public build never shows.
- Lenis smooths desktop mouse wheels, taste 2026-10-15 10:24. It is a first suspect for "heavy" on desktop.
- Every section mounts one a frame after the hero, with Rise text reveals, dot art canvases, the
  audience particles and the ground motion all running on scroll.

## Questions for Filip, asked 20 October 2026

1. Phone hero. What bothers you most, the pace, the look of the 3D, the stills strip, the black
   scrims, or that it plays by itself? Is there a site whose phone hero you like?
2. Heavy. On which device, your phone, a desktop with a mouse wheel, or a laptop trackpad?
3. Lenis. Keep smooth wheel scrolling, or try native scrolling for a direct feel?
4. The deadline for this round.
5. The link preview image waits on preview 2ea6165 for Filip's deploy.
