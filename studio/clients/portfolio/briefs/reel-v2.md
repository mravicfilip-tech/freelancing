# Reel v2, 9 by 16, plan

Status. Second cut, building. Filip's notes on v1 were more content (take the copy from the site), much faster with hard cuts, and more wow in the effects. On the first v2 cut (15 seconds) he asked for 20 seconds with the beats compensated, and for the content of the public site.

## Decisions

- Track. "Love" by INNA, 128 BPM, one beat every 0.469 seconds. The video has no audio. Frame 0 is a downbeat, so Filip lays the track in Instagram starting on a downbeat and every cut lands on the grid.
- Length. 44 beats, eleven bars, 20.6 seconds. Read as 20 seconds in total. If he meant 20 seconds more, 76 beats (35.6 seconds) is the next build.
- Copy. Only what the public site shows, the main branch of filip-portfolio. Nothing from the redesign branch (its project ledes and the process words are not live). No testimonials.
- End card. "DM on Telegram" with t.me/filipmravic.
- Logos. The twelve on the public site.
- Kept from the first cut. The halftone face for the clear beat, hits that die within five frames, nothing glitches during a hold.

## Pace rules

- A cut or a slam on every beat, half beats in the fast runs.
- A line that must be read holds at least one beat after it lands.
- Every cut carries a construction move, a guide shooting in or a crosshair flare.
- Camera moves are whips with motion blur or punch-ins on a slam. No glides.

## Copy, all from the public site

- Hero. "I turn legacy platforms into products." Kicker "UX strategy & product design". Role "UX & Product Designer".
- Manifesto. "A hundred screens have to behave like one product." Later "Complex workflows made so clear they read as obvious."
- Services. Product design (UI/UX), with UX research & user flows, wireframing & rapid prototyping, UI design & design systems. Design systems & enterprise UX, with one design language across web & mobile, complex dashboards made legible, handoff specs developers actually use.
- Experience. "Eleven years of shipping", ChannelFusion, Ragebite, Art & Code, MadeTight, Electronic Frag, 2015 to now.
- Work, one fact each from the project intros. BRP, dealers across North America, Europe and APAC. Allstate, roughly 7,800 active agents. Varntix, fixed-rate savings, tokenized bonds, a spending card. HFDX, perpetuals, managed strategies and loan notes in one product. Lyrie, built to replace a stack, not join one.
- Toolkit. "The tools that do the repetitive part." Claude Code, ChatGPT, Midjourney, Figma MCP, Perplexity, each with its role. "AI handles the groundwork. The decisions stay mine."
- Clients. "Partnered with ambitious teams", the twelve logos, then channel marketing, insurance, powersports, enterprise SaaS.
- Contact. "Have a project in mind? Let's talk." NDA, absolutely. Response within 24 hours. Senior UX work, end to end. Then DM on Telegram, t.me/filipmravic.

## Cut list, 128 BPM, 44 beats

| Beats | Time (s) | Shot | Motion and effect |
|---|---|---|---|
| 0 to 4 | 0.00 to 1.88 | Hook | I TURN, LEGACY, PLATFORMS (hollow), INTO, PRODUCTS on half beats, stacking, then the whole line holds |
| 4 to 7 | 1.88 to 3.28 | The M. | Flash cut, guides, the M. draws, the stop lands on beat 5, FILIP MRAVIĆ slams on beat 6 |
| 7 to 10 | 3.28 to 4.69 | Manifesto | Whip in. A HUNDRED SCREENS, HAVE TO BEHAVE, LIKE ONE PRODUCT, one per beat, the plane turns on each |
| 10 to 14 | 4.69 to 6.56 | Services | Glitch cut. Each service two beats over its own site visual, three of its items flick on half beats |
| 14 to 17 | 6.56 to 7.97 | Years | Whip in. 00 rolls to 11, YEARS OF SHIPPING, the five studios flick under it on eighth notes |
| 17 to 27 | 7.97 to 12.66 | Work | Flash cut, then five projects two beats each with whip pans, cover screen, a raised second screen, the fact typed |
| 27 to 31 | 12.66 to 14.53 | Toolkit | The heading slams, five tool cards deal in on half beats, then THE DECISIONS STAY MINE |
| 31 to 34 | 14.53 to 15.94 | Clients | PARTNERED WITH AMBITIOUS TEAMS, the twelve logos stutter into the grid, the four sectors under it |
| 34 to 38 | 15.94 to 17.81 | Complex to clear | Glitch cut, dots burst under COMPLEX WORKFLOWS, snap into the face, MADE SO CLEAR, THEY READ AS OBVIOUS |
| 38 to 44 | 17.81 to 20.63 | Contact | HAVE A PROJECT IN MIND, LET'S, TALK, the three promises on half beats, DM ON TELEGRAM with the address holds, last frames fall to the stop |

## Effects

- Flash, a white hit that decays over three frames, on the big cuts only.
- Chromatic split along the move, decays over five frames.
- Motion blur along every whip, from the camera's own speed.
- Glitch slices for two to four frames, on the services and complex cuts.
- Punch-in, 4 to 7 percent on a slam, settles in 0.15 seconds.
- Always on, film grain, a vignette, bloom and the tilt-shift band.

## Build

video/reel2.js in filip-portfolio. Each shot draws on a 2D plane that WebGL projects through the tilted camera, the site's dot grid drawn in the shader, then one post pass for the effects. Each shot now carries its own hits at beats relative to its start, so shots can move on the grid without retiming by hand. Render is about 1.4 seconds a frame, so about 15 minutes for 619 frames.
