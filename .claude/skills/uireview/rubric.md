# Review rubric

Distilled from `studio/foundation/principles.md` and a client prototype checklist. This file is the whole brief. Check the widths the client README's Widths line names. With no such line, desktop only, 1440 by default and 1280 allowed. Check, shoot or report a phone layout only when that line names a phone width.

## Severity scale

- **sev 1** blocks a client showing it. Accessibility fail, broken function, regression,
  brand violation, wrong client.
- **sev 2** visible defect. A client would notice it, but the work can still be shown.
- **sev 3** polish.

The score is 10 minus 3 per open sev 1, 1 per open sev 2, 0.25 per open sev 3. A pass is no
open sev 1. Do not compute a score yourself. The ledger does.

## How to judge

- Read the work cold, as if it came from an outside agency this morning.
- Measure, never describe. "13px, 3.9 to 1, fails AA" is a finding. "Text is small" is not.
- Contrast comes from colour values by the WCAG relative luminance formula, translucent layers
  composited first. Pixel sampling reads edges low, so say which you used.
- Test focus with real Tab presses. Programmatic `el.focus()` does not trigger
  `:focus-visible` and gives a false "no focus ring".
- A claim you did not drive is not a finding. If you could only infer it, write `unverified`
  in the text and cap it at sev 3, unless the code makes it certain. One exception. A removed
  or changed layout rule (width, height, display, position, flex or grid) that reaches a route
  outside the ask is sev 1 `unverified` until a before and after shot of that route clears
  it. The main thread shoots that route before the card.
- Client work is anything built for a client or a pursuit, with or without a folder under `clients/`. Personal tools and experiments with no client cap every accessibility finding at sev 2.
- You get a diff pack, not the whole diff. Read stat only files from disk when a check needs them.
- Anything in the diff that was not asked for is judged under regression, however good it looks.
- A defect already there before the change and outside the diff is sev 3 with `pre-existing`
  first in the text, unless it sits on a route Filip will click, then its normal severity.

## 1. Accessibility

Client work. A confirmed WCAG 2.2 AA failure is sev 1. Each check says where it drops.

- **Contrast.** Text under 4.5 to 1, or under 3 to 1 for large text (24px, or 19px bold) and
  for essential UI such as input borders, icons that carry meaning and focus rings.  Sev 1 on
  body text, control labels, nav, form text and anything repeated, sev 2 for one helper label.
- **Invisible text.** Text under 1.5 to 1 against its composited background is always
  sev 1. Sweep every text node. A headline in its artboard's colour is absent, not low contrast.
- **Type floor.** Working text, anything read to do the job, under 14px (15px where the brand sets it) is sev 2,
  under 12px sev 1. Legal lines and badges are exempt if not needed to act.
- **Focus visible.** Every Tab stop shows a clear indicator, at least 3 to 1 against what is
  around it. Sev 1 when a control has none, or when a style change removed one that existed
  before. Sev 2 for a double ring or a ring clipped by its container.
- **Keyboard.** Every control reachable and operable with keys alone. Sev 1 for a trap (focus
  cannot leave, Escape does nothing in a modal, drawer or date picker), a control Tab skips,
  or a custom select, menu or picker that arrows, Enter and Escape do not drive. Check modals,
  drawers, menus, calendars and carousels first.
- **Targets.** Interactive elements under 24 by 24 are sev 1 (WCAG 2.5.8).
- **Names and roles.** Sev 2 for an icon-only control with no accessible name, an input with no
  label, or an error shown by colour alone. Sev 1 for a div styled as a button with no role and
  no key handler.
- **Images and structure.** Meaningful image with no alt is sev 2. A skipped heading level or a
  page with no `main` landmark is sev 3.
- **Motion.** Anything that flashes, auto advances or times out with no control is sev 2.

## 2. Function

Drive the app with the browser. Do not read the DOM and assume.

- **Dead control.** A button, toggle, link or menu item that changes nothing. Sev 1 when it is
  on the primary path or Filip named it, sev 2 otherwise. A handler is not proof, click it
  and watch for a DOM, URL or state change.
- **Broken route or state.** A 404, crash, blank screen, uncaught exception or console error
  on any route in scope. Sev 1.
- **Wrong data shape.** A list that ignores its sort or filter label, a count that disagrees
  with its rows, a selected option the editor does not render, copy promising N where N minus 1
  render. Sev 2, sev 1 if it is the main point of the screen.
- **Coverage.** Every route, state, CTA and content block the ask names must exist. Each
  missing item is sev 1.
- **Deploy.** A claimed preview URL must load and match localhost. A failing URL or an older
  build is sev 1.
