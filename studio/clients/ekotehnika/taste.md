# Taste log, ekotehnika

Newest entry at the top. `/taste` writes here the turn Filip picks or rejects a look. The
`/uireview` critic and every builder read this whole file before judging or building, so each
entry is a rule. Entries marked SUPERSEDED are not rules and move to `taste-archive.md` once this
file passes 8,000 characters.

Entry format.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

- **2026-10-08 17:09, hero UI chrome, live site UI carried into the hero.** REJECTED. Said: "be more inspired on the UI like my videos, you're keeping current website UI too much". Why: the build rebuilt the live header as is (Header.tsx, two row top bar and nav), kept the light-grey copy block, a white dock card over a pillar tab row, the boxed trust strip and the corner promo chip, so it read as the old site with a 3D picture behind it, where the reels use their own minimal chrome over a full bleed scene. Carry forward: the hero's UI takes its patterns from the reference reels, a minimal floating nav, oversized type over the full bleed scene, copy revealed per beat, stats shown openly. The live header, the grey copy panel, the dock card and the boxed trust strip are not reused. Brand tokens, both logos and the type stack stay exactly as in README.md.
- **2026-10-08 16:52, hero scroll motion, flat side view pan.** REJECTED. Said: "this is not like my inspiration where it scrolls and changes perspective on the animation on scroll". Why: the reference reels change the camera itself on scroll, side view to top down, pull back to aerial, a 3D fly through, and the build only slid one fixed side view sideways (Scene.tsx world layer translateX with a half speed back layer). Carry forward: scroll must change the camera viewpoint, its angle, height or distance, at least once per station, and a horizontal pan of a single flat view never counts as the scroll story.
- **2026-10-08 16:27, hero imagery and scroll story, forklift illustrations over photography and trucks.** ACCEPTED (not yet built). Said: "not just trucks directly because forklifter with box/product delivery is better option". Why: the reels carry one vehicle through the story, and a forklift moving a box or product is what Ekotehnika actually sells and services, where a road truck is a freight forwarder's image. Overrides the hero brief's "real photography, no illustrations" line for this hero only. Rejected inside it, road trucks as the hero subject. Carry forward: the hero's moving subject is a Linde-style forklift carrying a box or pallet, drawn as an illustration in brand tokens only (linde-red, ink, text-grey, light-grey, shade-grey, white), and no road truck appears as the hero subject.
