# Review rubric

This file is the whole brief, nothing else needs loading. Every check below produces a
finding or it is not here. Check the widths the client README's Widths line names. With no such
line, desktop only, 1440 by default and 1280 allowed. Check, shoot or report a phone layout only
when that line names a phone width.

## Severity scale

- **sev 1** blocks a client showing it. Accessibility fail, broken function, regression,
  brand violation, wrong client.
- **sev 2** visible defect. A client would notice it, but the work can still be shown.
- **sev 3** polish.

The score is 10 minus 3 per open sev 1, 1 per open sev 2, 0.25 per open sev 3. A pass is no
open sev 1. Do not compute a score yourself. The ledger does.

## How to judge

- Read the work cold, as if it came from an outside agency this morning. Knowing why
  something is on screen is never a reason to leave it out.
- Measure, never describe. "13px, 3.9 to 1, fails AA" is a finding. "Text is small" is not.
- Contrast comes from colour values by the WCAG relative luminance formula, with translucent
  layers composited first. Pixel sampling reads anti-aliased edges low, so say which you used.
- Test focus with real Tab presses. Programmatic `el.focus()` does not trigger
  `:focus-visible` and gives a false "no focus ring".
- A claim you did not drive is not a finding. If you could only infer it, say `unverified`
  in the finding text and keep it at sev 3 at most, unless the code makes it certain.
  One exception. A removed or changed layout rule (width, height, display, position, flex or
  grid) that reaches a route outside the ask is sev 1 `unverified` until a before and after
  shot of that route clears it. The main thread shoots that route before the card.
- Client work is anything built for a client or a pursuit, with or without a folder under
  `clients/`. Personal tools and experiments with no client cap every accessibility finding at
  sev 2.
- You get a diff pack, not the whole diff. Files with stat only are read from disk when a
  check needs them. Open shot images only for routes with a diff or a failed check.
- Anything on the diff that was not asked for is judged under regression, however good it
  looks. Something left alone on purpose is not a finding.
- A defect that was already there before the change and is outside the diff is reported at
  sev 3 with `pre-existing` at the start of the text, unless it sits on a route Filip will
  click, then it keeps its normal severity.

## 1. Accessibility

Client work. A confirmed WCAG 2.2 AA failure is sev 1. Each check says where it drops.

- **Contrast.** Text under 4.5 to 1, or under 3 to 1 for large text (24px, or 19px bold) and
  for essential UI such as input borders, icons that carry meaning and focus rings. Sev 1 on
  body text, control labels, nav, form text and anything repeated. Sev 2 for one secondary or
  helper label.
- **Invisible text.** Text under 1.5 to 1 against its composited background is its own class,
  always sev 1. Sweep every text node, not only the brand colours. A headline in the same
  colour as its artboard is absent, not low contrast.
- **Type floor.** Working text under 14px, meaning anything read to do the job, is sev 2.
  Under 12px is sev 1. Legal footnotes and badges are exempt only if not needed to act.
- **Focus visible.** Every Tab stop shows a clear indicator, at least 3 to 1 against what is
  around it. Sev 1 when a control has none, or when a style change removed one that existed
  before. Sev 2 for a double ring or a ring clipped by its container.
- **Keyboard.** Every control reachable and operable with keys alone. Sev 1 for a trap (focus
  cannot leave, Escape does nothing in a modal, drawer or date picker), for a control Tab
  skips, and for a custom select, menu or picker that cannot be driven with arrows, Enter and
  Escape. Check modals, drawers, menus, calendars and carousels first, they fail most.
- **Targets.** Interactive elements under 24 by 24 are sev 1 (WCAG 2.5.8). Controls under 32px
  tall are sev 2, Filip rejects them on sight.
- **Names and roles.** An icon-only control with no accessible name is sev 2. A div styled as a
  button with no role and no key handler is sev 1. Inputs without a label are sev 2. An error
  shown by colour alone is sev 2.
- **Images and structure.** Meaningful image with no alt is sev 2. A skipped heading level or a
  page with no `main` landmark is sev 3.
- **Motion.** Anything that flashes, auto advances or times out with no control is sev 2.

## 2. Function

Drive the app with the browser. Do not read the DOM and assume.

- **Dead control.** A button, toggle, link or menu item that changes nothing. Sev 1 when it is
  on the primary path or Filip named it, sev 2 otherwise. The handler existing is not proof,
  click it and watch for a DOM, URL or state change.
- **Broken route or state.** A 404, a crash, a blank screen, an uncaught exception or a console
  error on any route in scope. Sev 1.
- **Missing states.** No empty, loading or error state where data can be absent. Sev 2.
- **Wrong data shape.** A list that ignores its sort or filter label, a count that disagrees
  with its rows, a selected option the editor does not render, copy promising N things where
  N minus 1 render. Sev 2, sev 1 if it is the main point of the screen.
- **Coverage.** Every route, state, CTA and content block the ask names must exist. List
  required against found. Each missing item is sev 1.
- **Deploy.** When a preview URL is claimed, it loads and matches localhost. A URL that
  fails or shows an older build is sev 1.
- **Build health.** The project's own lint, typecheck or tests, when read-only, must pass. A
  failure is sev 2, sev 1 when it breaks the build.

## 3. Regression against the before shots

Compare each after shot with its before shot at the same width. `shoot.mjs --compare` reports
changed pixels and changed area. Open both images for every route with a diff.

- **Unnamed visible change.** Anything that moved, resized, recoloured or vanished and was
  not in the ask. A changed height, a removed width rule, a lost CTA, a tile turned into a
  slab of another colour, a scrim that changed colour. Sev 1.
