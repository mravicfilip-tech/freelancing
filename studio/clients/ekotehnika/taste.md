# Taste log, ekotehnika

Newest entry at the top. `/taste` writes here the turn Filip picks or rejects a look. The
`/uireview` critic and every builder read this whole file before judging or building, so each
entry is a rule. Entries marked SUPERSEDED are not rules and move to `taste-archive.md` once this
file passes 8,000 characters.

Entry format.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

- **2026-10-08 16:52, hero scroll motion, flat side view pan.** REJECTED. Said: "this is not like my inspiration where it scrolls and changes perspective on the animation on scroll". Why: the reference reels change the camera itself on scroll, side view to top down, pull back to aerial, a 3D fly through, and the build only slid one fixed side view sideways (Scene.tsx world layer translateX with a half speed back layer). Carry forward: scroll must change the camera viewpoint, its angle, height or distance, at least once per station, and a horizontal pan of a single flat view never counts as the scroll story.
- **2026-10-08 16:27, hero imagery and scroll story, forklift illustrations over photography and trucks.** ACCEPTED (not yet built). Said: "not just trucks directly because forklifter with box/product delivery is better option". Why: the reels carry one vehicle through the story, and a forklift moving a box or product is what Ekotehnika actually sells and services, where a road truck is a freight forwarder's image. Overrides the hero brief's "real photography, no illustrations" line for this hero only. Rejected inside it, road trucks as the hero subject. Carry forward: the hero's moving subject is a Linde-style forklift carrying a box or pallet, drawn as an illustration in brand tokens only (linde-red, ink, text-grey, light-grey, shade-grey, white), and no road truck appears as the hero subject.
