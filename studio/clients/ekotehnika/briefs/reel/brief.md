# Showcase reel of the website, 9 by 16 and 16 by 9

Filip, 12 October 2026. "I worked on a 9:16 video clip under chat Github portfolio work that was a video reel showcase of the website in perspective. I wanna do this for this website too as well. Make two outputs 9:16/16:9 based on the website and branding. T-Pain - Church (Official HD Video) ft. Teddy Verseti. Sync for this music. Create the videos only after all ekotehnika chats are done and the whole website is done."

## When

- **Now.** Read the references, decode them, write the plan and the beat table in `plan.md` in this folder, for Filip's review. No render, no test frames.
- **Build only after the parent session says go.** That is after round 4 and every Ekotehnika builder chat are merged and Filip has given his ship line on the finished site. The reel shows that version and nothing older.

## Outputs

- Two videos from one timeline, 1080 by 1920 (9 by 16) and 1920 by 1080 (16 by 9), H.264 MP4. Each is composed for its own frame, not a crop of the other.
- Cut on the beat grid of the track, as in the portfolio reel, so every cut lands on the music.

## The reference, Filip's own earlier reel

- Plans `studio/clients/portfolio/briefs/reel-blueprint.md` and `reel-v2.md` on branch `claude/vibrant-archimedes-05l1z5` of this repo, from the "GitHub portfolio work" chat.
- The renderer `video/reel2.js` in the repo `mravicfilip-tech/filip-portfolio`. One timeline set to any exact moment, each shot drawn on a 2D plane that WebGL projects through a tilted camera, one post pass, a script steps frame by frame in the cloud browser and ffmpeg encodes.
- What carried over well there. A tilted plane in perspective, construction lines and crosshair flares, real UI on tilted panels, copy only from the live site, hard cuts on beats, a line that must be read holds at least one beat.

## The music

- T-Pain, "Church", feat. Teddy Verseti. Filip, "You don't need to pull it, just find the song and sync it for the BPM sound". No audio file is fetched or committed.
- The chat finds the track's tempo from at least two published sources that agree (a BPM database and a music site), and says in the plan if they disagree.
- The videos are silent and cut on that beat grid. Frame 0 is a downbeat, so Filip lays the track in his editor starting on any downbeat and every cut lands on the music, as with the portfolio reel.
- A commercial track is fine for a private pitch. For a public post or client use, the music may draw a copyright claim, a licensed stand in is Filip's call.

## Brand and content

- Everything from `studio/clients/ekotehnika/README.md` and `taste.md`, the guideline red `#a00020`, Daxline Pro with Geist digits, the 12 column grid with its plus marks, the logos from the files, never redrawn.
- Content is the website itself, its beats, scenes, copy and products. No number, claim, client name or testimonial the site does not carry.
- Real frames of the site, rendered from the app at exact story positions with `?v=5&at=<beat>&k=`, laid on tilted panels, not a screen recording.
