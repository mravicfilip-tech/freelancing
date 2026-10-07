# Varntix design system pass, prompt pack

Source file https://www.figma.com/design/rzv5g0IB5v0RKTBwWjWxI4/Varntix?node-id=42-2

Paste one prompt per session turn, in order. Each prompt ends on a stop, so nothing runs past a
point where Filip has to decide. Task `varntix-1` in `../tasks.md` tracks the steps.

## What the file holds today

Read from the Figma metadata on 2026-10-07, before any edit.

- Two pages. Website (node 42-2) and Dashboard (node 55-728).
- Website has about 12,700 layers. 5,228 frames, 208 instances, 13 components.
- Dashboard has about 5,300 layers. 2,199 frames, 169 instances, 55 components.
- 2,505 of the Website frames and 1,720 of the Dashboard frames carry default names such as
  "Frame 2147230489" or "Group 1597884977". That is 48% and 78%.
- Colour lives in a drawn swatch frame (Color Palette, 6999-5071), not in variables. Swatches read
  000000, 373737, 7D7D7D, FFFFFF, 7DCD85, 182119, 53A7FF, 4374FA, DAC197.
- One text style is published, Dashboard/Body 14, Noto Sans Regular 14, line height 100%,
  tracking minus 4%.
- Several screens exist twice with the same name, Dashboard (6767-1586 and 7873-1373), Assets
  (6767-2374 and 6778-15470), Insights (7004-7817 and 7004-8243). Which one is current is not
  marked.
- Mobile frames are drawn at 440 wide, desktop at 1920, the revision doc and Lead Gen LP at 1728.

## Before prompt 1

Duplicate the Figma file, or open a Figma branch, and use that link in every prompt below. The
cleanup writes into the file. Doing it in the client's working file means a bad pass lands on
their only copy.

## Prompt 1, audit, read only

```
Varntix design system pass, step 1. Read only, change nothing in Figma.

File <duplicate link>. Pages Website and Dashboard.

1. List every top level frame on both pages with its id, name, width and what it is. Mark each
   one current, stale duplicate, exploration or annotation. Where two frames share a name, say
   which looks newer and why, and leave the call to me.
2. For the current frames only, report how they are built. Count frames with no auto layout,
   children placed absolute inside auto layout, groups used as layout, detached instances and
   default layer names.
3. Pull every value actually used. Fills, strokes, text families, sizes, weights, line heights,
   tracking, radii, gaps, paddings, shadows and blurs. Give each a use count and cluster near
   duplicates, for example 14 and 14.5, or 373737 and 383838.
4. Find repeated structures that should be components. Buttons, chips, inputs, table rows, cards,
   nav rail, header, footer, FAQ row, modal shell, stepper. For each, name the frames it appears
   in and the variants it really has, size, state, theme.
5. Screenshot every current frame into studio/clients/varntix/briefs/audit/ as the before set.

Write the report to studio/clients/varntix/briefs/audit.md. Then stop and send me only the open
questions, mainly which duplicates are current and any value clusters you are unsure about.
```

## Prompt 2, foundations

```
Varntix design system pass, step 2. Foundations only, no screen edits.

From the approved audit, create in the duplicate file
1. A Primitives variable collection with the colour ramp, spacing scale and radius scale, snapped
   to the clusters I approved.
2. A Semantic collection with Dark and Light modes, bg, surface, surface raised, hairline, text,
   text muted, accent, positive, negative, gold. Every semantic value aliases a primitive.
3. Text styles for the real type ramp, display down to caption, desktop and mobile where they
   differ.
4. Effect styles for the card shadow and the glass blur actually used.
5. A Foundations page that shows each of these as a labelled specimen.

Load the figma-use skill first. Bind nothing on screens yet. Screenshot the Foundations page,
list every value you snapped and what it snapped from, then stop.
```

## Prompt 3, components

```
Varntix design system pass, step 3. Components.

On a Components page in the duplicate file, build the components the audit named, in this order.
Button, chip, input and select, table row and header, card shell, stat tile, nav rail item and
rail, top bar, tabs, stepper, modal shell, FAQ row, footer.

Rules
- Auto layout all the way down, no absolute children unless the design overlaps on purpose,
  and then say which.
- Every fill, stroke, radius, gap and text binds to a variable or a style from step 2.
- Variants only for states and sizes the screens actually show. No invented states.
- Layer names describe the layer.
- Each component sits next to the original drawn version so we can compare them side by side.

Screenshot each component beside its original. Stop after button, chip and input so I can
approve the pattern before you do the rest.
```

## Prompt 4, screens onto the system

```
Varntix design system pass, step 4. Put one flow onto the system.

Flow <Dashboard home | Deposit | Withdraw | Auth | Assets | Referral | Profile | Website home>.

For each current frame in the flow
1. Screenshot it as is.
2. Rebuild its structure in auto layout using the step 3 components and step 2 variables. Keep
   every position, size and colour. This is a structure pass, not a redesign.
3. Screenshot again and compare. Anything that moved by more than 1px or changed colour is a
   regression to fix before moving on.

Work one frame at a time. Report the before and after pairs and any spot where matching the
original forced a hack. Stop at the end of the flow.
```

## Prompt 5, the system in code

```
Varntix design system pass, step 5. Tokens and components in code.

Build in a varntix folder at the repo root on this session's branch, the same shape as the
Remittix dashboard on claude/remittix-dashboard-4hke4l. Vite, React, TypeScript, one token layer
in CSS custom properties with data-theme dark and light, shared parts in their own files, page
sheets that never redefine a token.

1. Generate the token layer from the Figma variables and styles, names matching one to one.
2. Build the components from step 3 with their real variants and states, hover, focus,
   disabled, loading, empty.
3. Add a /system route that shows every token and component, both themes.

Fonts come from the file, Noto Sans on the dashboard, confirm the website family before shipping.
Run the build and click every component state before reporting.
```

## Prompt 6, prototype and deploy

```
Varntix design system pass, step 6. Screens as a running prototype.

Build the current Dashboard frames as routes on the step 5 system, with mock data in one data
file per module so a real API replaces a file, not a component. Dashboard, Assets, Invest,
Investment single strategy, Deposit with both paths, Withdraw, Transactions, Referral, Documents,
User profile, Login and Create account.

Real interaction, theme switch, working deposit and withdraw steps, sortable positions table,
empty states via ?empty=1. Shoot each route at the client widths with studio/scripts/shoot.mjs,
deploy a Vercel preview and put the URL on varntix-1 in tasks.md.
```

## Prompt 7, review

```
/uireview on the varntix prototype.
```

The website pages follow the same steps 4 to 6 as their own concept, after the dashboard is
accepted.
