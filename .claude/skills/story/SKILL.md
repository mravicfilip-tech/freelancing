---
name: story
description: Settles the story of a scroll or motion site before anything is built. Decodes the reference videos and sites into a table, writes the beats as a table, gets Filip's voice over, frames or yes, then builds one beat in one version and stops. Use when the job is a scroll story, a hero sequence, a 3D or WebGL walk through, or any page judged by how it moves as you scroll, and by itself when /newui starts on such a job. Do NOT use for a product app screen (that is /newui), a fix to a named defect, or a micro detail variant (that is variants.mjs).
---

# Story

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, else
`~/.claude/studio` when that holds `DOCTRINE.md`, else the folder this skill was loaded from.

On a scroll site the story is the hard part, not the build. One scroll site in October 2026 built 19
variants over about 11 hours before the story was settled. Once Filip drove the story with a voice
over and Figma frames, it went from ask to production in about 4 hours. This skill does the story
first, in words and frames, where it is cheap to change.
Text Filip reads follows `K/foundation/writing.md`.

## Before step 1

1. Read `K/clients/<client>/README.md` and `taste.md` once. With no client folder, say so and carry on.
2. Collect every reference Filip gave, reels, sites, Figma frames, recordings. Ask once for any
   he named and did not attach.
3. Ask for the deadline if the thread has none. It decides how many beats get built in round one.

## Steps

### 1. Decode the references

One table per reference, one row per property, one column per beat. Pull one frame per beat.

| Property | What to write |
|---|---|
| Camera | Does the camera move, orbit, dolly, cut, or does the scene slide past a fixed camera |
| Ground | Colour, depth, texture, light or dark |
| Type scale | Largest and smallest size in px at 1440 or 1920 wide, weight |
| Chrome | Header, nav, progress marks, what stays pinned |
| Rendering | Photo, 3D, flat vector, line drawing, mixed |
| Story device | What carries the viewer from one beat to the next |

End with one line naming the single property that makes the reference work. On that site it was
the camera moving through the scene, and the first build missed it by sliding a flat side view.
**Stop.** Filip confirms or corrects the table. Build nothing until he does.

### 2. Write the beats

One table for the whole page.

| Beat | Camera move | What the scene shows | Words on screen | The one thing a stranger understands |
|---|---|---|---|---|

- Use the client's real services, products and numbers from the brief or the site, never invented
  counts.
- Say in one line which beat is hardest to build and why.
- Offer Filip three ways to answer. A voice over recording, marked Figma frames, or a yes on the
  table. His own recording is the fastest route on record.
- **Stop.** The story is accepted only when Filip says so. Run `/taste` on the answer.

### 3. Build one beat in one version

- Build the hardest beat in the real app, in one version only, at the client's widths.
- Shoot that beat only, one frame per scroll position, on one contact sheet.
- Send the preview link. **Stop.** Filip accepts, corrects or rejects.

### 4. Build the rest

- Build the remaining beats from the accepted one. Reuse its camera, type and timing.
- Interim shots cover the changed beats only. The full board at 1920 is shot once, at round end.
- Finish with `/uireview` once, per DOCTRINE.md, before any hand-off.

## Rules

- No more than one built direction before the story is accepted. Explore in tables, frames and
  words, never in builds. "Explore five directions" gets five rows in the beat table, not five builds.
- A rejected scene or beat is proposed again in words with one reference, and built only after
  Filip's yes.
- A pick freezes the other versions only when Filip says the client sees just one. Ask once.
- Three stops only, the decode table, the beat table and the first beat.
- Brand values come from the README tokens, never an improvised hex.
