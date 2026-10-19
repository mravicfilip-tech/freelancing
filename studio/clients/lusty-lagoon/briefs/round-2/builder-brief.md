# Builder brief, round 2, lusty-lagoon

Filip, 2026-10-19. "Build everything, no interruptions." Every desktop screen in the Figma file gets
built in React on the flat system the wallet already uses. This brief is what each builder reads
before touching code. The main thread owns the shell, the routes, the landing page and the lobby.

## Where things are

- App `lusty-lagoon/` in the freelancing repo. Vite, React 19, TypeScript, Tailwind 3 with the
  studio base layout preset, Radix primitives, Phosphor icons.
- Figma copy, file key `fGqIuwR8pailgKcy4UFfNg`. Node ids match the dump below.
- Frame structure and every text layer, `scratchpad/figma/meta-83-53.xml` in the session
  scratchpad. Text layer names are the copy.
- Images and icons pulled per frame, `scratchpad/figma-copy/assets/<frame>/`, with `frame.*` as
  the full frame render and `sheet.png` as a contact sheet. `index.json` maps files to nodes.
- Rules to read first, `studio/clients/lusty-lagoon/README.md`, `taste.md` and `glossary.md`.

## Rules that decide the look

- Tokens only. Colours are the classes `page sunken panel raised line field ink ink2 ink3 accent
  brand gold on-gold tonal tonal-line pending success danger`. No hex in components.
- The scale is replaced, not extended. Spacing keys 0 0.5 1 2 3 4 6 8 12 16 24. Heights h-4 h-5
  h-6 h-8 h-9 h-10 h-11 h-full h-screen. Widths also w-5 w-9 w-10 w-11. Text text-12 14 16 18 20
  24 28 32 40 48. Radius rounded (4) lg (8) xl (12) 2xl (16) 3xl (24) full. A class off these
  lists does not exist and silently does nothing.
- 14px is the floor for anything read to act. 12px only for badges, captions and legal lines.
- One gold primary button per view. Secondary is tonal, tertiary is text. Use `Button`.
- No gradients on repeated surfaces, no text glow or text-shadow, no bevels, no inset shadows, no
  scattered tilted coin tiles. One low contrast gradient is allowed only on hero art.
- Selection shows a 2px accent border, a raised fill and a check. Never a colour shift alone.
- Status always pairs an icon with a word. Errors say what went wrong and what to do next.
- Copy is sentence case, plain, from the Figma where it is real, rewritten where the Figma is
  placeholder or wrong. Use the glossary words.

## Parts to reuse, never rebuild

`src/components/ui/` holds Button, Tabs, RadioCards, Field, PasswordField, CopyField, Select,
Checkbox, Switch, Accordion, Popover, Menu, Tooltip, Callout, StatusChip, Progress, Stepper,
Skeleton, Message, Avatar, SectionHeader, GameTile, Rail, Logo and MethodLogo. Never hand roll a
menu, dialog, select, popover, tabs, tooltip, checkbox or switch. A part that is missing gets built
inside your own feature folder, and your report names it so the main thread can lift it.

## What every screen needs

- The Figma frame's content and structure, on the flat system.
- Every state. Loading, empty, error with a next step, long text that wraps or truncates, no
  access where it applies, and a very large list where a list exists. A `?state=` URL switch for
  each, so shots can reach it.
- Real looking mock data in your feature folder, names, amounts and dates that vary.
- Keyboard reachable, visible focus, labels on every input, alt text or `alt=""` on every image.

## Images

Copy only the images your screens use from the assets folder into
`lusty-lagoon/public/art/<slice>/`, with names that say what they are. Shrink them first with
`python3 -I` and PIL, longest edge at most twice the size it shows at, saved as `.webp` quality 80,
or `.png` when it needs transparency and is under 300KB. Never commit a raw 2048px PNG.

## Boundaries

- Work in your own feature folder, `src/features/<slice>/`, plus `public/art/<slice>/`.
- Do not edit `App.tsx`, anything in `src/components/`, the wallet feature, `tokens.css`,
  `index.css` or `tailwind.config.cjs`. The main thread wires routes and the shell.
- Export your pages and panels from `src/features/<slice>/index.ts`.

## Self-check before you report

1. `npm ci` once in your worktree's `lusty-lagoon/`, then `npm run build` passes with no errors.
2. `node ../studio/scripts/baselint.mjs --repo .. --client lusty-lagoon` reports nothing off the
   scale on your lines, or you fixed it.
3. Commit on your branch with a plain message that names the screens.

Report in 5 lines or fewer. Screens built, routes they expect, states covered, parts you had to
build that belong in `components/ui`, anything you could not match and why.