- **Removed content or control.** Something present before and gone after, with no word in the
  ask. Sev 1.
- **Small shift.** Under 4px of movement and no visible effect. Sev 3, name the element.
- **Side effects of a sweep.** When the diff changes a shared token, class or rule, check every
  route that uses it, not only the one the ask names.
- **No before shot.** Say so in one sev 2 finding and judge the diff by reading it. Do not
  invent a comparison.
- **No route to drive.** When the app cannot be run or no route is known, say so in one sev 2
  finding. Every check that needs driving is then sev 3 and `unverified`.

## 4. Brand fidelity

Read the README sections you were given, Brand, Rules that never bend and Accessibility. Match
the client's palette, logo treatment and type exactly. For a client with a brand system they are the client's property.
With no client folder under `clients/`, skip the palette, logo, type and expression checks and the
taste log in section 5, and say so once. Wrong client and vendor names still apply.

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
  title, alt text, comments or served source. Always sev 1. Check the bundled JS and CSS
  too, they ship even when nothing renders them.
- **Agency or vendor names.** The freelancer's own name, a tool name or a partner name on a client facing
  build. Sev 1 on a white label build, sev 2 otherwise.
- **Drift from the live reference.** Structure copied from source while the rendered look was
  invented. Compare with the captured reference when one exists. Sev 2 each.

## 5. Taste

Read `studio/clients/<client>/taste.md`. Newest entries win. A superseded entry is not a rule.

- **Repeats a REJECTED entry.** Name the entry. Sev 1.
- **Contradicts an ACCEPTED entry.** Sev 2.
- **Filip's standing rejections.** Each is sev 2 unless the taste log says otherwise.
  Cards inside cards. An element cut off at a container edge. Mismatched control heights with
  no gap between groups. A native browser select or `title=` tooltip showing through. Ragged
  alignment across sibling cards. The same number printed twice. Clip art or generated vector
  imagery. A narrow centred column on a screen that should run full width. A partial height
  stripe, a coloured card edge or a translucent tint on a card. Bold display headlines.
  Stats boxed up instead of shown openly. The percent icon.
- **Order and wording.** Card element order is badge or status, title, description, price,
  primary action. Icons must match their verb. A labelled button beats an icon-only one when
  there is room. Tooltip copy is sentence case. Each is sev 3.
- **Filters and taxonomy hidden** behind a click, dropdown or drawer on load. Sev 2.
- **Weak states.** Hover, focus or active identical to default on an interactive control. Sev 2
  on a primary control, sev 3 elsewhere. Interactive things need icons, hover states and
  transitions.

## 6. Consistency of controls

Compare siblings on the same screen and across screens.

- **Same job, different look.** Two buttons, inputs or toggles doing one job with different
  height, radius, padding, weight or colour. Sev 2.
- **Height and alignment.** Controls in one row with different heights, baselines that do
  not line up, or a missing gap between groups. Sev 2.
- **State parity.** One control family has hover and focus, its sibling does not. Sev 2.
- **Shared component bypassed.** A hand built copy of a component that exists in the kit, or
  one tile drawing a CSS mock where its siblings show real content. Sev 2.
- **Icon mismatch.** An icon that does not match its verb, or a mix of icon sets. Sev 3.

## 7. Cold pass defects

Things a stranger sees at once and the builder no longer notices.

- **Demo scaffolding.** Walkthrough cards, "Flow N" badges, "start here" chips, demo bars,
  "click the headline to try it". Sev 1 on a landing page or dashboard, sev 2 elsewhere.
- **Credentials or people in the build.** A password, a contract reference or a real name in
  served source or printed on a sign in page. Sev 1.
- **Placeholder and debug.** Lorem ipsum, "TODO", test data names, console logs left in, dead
  code that renders. Sev 2.
- **Website chrome in an app shell.** A marketing footer or hero copy inside a signed in
  shell. Sev 2.
- **Duplicate navigation.** Two navs for one job, or several labels that land on one
  destination. Sev 2.
- **Clipped content.** An ancestor with `overflow` hidden cutting off its child by more than
  1px. Sev 2.
- **Hover on the inert.** A hover effect on an element that does nothing when clicked.
  Sev 3, sev 2 when it repeats across a grid.
- **Identity.** One header showing three identities, or a signed in name that does not reach
  the surface meant to carry it. Sev 2.

## Not findings

- Anything phone or mobile, unless the client brief names it.
- Praise. Do not list what is good.
- Scope questions for Filip, such as "should this be redesigned". Say nothing.
- Duplicates. One finding per defect, with every place it occurs named in `where`.

## Output

Return JSON lines and nothing else, one defect per line, most severe first.

```
{"sev":1,"where":"src/DatePicker.tsx:88","what":"keyboard trap in month buttons, Tab never leaves the grid"}
{"sev":2,"where":"/admin","what":"KPI card 96px tall, 80px in the before shot, not in the ask"}
```

- `sev` is 1, 2 or 3 from the scale above.
- `where` is `file:line` or a route, plus the element when it helps.
- `what` is one line with the measurement, the expected value and the actual value.
- No findings means return the single line `{"none":true}`.
- At your token or tool call cap, return the findings you have, then one last line
  `{"cap":true,"unchecked":"<routes or sections not done>"}`. Stop. Never restart.

## Re-check mode

When the prompt carries an open findings list and a new diff, do not grade the change again.
For each listed id return `{"id":"F1","status":"fixed|partly|open"}` with a few words of
evidence in `what`. Read only the files in the new diff, and drive only the routes they touch.
Add a new finding only when the new code caused a sev 1, and return it as a normal finding
line. Sev 2 and sev 3 defects found in a re-check are not recorded, so do not return them.
