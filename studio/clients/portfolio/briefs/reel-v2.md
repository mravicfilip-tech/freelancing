# Reel v2, 9 by 16, plan

Status. Settled by grill and harden on 2026-10-07, building. Filip's notes on v1 were more content (take the copy from the site), much faster with hard cuts, and more wow in the effects. v1 read as one slow glide.

## Decisions

- Track. "Love" by INNA, 128 BPM, one beat every 0.469 seconds. The video has no audio. Frame 0 is a downbeat, so Filip lays the track in Instagram starting on a downbeat and every cut lands on the grid.
- Length. 15.0 seconds, 32 beats, eight bars, so it loops on a full bar.
- End card. "DM on Telegram" with t.me/filipmravic.
- Logos. The same twelve as the public site, studios ChannelFusion, Ragebite, Art & Code, MadeTight, Diversify, then brands Allstate, BRP, Bosch, Samsung, Volkswagen, Hankook, Mitsubishi Motors.
- Cut for length. No toolkit, process is three words.
- Defaults taken without asking (say if any is wrong). The hook is the full hero line, the halftone face stays for the clear beat, effects hit hard on a cut and die within five frames, nothing glitches during a hold.

## Pace rules

- A cut or a slam on every beat, half beats in the fast runs.
- A line that must be read holds at least one beat after it lands. Effects never run over a hold.
- Every cut carries a construction move, a guide shooting in or a crosshair flare, so it still reads as the blueprint world of clip 2.
- Camera moves are whips (fast, with motion blur along the move) or punch-ins on a slam. No glides.

## Copy, all from the site

- Hero. "I turn legacy platforms into products." Kicker "UX strategy & product design".
- Experience. "Eleven years of shipping."
- Process. Research, Interfaces, Prototypes.
- Work, one fact each from the project ledes. BRP, one dealer platform across North America, Europe and APAC. Allstate, the platform 7,800 agents use. Varntix, complex instruments made legible. HFDX, fewer, clearer steps from deposit to position. Lyrie, five vendors replaced by one account.
- Clients. "Partnered with", then the twelve logos.
- Statement. "Even when it's complex, I make it clear."
- Contact. "Have a project in mind? Let's talk." Then DM on Telegram, t.me/filipmravic.

## Cut list, 128 BPM

| Beats | Time (s) | Shot | Motion and effect |
|---|---|---|---|
| 0 to 4 | 0.00 to 1.88 | Hook | I TURN, LEGACY, PLATFORMS (hollow with the fade), INTO, PRODUCTS. One word per half beat, each slams in with a punch-in, chroma kick and a guide. The words stack, so the whole line holds a beat at the end |
| 4 to 7 | 1.88 to 3.28 | The M. | Flash cut. Guides shoot in, the M. draws in, the orange stop lands on beat 5 with a flare. FILIP MRAVIĆ slams on beat 6, the kicker types under it |
| 7 to 9 | 3.28 to 4.22 | Years | Whip in. The counter rolls 00 to 11 and locks on beat 8, YEARS OF SHIPPING measured under it |
| 9 to 12 | 4.22 to 5.63 | Process | Glitch cut. RESEARCH, INTERFACES, PROTOTYPES, one per beat, each over its own site image, the plane flips angle on every cut |
| 12 to 22 | 5.63 to 10.31 | Work | Five projects, two beats each, whip pans that alternate direction. The client name slams, the cover on a tilted screen with a second screen floating nearer, the fact types in |
| 22 to 25 | 10.31 to 11.72 | Clients | PARTNERED WITH, the twelve logos stutter into a grid on sixteenth notes, then the grid holds |
| 25 to 28 | 11.72 to 13.13 | Complex to clear | Glitch cut, the dots explode across the plane under EVEN WHEN IT'S COMPLEX, then snap into the face on beat 27 with a flash for I MAKE IT CLEAR |
| 28 to 32 | 13.13 to 15.00 | Contact | HAVE A PROJECT IN MIND types, LET'S slams, TALK lands hollow with the orange stop. On beat 29.5 the M. and DM ON TELEGRAM, t.me/filipmravic. Holds, then the last four frames collapse to the orange dot |

## Effects

- Flash, a white hit that decays over three frames, on the big cuts only.
- Chromatic split, red and blue pulled apart along the move, decays over five frames.
- Motion blur along every whip, from the camera's own speed.
- Glitch, horizontal slices shifted for two to four frames, on the process and complex cuts only.
- Punch-in, the camera kicks in 8 percent on a slam and settles in 0.15 seconds.
- Always on, film grain, a vignette and the tilt-shift band on the tilted shots.

## Build

The v1 engine draws the scene on a 2D plane, then shows it through a CSS 3D camera, which cannot do post effects. v2 keeps the 2D plane per shot and projects it in WebGL instead, one quad with the same camera maths, the site's dot grid drawn in the shader so the plane has no edges, then one post pass for flash, chroma, motion blur, glitch, grain, vignette and tilt-shift. Still frame by frame and deterministic. Render time is measured on a 3 second test before the full render.
