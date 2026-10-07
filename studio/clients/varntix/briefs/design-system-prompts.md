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

So the order is the Remittix order with two steps in front, audit the source file and build the
app from it. The messy auto layout gets fixed by rebuilding cleanly, in code and then in the new
file, never by editing the source file.

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

## Prompt 2, the Varntix dashboard in code

```
Varntix design system pass, phase 2. Build the dashboard as a running app.

Folder varntix/ at the repo root, on this session's branch. Same shape as remittix-earn and the
Remittix dashboard. React, Vite, TypeScript, one token layer of CSS custom properties under
data-theme, shared parts in their own files, page sheets that never redefine a token, mock data
in one file per module.

Tokens come from the approved scales in audit.md, named --vx-*. Match the source frames for
content, layout and brand. Where the source is inconsistent, take the scale value and list
every place you snapped.

Routes for every current frame in audit.md, with the states it listed, plus ?theme= and
?empty=1 switches. Run the build, click every flow, shoot each route against its source frame
with studio/scripts/shoot.mjs, deploy a Vercel preview and put the URL on varntix-1. Stop there
so I can react before anything goes into Figma.
```

## Prompt 3, measure the app

```
Varntix design system pass, phase 3. Measure the running app the way we did for Remittix Earn.

Port scripts/discover.mjs, measure-components.mjs and capture-screens.mjs from remittix-earn
into varntix/scripts and point them at the Varntix routes. Run them in both themes at the
client widths. Write design/discovery.json, design/components-measure.json and the reference
screens under varntix/design/. Start design/figma-state.json with the same shape as
remittix-earn/design/figma-state.json.

Report what the scripts found that the token layer does not name, then stop.
```

## Prompt 4, sitting 1, the new file and foundations

```
Varntix design system pass, phase 4. Create a new Figma file, Varntix Design System, same
manner and same principle as Remittix Earn and Remittix Markets.

Pages Cover, Getting Started, Foundations, a COMPONENTS divider, Components, a SCREENS divider,
one Screens page per area, and Tablet and mobile. Cover on the same template as the Remittix
covers.

Foundations from discovery.json only.
- Primitives, hidden from pickers.
- Color with the agreed modes, every value an alias of a primitive.
- Spacing, Radius and Size.
- Code syntax on every variable naming its --vx-* property.
- Text styles grouped Display, Heading, Body, Label, Number, Nav, Menu and Caption.
- Effect styles for the elevation and glass actually used.
- A Foundations page with a labelled row for each.

Record every id in figma-state.json. Screenshot the Foundations page and stop.
```

## Prompt 5, sitting 2, components

```
Varntix design system pass, phase 5. Components in numbered Sections, as in the Earn file.

Each Section gets a library frame in Dark and showcases in Dark and Light beside it. Build from
components-measure.json in this order. Marks and icons, buttons, chips and status, inputs and
selects, nav rail and top bar, cards and stat tiles, tables, tabs and stepper, dialogs, empty
states, then page level blocks.

Auto layout all the way down. Every fill, stroke, gap, padding, radius and text bound to a
variable or a style. Variants only for states the app renders. A description on every
component. Layer names that describe the layer.

Stop after Marks, Buttons and Chips so I can approve the pattern, then finish the rest.
```

## Prompt 6, sitting 3, screens

```
Varntix design system pass, phase 6. Screens from instances.

One Screens page per area from audit.md. Each state a column, Dark above Light. Desktop at
1920 with a 1080 minimum height, then tablet and phone on the Tablet and mobile page. Match the
capture-screens references, and list every known difference with its cause.
```

## Prompt 7, sitting 4, audit

```
Varntix design system pass, phase 7. Audit the new file and close it.

Target 0 raw fills, strokes, gaps, padding and radius, 0 text without a style, 0 default layer
names, 0 detached instances, 0 components without a description, 0 clipped or overflowing text
at the tablet and phone widths. List every contrast pair under 4.5 to 1 with a proposed fix.
Scan every text layer, layer name, variable and style description for code paths, selectors,
repo names and URLs. Check the file's memory and flatten anything that repeats thousands of
layers, like the Earn dot grid.

Fix drift back in the app, not only in Figma. Write the before and after counts to
figma-state.json, then run /uireview on the app.
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
