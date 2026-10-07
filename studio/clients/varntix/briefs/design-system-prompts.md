# Varntix design system pass, prompt pack

Source file https://www.figma.com/design/rzv5g0IB5v0RKTBwWjWxI4/Varntix?node-id=42-2

Paste one prompt per turn, in order. Each one ends on a stop. Task `varntix-1` in `../tasks.md`
tracks the steps.

## How Remittix Earn and Markets were done

Rebuilt from the repos `mravicfilip-tech/remittix-earn` and `mravicfilip-tech/remittix-market`, and
from the Remittix Dashboard session.

- Code came first. Each app was built and deployed, and its CSS token layer was the single
  source of truth.
- Playwright scripts then measured the running app in both themes at 1920, 1024 and 390.
  `scripts/discover.mjs` found the tokens, type, paddings, gaps, radii and heights actually
  rendered. `scripts/measure-components.mjs` measured every component in every state.
  `scripts/capture-screens.mjs` shot every screen state as the reference.
- Claude built a new Figma file from those numbers over several sittings, never touching the
  source design file. Filip's Markets kickoff was "create a new file and export trade and
  portfolio like we did remittix earn figma same manner, same principle".
- The file layout was Cover, Getting Started, Foundations, Components, then one Screens page
  per area plus Tablet and mobile.
- Variables were Primitives (hidden from pickers), Color with Dark and Light modes where every
  value aliases a primitive, Spacing, Radius and Size. Code syntax on each variable named its
  CSS custom property.
- Text styles were grouped Display, Heading, Body, Label, Number, Nav, Menu and Caption. Effect
  styles covered elevation and glow.
- Components sat in numbered Sections, each with a Dark library and a Dark and Light showcase,
  built in auto layout with every value bound and a description on every component.
- Screens were built from instances, each state a column with Dark above Light.
- The audit closed at 0 raw values, 0 text without a style, 0 default layer names, 0 detached
  instances, 0 clipped or overflowing text at 1024 and 390, contrast under 4.5 to 1 listed, and a
  scan of every text layer, name and description for code paths or URLs.
- `design/figma-state.json` recorded the file key, every page, Section, collection and component
  node id, the counts, the audit and the next steps, so each sitting picked up where the last
  one stopped.
- Drift found in Figma was fixed back in the app.

## What is different about Varntix

- There is no app. The source is a design file, so the clean source of truth has to be built
  before anything can be measured.
- The source file is heavy. The Website page has about 12,700 layers, 208 instances and 13
  components. The Dashboard page has about 5,300 layers, 169 instances and 55 components. 48%
  and 78% of their frames carry default names.
- Colour is a drawn swatch frame (6999-5071), not variables. One text style is published,
  Dashboard/Body 14, Noto Sans.
- Dashboard (6767-1586 and 7873-1373), Assets (6767-2374 and 6778-15470) and Insights
  (7004-7817 and 7004-8243) each exist twice, and nothing marks which one is current.
- Phone frames are 440 wide, not 390.

Filip ruled on 2026-10-07 that the deliverable is the new Figma file, rebuilt fresh on design
system rules. No app comes first. The source audit replaces the Remittix measuring scripts, so its
approved scales are the single source of truth, and the messy auto layout gets fixed by
rebuilding cleanly in the new file, never by editing the source file. A coded prototype can follow
from the finished file as its own concept.

## Prompt 0, kickoff answers

Reply to the kickoff questions in chat. The prompts below assume the defaults.

## Prompt 1, audit the source file, read only

