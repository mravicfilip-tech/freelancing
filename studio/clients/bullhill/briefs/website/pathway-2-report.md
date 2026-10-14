# Pathway 2, Daylight, build report

Branch claude/hopeful-maxwell-bwuy3c-p2. Route /?v=2, German at &lang=de. Files are in bullhill-site/src/p2/.

## What is built

All 13 sections of the brief, in order. Notice bar, sticky header, hero with the dome and route card, logo strip, ethos with the photo row, project slider, photo cluster, services bento, process, why and stats and audiences, crew, contact, footer.

- Header. Blurred sticky header, white bordered nav pill with the five items in mono, the shared LangSwitch, Call us outline and Send the job red. Below 1200px it shows the red call button and a Menu button. The menu is a Radix Dialog sheet from the top with 32px items, LangSwitch and the two buttons. The Dialog portals into the .p2 root so the scoped CSS applies.
- Hero. The dome is inline SVG ring dots projected from a sphere (dome.ts), some filled and glowing in bull-red, over radial gradients. Floating route card with a red strip, mono labels and a red delta chip. Phone puts the dome under the text and crops it at the section bottom.
- Slider uses Radix Tabs. The prev and next buttons and the dot pager both drive it. Dots show on phone only.
- Cluster has eight placeholders rotated between minus 5 and 5 degrees on desktop. Phone and tablet keep two above and two below the text.
- Bento has a depth gauge, a black duct table, a connections counter with a red bar and surface chips. Process has the 120px headline, four steps over a hairline with square nodes, and four cards (photo, percent bars, checklist, metric table). Phone repeats the node line between steps.
- Stats are open on the page. Two black audience cards with three check points each. Crew has portraits, a black fleet table and region chips.
- Form is real. Radix RadioGroup for the role, labels and star marks on name, email and place, required messages beside the fields, 800ms sending state, success message, and ?form=error for the error state. Footer has the glowing red hill.
- Extra copy is in copy.ts with en and de. Content.ts was used for everything else.

## Where it differs from the reference

- The reference hero is a full sphere. This one is a hill shaped dome cropped by the section bottom, as the brief asks.
- The nav pill has a 12px radius and a 1px border. The reference pill is almost square and borderless.
- Logo slot labels are grey-600, not the brief's grey-400. Grey-400 on white is 2.6 to 1 and fails the AA rule in build-rules.
- Table heads on black are grey-400. Red text on dark is only allowed at 24px and up, so the reference's orange heads are not copied.
- Page padding is 16 on phone, 24 at 768 and 32 at 1440, from the base layout. The reference uses about 20.
- The cluster photos rotate at most 5 degrees. The reference goes further, the brief caps it at 6.
- The photo cluster is a static scatter. The reference scatter moves on scroll, which is the later motion round.
- The reference has no testimonials row here, per the brief. Real client logos and the reference photos are placeholders.
- Hero title uses c.hero.split, so the line break sits where content.ts puts it on desktop.

## Checks

- npm run typecheck and npm run build pass.
- Shots at 390 and 1440, English and German, two full passes plus fixes. No horizontal scroll at 390 or at 1024. German strings checked at 390 in every section.
- Also driven by script. Menu open and link scroll, empty submit, submit success, ?form=error, 1024 tablet.
- shoot.mjs reports no contrast or target findings and no console errors. It lists 30 items under 14px, all the 12px mono labels the rules allow.
- baselint is down to 3 warnings. Two are the coloured glow box shadows of the dome and the footer hill, which are the brand glow on purpose. One is the 24px chip height.

## Needs from shared files

Nothing. No shared change and no new dependency.

## Round 2, real photos

- The photo row is now the work section, `id="work"`, directly after the hero and before the logo strip. `c.work.title` at 48px left, `c.work.lede` beside it, then the seven photos in order with 12px radius, bleeding off the right edge, captions in mono under each as `01 / 07` and the caption. Swipes sideways on phone, desktop has two square buttons and the row scrolls by touch pad or keys. At 390 the first photo shows whole and the second one's edge shows.
- The old ethos title is gone with the old row, `c.ethos.body` still runs in the cluster. The logo strip took the padding below the work row.
- Real photos in the project slider, the eight cluster slots (seven plus the route photo again), the first process card (the restored lane) and both audience strips (six different photos, no repeat in a strip). Crew portraits keep their placeholders. Each slot has its own `sizes` and focal point so the ducts, the machine and the mountains stay in the crop.
- Nothing else in Daylight moved. New file `Work.tsx`, edits in Projects, Cluster, Process, Audiences, Intro, Daylight and `daylight-sections.css`.
- Checks. typecheck and build pass, baselint finds nothing off the scale, two shoot passes at 390 and 1440 in English and German with scrolled shots for the lazy photos, no horizontal scroll at 390. The only console errors are the dev server refusing the two Geist font files through the linked node_modules, the production build is not affected.
