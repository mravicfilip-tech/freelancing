# BullHill website, round 6 notes, hero 7 on phones

Status. Hero 7 is the production hero since 15 October 2026, 07b7e8f. The seam between the hero glow
and the work section is fixed in c08b793, not deployed. The note below waits for Filip's yes on the
structure in words, no code yet. Foundry at `/?v=1`, files in `bullhill-site/src/p1/variants/hero/`.

## Notes

1. Phone hero, full screen and autoplay, "The animation on mobile needs to be redesigned better to
   take way more of the screen like full VH if possible and just add shadows to overlay it and I
   think we dont need to have an on scroll animation on mobile iit can just autoplay itself on load
   like a decent normal speed". Today at 390 the scene is a box of about 330 by 300 between the two
   headline halves, pinned for 200svh and driven by the scroll.

2. Blur the company sign, forwarded from the client chat, "Na ovoj slici ima tabla sa firmom,
   bluruj tablu da ne bi popili kaznu neku", a sign with a company name on it, blur it so nobody
   gets fined. The photo is `restored-wall`, the Business park access card in Projects
   (Seekirchen, Salzburg), where the sign hangs on the wall top left. The same photo is in the
   work section as "Restored strip along the kerb", so the blur goes into the photo files
   themselves, all five sizes in `bullhill-site/public/photos/`, not a CSS overlay. While there,
   check the other six photos for readable company names, signs or number plates.

## Proposed structure, waiting on Filip

1. The scene fills the first screen, 100svh, edge to edge, behind the header. No pin, the page
   scrolls on into the work section after one screen.
2. A black scrim over the top third holds the headline in one block, "We dig the routes, fibre runs
   through". A black scrim over the bottom 40 percent holds the step label, the lede and Send the
   job. The action sits in the clear middle band.
3. The story plays by itself once the hero is on screen, five steps in about 12 seconds, then holds
   the end frame with the house lit. It pauses when the hero leaves the screen and goes on when it
   comes back.
4. Capable phones run the live scene driven by time. Weaker phones play the 28 frame flipbook,
   re-rendered for the new framing, with each frame fading into the next. Reduced motion shows the
   end frame still.
5. Desktop keeps the scroll driven pin as it is.

This replaces the 2026-10-14 16:30 phone hero structure in the taste log, headline halves around a
picture, once Filip says yes.