- **Build health.** The project's own read-only lint, typecheck or tests must pass. Sev 2,
  sev 1 when it breaks the build.

## 3. Regression against the before shots

Compare each after shot with its before shot at the same width. `shoot.mjs --compare` reports
changed pixels and changed area. Open both images for each route with a diff.

- **Unnamed visible change.** Anything that moved, resized, recoloured or vanished and was
  not in the ask. A changed height, a removed width rule, a lost CTA, a tile turned into a
  slab of another colour, a scrim that changed colour. Sev 1.
- **Removed content or control.** Present before, gone after, not in the ask. Sev 1.
- **Small shift.** Under 4px of movement and no visible effect. Sev 3, name the element.
- **Sweep side effects.** A changed shared token, class or rule reaches every route that uses it.
- **No before shot.** One sev 2 finding, then judge the diff by reading it. Never invent a comparison.
- **No route to drive.** One sev 2 finding. Every check that needs driving is then sev 3 and `unverified`.

## 4. Brand fidelity

Match the palette, logo treatment and type in the README sections you were given exactly. With no client folder under `clients/`, skip the palette, logo, type, expression and section 5 checks and say so once.
Wrong client and vendor names still apply.

- **Off palette.** A colour that is not a token in the README. Sev 1 on a primary surface,
  button, logo area or large fill, sev 2 for one small element. Give the hex found and the
  token expected.
- **Logo and wordmark.** Wrong lockup, recoloured, stretched, no clear space, or another
  client's mark. Sev 1.
- **Type.** Wrong family, or a weight the brand does not use. Display headlines are light, not
  bold. Sev 2, sev 1 when it is the page title or hero.
- **Improvised expression.** Gradients, shadows, illustration style or iconography the brand
  does not use. Sev 1 when it dominates a screen, sev 2 otherwise.
- **Wrong client.** Another client's name, colours, data or imagery in rendered text, the page
  title, alt text, comments or served source. Always sev 1. Check the bundled JS and CSS too.
- **Agency or vendor names.** The freelancer's own name, a tool name or a partner name on a client facing
  build. Sev 1 on a white label build, sev 2 otherwise.
- **Drift from the live reference.** Structure copied from source while the rendered look was
  invented. Compare with the captured reference when one exists. Sev 2.

## 5. Taste

Read `studio/clients/<client>/taste.md`. Newest entries win. A superseded entry is not a rule.

- **Repeats a REJECTED entry.** Name the entry. Sev 1.
- **Contradicts an ACCEPTED entry.** Sev 2.
- **Filip's standing rejections.** Each is sev 2 unless the taste log says otherwise.
  Cards inside cards. An element cut off at a container edge. A native browser select or `title=` tooltip showing through. Ragged
  alignment across sibling cards. The same number printed twice. Clip art or generated vector
  imagery. A narrow centred column on a screen that should run full width. A partial height
  stripe, a coloured card edge or a translucent tint on a card. Bold display headlines.
  Stats boxed up instead of shown openly. The percent icon.
- **Order and wording.** Card element order is badge or status, title, description, price,
  primary action. Icons must match their verb. A labelled button beats an icon-only one when
  there is room. Tooltip copy is sentence case. Each is sev 3.
- **Filters and taxonomy hidden** behind a click, dropdown or drawer on load. Sev 2.
- **Weak states.** Hover, focus or active identical to default on a control. Sev 2 on a primary
  control, sev 3 elsewhere.

## 6. Consistency of controls and base layout

Compare siblings on the same screen and across screens. The scale is `foundation/base-layout.css`.
A brand differs only through `studio/clients/<client>/base-override.json`. A conflicting README rule is
no finding. Grade from the `baselint` block in the pack with no extra round,
one finding per file and property. Ignore a warning on a line the diff did not add.

- **Same job, different look.** Two controls doing one job with different height, radius,
  padding, weight or colour. Controls in one row on two heights or tiers, baselines that do not
  line up, or no gap between groups. Sev 2.
- **State parity.** One control family has hover and focus, its sibling does not. Sev 2.
- **Mock tile.** One tile drawing a CSS mock where its siblings show real content. Sev 2.
- **Type and line height.** Size off 12 14 16 18 20 24 28 32 40 48 (from 15 where the brand sets it), such as 13, 15
  or a fraction, on working text. Sev 2, sev 1 under 12. Line height off the 4 grid or not paired
  to its size, sev 3.
- **Spacing.** Padding, margin or gap off 4 8 12 16 24 32 48 64 96 (2 for hairlines), or a
  fraction. Sev 3, sev 2 when it breaks sibling alignment.
- **Control height and radius.** Height off 32, 36, 40 or 44, sev 2, under 24 sev 1. Radius
  outside the brand set, or two radii on one control family, sev 3, sev 2 when siblings differ.