```
Varntix design system pass, phase 1. Read only, change nothing in Figma.

Source https://www.figma.com/design/rzv5g0IB5v0RKTBwWjWxI4/Varntix, pages Dashboard (55-728)
and Website (42-2). Dashboard first. The Website gets the same treatment as a second concept.

1. List every top level frame on the Dashboard page with id, name, size and what it is. Mark
   each one current, stale duplicate, exploration or annotation. Where two frames share a name,
   say which looks newer and why, and leave the call to me.
2. For the current frames, pull every value actually used. Fills, strokes, families, sizes,
   weights, line heights, tracking, radii, gaps, paddings, shadows and blurs, each with a use
   count. Cluster near duplicates, such as 14 and 14.5, or 373737 and 383838, and propose one
   scale for each.
3. Name every repeated structure that should be a component, the frames it appears in, and the
   states, sizes and themes it really shows.
4. List the screens and states the flows need, including the ones the file never drew, such as
   errors, empty states and loading.
5. Shoot every current frame into studio/clients/varntix/briefs/source/ as the reference set.

Write it to studio/clients/varntix/briefs/audit.md. Then stop and send me only the open
questions.
```

## Prompt 2, sitting 1, the new file and foundations

```
Varntix design system pass, phase 2. Create a new Figma file, Varntix Design System, same
manner and same principle as Remittix Earn and Remittix Markets.

Pages Cover, Getting Started, Foundations, a COMPONENTS divider, Components, a SCREENS divider,
one Screens page per area, and Tablet and mobile. Cover on the same template as the Remittix
covers.

Foundations from the approved scales in audit.md only.
- Primitives, hidden from pickers.
- Color with the agreed modes, every value an alias of a primitive.
- Spacing, Radius and Size.
- Code syntax on every variable naming a --vx-* property, so a later build can use the same names.
- Text styles grouped Display, Heading, Body, Label, Number, Nav, Menu and Caption.
- Effect styles for the elevation and glass actually used.
- A Foundations page with a labelled row for each.

Record every id in studio/clients/varntix/design/figma-state.json, the same shape as the Remittix Earn one. Screenshot the Foundations page and stop.
```

## Prompt 3, sitting 2, components

```
Varntix design system pass, phase 3. Components in numbered Sections, as in the Earn file.

Each Section gets a library frame and a showcase beside it, both Dark. Build from
the source frames listed in audit.md section 5, values snapped to the scales, in this order. Marks and icons, buttons, chips and status, inputs and
selects, nav rail and top bar, cards and stat tiles, tables, tabs and stepper, dialogs, empty
states, then page level blocks.

Auto layout all the way down. Every fill, stroke, gap, padding, radius and text bound to a
variable or a style. Variants for the states the source draws, plus the missing states audit.md section 6 lists. A description on every
component. Layer names that describe the layer.

Stop after Marks, Buttons and Chips so I can approve the pattern, then finish the rest.
```

## Prompt 4, sitting 3, screens

```
Varntix design system pass, phase 4. Screens from instances.

One Screens page per area from audit.md. Each state a column, Dark only by the 2026-10-07 ruling. Desktop at
1920 with a 1080 minimum height, then tablet and phone on the Tablet and mobile page. Match the
reference shots in briefs/source, and list every known difference with its cause, such as a snapped value.
```

## Prompt 5, sitting 4, audit

```
Varntix design system pass, phase 5. Audit the new file and close it.

Target 0 raw fills, strokes, gaps, padding and radius, 0 text without a style, 0 default layer
names, 0 detached instances, 0 components without a description, 0 clipped or overflowing text
at the tablet and phone widths. List every contrast pair under 4.5 to 1 with a proposed fix.
Scan every text layer, layer name, variable and style description for code paths, selectors,
repo names and URLs. Check the file's memory and flatten anything that repeats thousands of
layers, like the Earn dot grid.

Write the before and after counts to figma-state.json and stop for my review.
```

## Gotchas from the Remittix files

- Paint opacity on a variable-bound paint does not survive combineAsVariants or carry into
  instances. Translucent colours need their own tokens.
- Layers inside instances cannot be resized. A bar that changes length is a variant set.
- Hidden sublayers inside an instance are not returned by children. Reach them by id or by
  name, never by index.
- Tab rows with an underline over a rule need first-on-top stacking.
- The plugin API cannot set the file thumbnail. Set the Cover by hand.
- A font that is not in the Figma team needs a stand-in, named in the style description.
