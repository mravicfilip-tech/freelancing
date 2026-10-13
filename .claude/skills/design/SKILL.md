---
name: design
description: Builds a design board of every screen in a project, each captured full page at 1920 wide and laid out as a labelled grid with a click through full size view, and sends the overview image plus the path to the page. Use when Filip types /design or asks for a board or an overview of all screens, and by itself when a project has more than 5 screens, at the preview step before the preview link goes out, and at the end of /newui once screen six exists. Do NOT use for 5 or fewer screens unless Filip asks, never at phone width, and never as a replacement for the preview link.
---

# Design board

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, else
`~/.claude/studio` when that holds `DOCTRINE.md`, else the folder this skill was loaded from.
S is where review state lives, `K/.state` when K holds `DOCTRINE.md` and
`~/.claude/studio-state` otherwise.

Filip's ruling, 12 Oct 2026. When there are more than 5 screens we do a /design board to preview
the project, at 1920px. The board gives him the whole project in one look before he opens the
preview link. Desktop first. Phone layouts only when the client brief names them. Text Filip reads follows
`K/foundation/writing.md`.

## Steps

1. **Count the screens.** Count the routes in the app's router or nav, or the screens named in
   the brief. A screen is a route Filip would click to, not a state or a modal. With 5 or fewer
   and no ask from Filip, stop. Say nothing about it.
2. **Name the routes.** Write them as `Name=/path` in the order Filip walks them, the same
   names the shoot run uses. Leave `--routes` out only when the start page links every screen,
   and then read the "routes found" lines it prints against the router.
3. **Capture.** Point at the running app of the commit the preview deploys, since the preview
   sits behind a login. Run

   `node K/scripts/board.mjs --url <base url> --routes "Name=/path,..." --out S/boards/<task> --title "<project>"`

   Width is 1920 and stays 1920. The script refuses anything under 1280.
4. **Check.** It prints the count and the paths. A line starting `failed` means that screen did
   not load and shows as a red tile. Fix the route or the app and run it again. Count the tiles
   against step 1, and name any screen that is missing from the board.
5. **Send.** Send `board.png` with SendUserFile and give the path to `board.html` in the reply.
   Say the count in one line. Filip clicks a tile in `board.html` for the full size view and steps
   with the arrow keys.

## When it runs

- Filip types /design or asks for a board or an overview. It runs at any screen count.
- A project with more than 5 screens reaches the preview step. The board goes out before the
  preview link, then the link follows in the same reply.
- `/newui` finishes and screen six exists. Run it once there, after the last screen is accepted.
- One board per change set. Run it again when a screen was added, removed or redesigned.

## Rules

- The board never replaces the preview link, and the preview link never replaces the board on a
  project this size. Both go out, board first.
- Never a phone width. A phone item in the ask is dropped with one line saying so.
- Never edit the app to make the board look better. It shows what is built.
- Name the screens the way Filip says them, not the way the files are named.
