# Taste log, phorcast

Newest entry at the top. `/taste` writes here the turn Filip picks or rejects a look. The
`/uireview` critic and every builder read this whole file before judging or building, so each
entry is a rule. Entries marked SUPERSEDED are not rules and move to `taste-archive.md` once this
file passes 8,000 characters.

Entry format.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

- **2026-10-13 14:13, coming soon hero tour, a guided tour that plays in the hero on load.** ACCEPTED (not yet built). Said: "where is teh GUIDED TOUR IN THE HERO BRO". Why: the tour is the hero's animation, so a visitor has to see it without clicking anything. Rejected inside it, the tour hidden behind a "Take the Tour" button with the 3D mark filling the hero (`SoonHero.tsx` step 0). Carry forward: the Phorcast coming soon hero shows the tour from first paint, playing through its steps by itself with a pause control, and Back, Next and dots to drive it; the hero's button scrolls to the waitlist form under the hero.

- **2026-10-13 13:40, coming soon hero, value proposition and click-through tour in the hero, then scroll down to the form.** ACCEPTED, SUPERSEDED by 2026-10-13 14:13 guided tour visible on load (this entry's "no autoplay" and the Take the Tour button hid the tour). Said: "Yes the value proposition and the toured animation should happen in the hero, then scroll down to the form". Why: the visitor sees the value and walks the tour without leaving the first screen, and the tour hands them to the sign up. Rejected inside it, the tour as a band under the hero and the form as the tour's own last step. Carry forward: the Phorcast coming soon hero holds the value proposition on the left and a click-through tour where the 3D mark sits, no autoplay; the tour's last step scrolls to the email form, which is the first band under the hero.

- **2026-10-13 13:38, coming soon tour, a click-through tour inside the hero that leads to the form.** ACCEPTED, SUPERSEDED by 2026-10-13 13:40 (the form is below the hero, not a tour step). Said: "where is the clickthrough tour I asked in the hero animation that will lead the user to the form?". Why: the tour is the hero's animation and the path to the sign up, not a section further down. Rejected inside it, the tour as its own Steps band under the hero (`Tour.tsx`, `#how`) with the form in a separate panel after it. Carry forward: on the Phorcast coming soon page the hero holds the value proposition and a tour the visitor clicks through, and the tour's last step is the email form.

- **2026-10-13 13:20, coming soon page order, value proposition hero then tour then form.** ACCEPTED, SUPERSEDED by 2026-10-13 13:38 click-through tour inside the hero (this entry misread the ruling as a tour band under the hero). Said: "We need the value proposition to be in the hero, front and facing then tour this and then you add the form". Why: a visitor should see what Phorcast does for them and how it works before being asked for an email. Rejected inside it, the email form and its note in the hero (`EmailForm source="hero"` in `SoonHero.tsx`). Carry forward: the Phorcast coming soon hero carries the value proposition and a button into the tour, never the form; the form sits right after the tour, and the top bar's Get Early Access button is the only shortcut to it.

- **2026-10-13 12:45, review widths, 1920 replaces 1440.** ACCEPTED. Said: "not 1440 but 1920 and go". Why: the Phorcast site is designed and judged at 1920, the Figma width (inferred). Carry forward: shots and `/uireview` for Phorcast run at 1920 and 390, never 1440 as the desktop width.
- **2026-10-13 12:45, coming soon page direction, one message and one action.** ACCEPTED (not yet built). Said: "go". Why: the visitor has to understand an unfamiliar product fast and has one thing to do, so every section explains, proves or asks for the email again (inferred). Rejected inside it, the landing page's four-slide hero carousel, the bonus countdown, the "$9.3M Vol" style live-looking numbers and the No KYC, instant withdrawal, 60 seconds, self-custody and token claims. Carry forward: a Phorcast pre-launch page has exactly one action, the email form, no carousel, no countdown without a real date, no number presented as live, and only claims the FAQ backs.
