# r3-f, the footer truck row in 3D

Status: built, not committed. Sheet is r3-f-footer.webp in this folder. Top left before, top right after (1920 by 1080, footer at the end). Second row left, the entry frame at 330ms. Third row, 1440 by 900 before and after.

## What changed
- `scripts/render-footer-trucks.mjs` is new. It loads the four GLBs in headless Chromium with three, renders each to a transparent 1200 by 1014 image and writes WebP to `public/footer/` (mt15c, h30d, r16, n20, 31 to 115 KB each). Run it with `node scripts/render-footer-trucks.mjs`. It needs playwright-core and Chromium (env CHROMIUM, and PLAYWRIGHT_CORE when playwright-core is not in the project).
- Look follows the story (scenes/sistem). Lens fov 28, studio HDR at 0.6, the hero beat key, rim and hemisphere lights turned with the camera yaw, ACES tone mapping, the story's material tuning, and the same soft blob contact shadow, plus a faint key light shadow on a transparent catcher.
- One shared view for all four. Camera from the front right, yaw 32 degrees, pitch minus 11, forks to the right as in the hero. The Prodaja beats are top down or a close aisle view, so the hero angle was the match, tilted a little further to show three faces.
- True relative scale. One camera distance, one canvas, ground lines on the same pixel row. Sizes in metres are logged by the script (MT15 1.54 long, H30 3.96, R16 2.62 by 3.08 tall, N20 3.85).
- `sections.tsx`. `FooterTrucks` replaces `FooterLine`. Four images with width and height, Serbian alt text from `copy.ts` (footer.trucks), loading lazy. Rise 24px, 720ms, staggered 120ms per cell, transform only, no fade. Armed through an IntersectionObserver as the products cells are.
- `sections.css`. Row three is a grid of the four cells the verticals cut (the last is 24px narrower, so all four stills share one width). Truck 24px in from its lines, overflow clipped at the rule so the shadow and the rising still sink below it. Row three top padding 72px to 24px, since the stills carry their own headroom.
- `lineart.tsx` deleted. FooterLine was its only export and only sections.tsx imported it (grep first).
- `copy.ts`. Alt texts and the still size only.

## Checks
- tsc clean, vite build clean (chunk size warning only, as before).
- baselint found nothing off the scale.
- 2x DPR shot of the H30 cell is sharp, the 1200 px file shows at 443 css px, so 2.7x.
- Alpha at the file edges is at most 12 of 255, so no hard cut where a still ends.
- Entry frame with transitions paused at 330ms, offsets 2, 5, 13 and 24px, so the stagger runs. Reduced motion, no transform and no armed class.
- Red is only the model shells as the story renders them, no red set in CSS.

## Notes for Filip
- The footer is about 26 to 34px shorter than before (row three padding and image height). Rows one and two did not move.
- The H30 soft shadow tip ends about 10px from the vertical line at 1920. It is the shadow only, the truck is 24px or more in.
- The MT15 is small because it is a 1.5 m truck beside 3.9 m ones. That is the true scale he asked for.
- Nothing outside the allowed files changed. Dev server on 5206 was stopped.
