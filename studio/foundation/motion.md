# Motion

The bar, the prompt patterns and the references for a site judged by how it moves. Read it when
`/story` or `/newui` starts on a motion-led job. It is a reference bar, not Filip's ruling. A line
here becomes a rule only through `/taste`, and `principles.md` wins where the two differ.

Source is the Onyx Codex motion pilot onboarding deck, last updated 6 Oct 2026. Only the craft
content is kept. The pilot's tools, pay, file names and delivery steps are left out.

## The motion bar

- Built for this brand. The motion language matches the content, so a space agency does not move
  like a juice bar.
- One system. One easing family, related durations, and one shared shape or colour logic across
  the whole page.
- Page level first. Scroll-driven moments and section transitions carry the site. Hover and click
  states are the garnish, not the meal.
- Choreographed. Elements enter and leave in an order the eye can follow, and nothing fights for
  attention at the same moment.
- Purposeful. Every motion moment does a job, such as revealing hierarchy, handing off between
  sections or confirming an action.
- Readable and usable. Text is legible at every frame, controls work while motion plays, and a
  reduced-motion fallback exists.
- Smooth. No jank, no layout shift, no pop or overshoot nobody chose.
- One animation added to tick a box is a fail. At least half the motion is page level or scroll
  driven.

## The website bar

Judged as hard as the motion.

- A finished website, not a demo. Every page the brief needs, real content, working links, nothing
  placeholder.
- Typography. A deliberate pairing, clear hierarchy, consistent sizes and line heights.
- Colour. A palette chosen for this brand, used consistently, with contrast that keeps text
  readable.
- Layout and spacing. A grid, aligned edges, consistent radii and spacing, generous whitespace.
- Imagery. On brand and high quality. The deck allows generated images, and `principles.md` asks
  for real photography only, so real photography wins.
- Copy. Written for this brand, no lorem ipsum, no filler.
- No AI defaults. No eyebrow text, divider lines, generic pill buttons, decorative arrows or
  gradient blobs.

## Done when

- It would go to a paying client as is.
- With the motion switched off it still ships, and a senior web designer signs off layout, type and
  colour.
- It survives a senior motion designer's close look.
- The motion makes a good website better. It never makes up for a weak one.
- It matches the references below in ambition, not in effect count.

## How it gets checked

| Check | Pass means |
|---|---|
| Brief | Every named element is there, explicit direction is honoured, open decisions are made with intent, nothing contradicts the brief |
| Motion | One system of easing, durations and shape language. At least half page level or scroll driven. No uniform fade-ins, no bounce on everything. Readable at every frame, with a reduced-motion fallback |
| Design | Layout, spacing, hierarchy and type hold up. Branding is consistent across components. No eyebrows, divider lines, generic buttons or arrows |
| Deliverable | The code, the shots and the recording all show the same final build |

## Working habits

- Ask for structure and motion together. Layout first with motion bolted on later is the failure
  this bar exists to catch.
- Review typography and colour first, then watch every motion moment at normal speed and at slow
  speed.
- Motion is judged first from a 30 to 90 second recording that scrolls and clicks through the
  site. Stills cannot show easing, order or jank. `node studio/scripts/shoot.mjs --record` makes
  one, with a strip of stills to read in place of the video.

## Prompts

Three prompts from the deck, each with the reference it came with. Copy the pattern, then rewrite
the nouns for the brand.

### 1. Scroll-driven image choreography, Joby Aviation

> Pin this section while the user scrolls. As they scroll, each image moves to a new position and
> size along its own path and settles into the final layout. Tie the motion to scroll position
> rather than a fixed duration.

### 2. Layered cards in perspective, Camber

> Stack the cards in 3D perspective, offset and rotated. As the section scrolls, fan them out and
> settle them into a flat row. Scrub to scroll and let the back cards blur slightly until they
> arrive.

### 3. Section colours and persistent nav, Jeton

> Give each section its own background colour and crossfade the page background as the next
> section enters. Keep the navigation fixed and flip its colours so it stays readable. Each
> section's headline rises in, supporting line a beat later.

The deck gives the Brand motion reel tile the same prompt as Joby Aviation, a copy error, so that
tile has no prompt of its own here.

### What the three share

- A trigger. The section pins, or the next section enters.
- A start state, a path and an end state for each element. Stacked to fanned to a flat row.
- A clock. Scrubbed to scroll position, never a fixed duration, for anything page level.
- A second beat. Back cards blur until they arrive, the supporting line follows a beat later.
- A readability guard. The nav flips its colours so it stays readable on every ground.

A prompt missing one of these leaves Codex or Claude to guess it, and the guess is usually a
uniform fade.

## References

Read each one for the idea behind it. Never trace one beat for beat, per `principles.md`. The
deck's motion slop slide was unfinished and reused two good examples, so there is no slop list.