- **Icons.** One that does not match its verb, a mix of sets, a size off 16, 20, 24 or 32, or
  a stroke not 1.5. Sev 3.
- **Shadow, z-index, focus.** Shadow outside the four levels, or z-index off 0 to 60 by tens,
  sev 3. Focus ring under 2px or under 3 to 1, sev 1 as in section 1.
- **Sticky.** From the `interact` block of the shots. Content painting over a pinned bar, or a
  pinned bar leaving its pin line at scroll 600, sev 1. Leaving view only at the bottom, or a
  translucent pinned bar, sev 2.
- **Stacking.** A menu, popup or combobox under a pinned bar, clipped by an ancestor or off
  screen, sev 1. Taller than the viewport, ignoring Escape, or focus not returning, sev 2.
- **Hover.** A hover that moves the control or its neighbours by 1px or more, or an underline
  on a button, sev 2. No hover change at all on a control, sev 3.

## 7. Cold pass defects

Things a stranger sees at once and the builder no longer notices.

- **Demo scaffolding.** Walkthrough cards, "Flow N" badges, "start here" chips, demo bars,
  "click the headline to try it". Sev 1 on a landing page or dashboard, sev 2 elsewhere.
- **Credentials or people in the build.** A password, contract reference or real name in served source or on a sign in page. Sev 1.
- **Placeholder and debug.** Lorem ipsum, "TODO", test data names, console logs left in, dead
  code that renders. Sev 2.
- **Website chrome in an app shell.** A marketing footer or hero copy inside a signed in
  shell. Sev 2.
- **Duplicate navigation.** Two navs for one job, or several labels that land on one
  destination. Sev 2.
- **Clipped content.** `overflow` hidden cutting off a child by more than 1px. Sev 2.
- **Hover on the inert.** A hover effect on an element that does nothing. Sev 3, sev 2 across a grid.
- **Identity.** One header showing three identities, or a signed in name missing. Sev 2.

## 8. Hierarchy and states

From the `hierarchy` block of the shots, and by driving each view.

- **Primary action.** More than one filled primary action in a view, or no clear primary. Sev 2.
- **Heading levels.** A skipped level, or every heading at one level. Sev 3.
- **Missing states.** No empty, loading or error state where data can be absent. Sev 2.

## 9. Acceptance criteria and task walkthrough

From the criteria list and the `walk.mjs` results in the pack.

- **Unmet criterion.** Each acceptance criterion the build does not meet. Sev 1.
- **Dead end.** A step of a job that leads nowhere, or a job that cannot finish. Sev 1.
- **Click count.** A job taking far more clicks than the task needs, for example 3 or more over
  the shortest route. Sev 2, give both counts.

## 10. Copy

Judge against `studio/clients/<client>/glossary.md` when it exists.

- **Unclear verb.** A button or link whose label does not say what happens, such as "Submit",
  "Go" or "OK" on a consequential action. Sev 3, sev 2 on the primary action.
- **Inconsistent term.** Two words for one thing, or a term that departs from the glossary.
  Sev 3, sev 2 when both show on one screen.
- **Error without a next step.** An error that does not say what to do. Sev 2, sev 3 for a
  hint or helper line.

## 11. Golden drift and kit duplication

- **Golden drift.** A type, spacing, radius, colour or control value that departs from the
  golden screens in the `golden.mjs compare` output, with no ruling in `taste.md`. Sev 2.
- **Kit duplication.** A new control or card that duplicates a kit item. Sev 3. Name the kit item.

## Not findings

- Anything phone or mobile unless the client brief names it, praise, and scope questions for Filip.
- Duplicates. One finding per defect, every place named in `where`.

## Output

Return JSON lines and nothing else, one defect per line, most severe first.

```
{"sev":1,"where":"src/DatePicker.tsx:88","what":"keyboard trap in month buttons, Tab never leaves the grid"}
```

- `sev` is 1, 2 or 3 from the scale above.
- `where` is `file:line` or a route, plus the element when it helps.
- `what` is one line with the measurement, the expected value and the actual value.
- No findings means return the single line `{"none":true}`.
- At your token or tool call cap, return the findings you have, then one last line
  `{"cap":true,"unchecked":"<routes or sections not done>"}`. Stop. Never restart.

## Re-check mode

With an open findings list and a new diff, do not grade the change again. For each id return `{"id":"F1","status":"fixed|partly|open"}` with a few words of
evidence in `what`. Read only the files in the new diff, and drive only the routes they touch.
Add a new finding only when the new code caused a sev 1, and return it as a normal finding
line. Sev 2 and sev 3 defects found in a re-check are not recorded, so do not return them.