| Reference | Pattern | What to take from it | Link |
|---|---|---|---|
| Joby Aviation | Scroll-driven image choreography | Images travel along their own paths into the final layout, scrubbed to scroll | [pin](https://www.pinterest.com/pin/1055599909744111/) |
| Brand motion reel | Kinetic type and colour changes | Watch the reel. The deck gives no notes for it | [pin](https://www.pinterest.com/pin/333759022406800725/) |
| Camber | Layered cards in perspective | Cards fan out of a 3D stack into a flat row, back cards blurred until they land | [pin](https://www.pinterest.com/pin/835136324702034374/) |
| Jeton | Section colours and persistent nav | The page ground crossfades per section while the fixed nav flips its colours | [pin](https://www.pinterest.com/pin/55802482886827051/) |
| JZA Personal Curation | Objects that rearrange on scroll | Books slide along a shelf and swap places as you scroll. Playful, tied to the content, strong serif type | [pin](https://www.pinterest.com/pin/341218109286424063/) |
| LE:MA Web Design Collective | Horizontal carousel and colour blocks | Team cards scroll sideways in bright colour blocks, then the page drops into a full orange section with an oversized logo | [pin](https://www.pinterest.com/pin/970525788468350000/) |
| Ideogram (how.studio) | Gallery expands into detail view | A row of images animates, then a card grows into a full layout, with an ink-like dissolve behind the title. Warm cream palette | [pin](https://www.pinterest.com/pin/244109242305055005/) |
| Photographer portfolio | Photos react to the cursor | Tilted photos drift with the cursor in front of a huge red serif word. Cursor motion that feels tactile, not gimmicky | [pin](https://www.pinterest.com/pin/1109504058196872790/) |
| Selected Works agency site | Scroll-synced thumbnails | A tall column of project images moves past while small thumbnails on the right track position. Editorial grid, restrained easing | [pin](https://www.pinterest.com/pin/211174979246762/) |
| Mastercard Outcomes | Number counters and colour shifts | Numbers roll inside a fixed white pill while the orange ground shifts shade per section, ending on a 3D object. Motion makes the data readable | [pin](https://www.pinterest.com/pin/2674081025938721/) |
| wecreate | Playful hero, elements pop in | A browser window floats over a 3D field while stickers and labels pop into place. Playful and still well made | [pin](https://www.pinterest.com/pin/678214025168346377/) |
| Studio Tyrsa | One rotating 3D hero object | A blue dodecahedron with hand lettering rotates on a calm white page, then gives way to bold project images | [pin](https://www.pinterest.com/pin/51158145761690141/) |
| Trionn | Curved 3D carousel of work | Project screens fly through the hero on a curved path behind the words Design in Motion. Motion led, still reads as a website | [pin](https://www.pinterest.com/pin/1107181889668067699/) |
| Kultiveret | Hover image reveal on a list | Each row in a list of tours reveals an image on hover, in a magazine-style cream layout | [pin](https://www.pinterest.com/pin/51158145761853033/) |
| Brand Appart services | Stacked cards, a colour per card | Service cards stack as you scroll, purple, red, orange, beside a sticky side nav | [pin](https://www.pinterest.com/pin/1107181889670839851/) |
| AON studio | Text reveal over video | A headline types itself over a silhouette video in a dark rounded frame. The same container shape runs through the page | [pin](https://www.pinterest.com/pin/527836018843858750/) |
| Card stack shuffle | 3D card stack shuffle | A stack of image cards tilts and shuffles with the cursor, with believable depth and weight | [pin](https://www.pinterest.com/pin/717127940713136900/) |
| Farm Minerals | Product-story motion | The product drops into water under the line Just drop it, then calm green sections follow. The motion explains the product | [pin](https://www.pinterest.com/pin/25966135349238087/) |
| MachinaFusion | 3D backdrop and horizontal text | A glossy white 3D form sits behind a dark hero video, and large text slides horizontally between sections | [pin](https://www.pinterest.com/pin/281543726631289/) |
| Optimind | Glowing 3D hero and icon cards | A hexagonal particle object glows in the hero, then service cards with 3D icons, all in one grey and gold palette | [pin](https://www.pinterest.com/pin/893331276100594306/) |

Live sites the deck names as good motion.

- [Motionsites.ai](http://motionsites.ai)
- [The Cartier Roadster](https://www.cartier.com/en-us/roadster-universe.html)
- [twks](https://twks.ch/en)
- [GertiX](https://gertix.studio/)
- [1367 Studio](https://www.1367studio.com/)
- [Extrafazant](https://www.extrafazant.nl/)
- [h2a](https://www.h2a.lu/)
- [Inspora](https://www.inspora.design/?category=Web), fresh web and motion work, updated hourly
