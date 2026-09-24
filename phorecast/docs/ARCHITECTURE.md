# Architecture

How the app is put together: the shell, the two pages, the file anatomy of a
band, the shared libraries, the motion system, the 3D logo and the hero
carousel. For tokens and CSS conventions see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## 1. App shell

```
index.html          inline theme script (sets data-theme before first paint), #root
src/main.tsx        sets data-js="on", imports lib/theme, fonts, global.css, renders <App/> in StrictMode
src/App.tsx         useRouter(); renders <Landing/> or <AboutPage/>, then <Footer/>
```

- `main.tsx` imports the three `@fontsource-variable/*` packages (Manrope,
  Inter Tight, Darker Grotesque) and `styles/global.css`, which in turn imports
  `tokens.css` and `fonts.css`.
- `document.documentElement.dataset.js = 'on'` is what arms the CSS that hides
  animated parts before their entrance (section 5). If the bundle never runs,
  nothing is hidden.
- React runs in `StrictMode`, so every effect mounts, unmounts and mounts again
  in development. The motion code is written for that (see `useSectionMotion`).

## 2. Routing (`src/lib/router.ts`)

Hand-rolled, no dependency. Two routes: `/` and `/about` (`ABOUT`). Any other
path renders the landing page, which is the 404.

`vercel.json` rewrites every path to `/index.html`, so routing has to be client
side; a multi-page Vite build would not work under that rewrite.

The four rules, as implemented:

1. Same-origin `<a>` clicks on a different path are intercepted and become
   `history.pushState`. External links, `download`, `target` other than
   `_self`, `rel="external"` and anything already `preventDefault`ed are left
   alone.
2. Middle clicks and clicks with ctrl, meta, shift or alt are left alone.
3. A hash on the current path is not intercepted: the browser scrolls (with
   `scroll-behavior: smooth` from `global.css`). A hash on another path
   (`/#faq` from `/about`) renders the other page first, then scrolls to the id
   with `behavior: 'auto'`.
4. A push scrolls to the top unless it carries a hash. Back and Forward never
   touch scroll.

API used by components:

| Export | Use |
|---|---|
| `useRouter()` | Called once, in `App.tsx`. Installs the click and `popstate` listeners, applies rule 4, returns the route. |
| `useRoute()` | Subscribe any component to the route (Footer, Logo, Nav do). |
| `landing(path, '#faq')` | `#faq` on `/`, `/#faq` elsewhere. Use for any landing-page anchor. |
| `home(path)` | `#top` on `/`, `/` elsewhere. Used by the logo. |
| `ABOUT` | `'/about'`. |

Landing-page anchors that exist: `#top` (hero), `#why` (bento), `#how`
(steps), `#built`, `#faq`. The About page also has `#top` and `#faq`.

## 3. Pages and section order (`src/App.tsx`)

The nav is not a separate layer: `<Nav/>` is rendered inside the first band of
each page (`Hero.tsx`, and `AboutHero` in `About.tsx`), so it scrolls away with
it. It is not sticky.

**Landing, `/`**

| # | Component | id | Heading on the page |
|---|---|---|---|
| 1 | `hero/Hero.tsx` | `top` | Four slides, see section 8 |
| 2 | `bento/Bento.tsx` | `why` | Why Forecasters Choose Phorcast |
| 3 | `familiar/Familiar.tsx` | | Every Outcome. One Place. |
| 4 | `pillars/Pillars.tsx` | | Fast to enter. Clear to follow. Yours to control. |
| 5 | `fan/Fan.tsx` | | Where Every Outcome Connects |
| 6 | `steps/Steps.tsx` | `how` | Make Your First Forecast in 3 Simple Steps |
| 7 | `built/Built.tsx` | `built` | Start With One Question. Explore Every Possibility. |
| 8 | `faq/Faq.tsx` | `faq` | Answers before you start |
| 9 | `footer/Footer.tsx` | | (rendered by `App`, on both pages) |

**About, `/about`** (all in `about/About.tsx`, one function per band)

| # | Function | CSS / motion | Eyebrow or title |
|---|---|---|---|
| 1 | `AboutHero` (`id="top"`) | `About.hero.css`, `About.hero.motion.ts` | A prediction market for real-world events, simple and transparent |
| 2 | `Choose` | `About.css`, `About.motion.ts` (`buildChoose`) | Choose an event |
| 3 | `Brand` | `About.brand.css`, `About.brand.motion.ts` | About Phorcast |
| 4 | `Conviction` | `About.conv.css`, `About.conv.motion.ts` | Cast your conviction |
| 5 | `Compare` | `About.cmp.css`, `About.cmp.motion.ts` | How it works: price and profit |
| 6 | `Primer` | `About.css`, `About.motion.ts` (`buildPrimer`) | Why is it better than bets or crypto/stocks? |
| 7 | `<Faq/>` (`id="faq"`) | | same component as the landing page |
| 8 | `<Footer/>` | | |

`About.css` holds the page's layout and colour for every band; the per-band
CSS files hold motion-specific rules and are imported after it so they can
override. `About.motion.ts` holds the shared helpers (`schedule`, `outOfBlur`)
and re-exports the per-band builders.

## 4. Component anatomy

Each band lives in `src/components/<band>/` and tends to have:

| File | Role |
|---|---|
| `X.tsx` | Markup and copy. Renders `data-motion="pending"` on its root and calls `useSectionMotion(buildX)`. |
| `X.css` | Layout, colour (dark values plus the doubled light blocks), and at the foot the `[data-motion='pending']` hide list. |
| `X.motion.ts` | The entrance: a `buildX({ el, q, tl })` function that adds tweens to a paused timeline. |
| `X.loop.ts` | Optional ambient loop, started after the entrance finishes (passed as `idle` to `useSectionMotion`, or started on `motion:done`). |

Per band, as it stands:

| Band | Files beyond the pattern |
|---|---|
| hero | `entrance.ts` (`heroBuild`, `slideIn`), `Position.tsx/.css` (pager and play control), `slides/Slide{Account,Bonus,Future}.{tsx,css,motion.ts}` (each slide's illustration; its `.motion.ts` holds both load-in and loop) |
| bento | Band entrance is inline in `Bento.tsx`. Four cards in `boxes/Box{Onboard,Custody,Bonus,Markets}.{tsx,css}`; each card's motion is lazy-loaded from `motion/{onboard,funds,bonus,markets}.ts` via `import.meta.glob`, with helpers in `motion/shared.ts` |
| familiar | `Familiar.motion.ts` + `Familiar.loop.ts` |
| pillars | `Pillars.motion.ts`, no loop |
| fan | `Fan.motion.ts` + `Fan.loop.ts`; the two arcs are inline SVG (`?raw`) so their parts can be animated |
| steps | `Steps.motion.ts`; three panels in `panels/Panel{Register,Fund,Trade}.{tsx,css}` with their own motion inside the `.tsx`; `panels/shared.tsx` |
| built | `Built.motion.ts`; one loop per card in `loops/bt1.ts`, `loops/bt2.ts` |
| faq, footer | `X.motion.ts`, no loop |
| about | see section 3 |

Shared components in `src/components/`:

| Component | What it is |
|---|---|
| `Nav.tsx/.css` | Desktop bar (Home, Markets, Leaderboard, MORE, theme toggle, Login, Sign Up) and the phone sheet below 960px. MORE renders `MORE_MENU`. |
| `ThemeToggle.tsx/.css` | `ThemeToggle` (bar) and `ThemeSwitch` (the sheet's "Appearance" control). |
| `Logo.tsx/.css` | Mark plus wordmark; links to `home(path)`. |
| `Icon.tsx` | Single-colour SVG painted as a CSS mask. See DESIGN-SYSTEM.md. |
| `LiveDot.tsx` | The eyebrow dot. Multi-colour, so it swaps between two `<img>` files by theme instead of being an `Icon`. |
| `Roll.tsx` | Duplicates a label for the rolling hover used on buttons and links (`.roll` in `global.css`). |
| `HeroLogo/` | The three.js mark. See section 7. |

## 5. Entrance gating

Every band hides its animated parts until it is scrolled to, then plays its
entrance once. The pieces:

1. **Markup.** The section root carries `data-motion="pending"`.
2. **CSS.** At the foot of each band's CSS, a list like
   `[data-js] .faq[data-motion='pending'] .faq__row { visibility: hidden; }`.
   The `[data-js]` prefix means nothing is hidden unless `main.tsx` ran. Each
   list has a `prefers-reduced-motion` override that makes everything visible.
   The hero's list is the exception: it has no `[data-js]` prefix and instead
   a 4s CSS keyframe failsafe (`hero-motion-failsafe` in `Hero.css`).
   **The hide list and the selectors the motion module animates must match.**
   An element hidden in CSS but not animated stays hidden until the attribute
   goes; an element animated but not hidden flashes before its entrance.
3. **`useSectionMotion(build, opts)`** (`src/lib/motion.ts`), in a layout
   effect, so nothing paints before it runs:
   - Reduced motion: removes `data-motion`, sets `data-motion-done="1"`,
     dispatches `motion:done`. Done.
   - Otherwise it waits on an `IntersectionObserver` with
     `rootMargin: '0px 0px -5% 0px'` (`GATE`): the section must have climbed
     5% of the viewport. Above-the-fold sections pass `{ immediate: true }`
     (the landing hero and the About hero) and skip the observer.
   - On arrival it creates a `gsap.context` scoped to the section, builds the
     timeline with `build({ el, q, tl })`, and removes `data-motion` in the
     same frame.
   - On complete it sets `data-motion-done="1"`, dispatches a bubbling
     `motion:done` event, and starts the optional `idle` loop.
   - A stall guard: after the timeline's duration plus 1.5s it samples progress
     every 500ms and forces the end only if progress has stopped moving.
   - Cleanup reverts the context and restores the pending attribute, which is
     what makes StrictMode's mount, unmount, mount cycle safe.
4. **Theme changes rebuild.** `useThemeEpoch()` is a dependency of the effect,
   because several motion modules read resting colours from computed style at
   build time. A section that already played rebuilds immediately (it does not
   go back through the observer).

Events other code listens for:

| Event / attribute | Raised by | Listened to by |
|---|---|---|
| `motion:done`, `data-motion-done` | every `useSectionMotion` section | `HeroLogo` (start the 3D build), `Steps` (arm autoplay), bento card modules, `Familiar.loop.ts` |
| `motion:ready` | `hero/entrance.ts`, 1.3s into the hero entrance | `HeroLogo`, `Bento.tsx` (prefetch card motion modules) |

Read the flag before adding a listener: an event that already fired will not
fire again.

GSAP lag smoothing is set once in `motion.ts` (`gsap.ticker.lagSmoothing(250, 20)`)
so a blocked main thread does not let an entrance run to its end unseen.

## 6. Reduced motion

| Where | What happens under `prefers-reduced-motion: reduce` |
|---|---|
| `lib/motion.ts` `REDUCED` | Read once at module load. Every `useSectionMotion` section is revealed immediately with no timeline. |
| `styles/global.css` | CSS animations and transitions set to 0.01ms; `scroll-behavior: auto`; the rolling hover label is disabled. |
| Each band's pending list | Has a reduced-motion override that makes it visible. |
| Hero carousel | Never advances; the play/pause button is not rendered (live `matchMedia`, so it follows a change without reload). |
| Steps | Does not autoplay (live listener). |
| Loops | Each loop entry point returns early on `REDUCED`. |
| `HeroLogo` | Renders one static pose; no pointer, scroll or idle motion. |
| About conviction band | No pin and no scroll fill, because it is built inside the entrance. |

`REDUCED` is not live: toggling the OS setting mid-session affects the hero,
Steps and CSS immediately but the section entrances only after a reload.

## 7. HeroLogo: the 3D mark (`src/components/HeroLogo/`)

Used twice: the landing hero (slides 1 and 4) and the FAQ rail. Not on About.

| File | Role |
|---|---|
| `index.tsx` | React wrapper. Decides WebGL or fallback, loads the scene lazily, rebuilds on breakpoint or theme change. |
| `LogoScene.ts` | The three.js scene: renderer, camera, layout, idle sway, pointer tilt, ScrollTrigger, frame budget, visibility. |
| `treatments/lined.ts`, `shaders/lines.*.glsl` | The one treatment in use: the outline extruded as slices and ribs, drawn as line quads. Shaders are imported with `?raw`. |
| `config.ts` | Every tunable number (rest pose, pointer strength, easing, layouts per breakpoint). |
| `logoPath.ts` | The mark's outline as path data. |
| `logo-outline.svg` | Static fallback image. |

Lifecycle in `index.tsx`:

1. After `load` plus an idle callback, probe WebGL (`webgl2` then `webgl`). If
   none, show the fallback `<img>`.
2. Prefetch `LogoScene` and the treatment in parallel with the page entrance.
3. Build only after the host raises `motion:ready` or `motion:done`, or after a
   6s cap, then one more idle callback. This keeps shader compilation off the
   entrance's frames.
4. If construction throws, or `LogoScene` reports frames persistently over
   budget (`onTooSlow`), swap to the fallback and dispose the renderer.
5. Rebuild when crossing 767px or 1279px (layout changes) and on theme change
   (the line treatment picks additive light on dark or ink on paper at build).

Runtime behaviour in `LogoScene.ts`: stops drawing when the mark is off screen,
the tab is hidden, or its layer is at opacity 0 (the hero cross-fades it on
slides 2 and 3). Pointer tilt listens on the host and is disabled on touch
devices (`(hover: none), (pointer: coarse)`). The hero instance has a scrubbed
ScrollTrigger (turn, rise, fade as the hero scrolls away); the FAQ instance
passes `scroll={false}`.

The pointer tilt is deliberate and approved; see KNOWN-ISSUES.md.

## 8. Hero carousel (`src/components/hero/Hero.tsx`)

- **Slides** are the `SLIDES` array: eyebrow, title (with `\n` line breaks),
  lede, CTA label and a `CtaKey`, optional terms and aside, and the visual.
  Slide 1's visual is the 3D mark; 2 to 4 are `SlideAccount`, `SlideBonus`
  (plus `BonusCountdown` as the aside) and `SlideFuture`.
- **Autoplay**: `AUTOPLAY_MS = 7000`, one timer per slide. A hold banks the
  elapsed time and a release spends only what is left, so the pager's fill
  (`Position.tsx`, same `periodMs`, `paused` and reset key) and the slide
  change stay in step.
- **What holds it**: the play/pause button (`.hero__play`, WCAG 2.2.2),
  keyboard focus inside the slides or pager (`:focus-visible` only; a mouse
  click on the pager does not hold), the hero being off screen, and reduced
  motion. Hover does not hold it.
- **Off-screen hold**: an `IntersectionObserver` on the hero. When the hero
  comes back the reader gets the slide they left, with a fresh 7s.
- **Keyboard**: ArrowLeft and ArrowRight on the section change slide.
- **Slide change** replays `slideIn` (masked line reveal and illustration pop)
  in a `gsap.context` scoped to the slide, reverted on the next change.
- **`?slide=N`** (1 to 4) opens on that slide. It does not pause.
- **Accessibility**: `aria-roledescription="carousel"` on the section, each
  slide a `group` with `aria-roledescription="slide"` and `aria-hidden` when
  inactive; inactive CTAs get `tabIndex={-1}`.
- **The mark moves between slides without rebuilding.** One `HeroLogo`
  instance is shown on slide 1 and on slide 4's `.sl4__mark-slot`. Changing its
  `placement` prop would rebuild the WebGL renderer, so for slide 4 a layout
  effect measures the slot and writes `--mark-k`, `--mark-tx`, `--mark-ty`
  (and `--mark-cx/-cy/-h` for the fallback image) on the hero; `Hero.css`
  applies them as a transform on the canvas.
- **Breakpoints**: below 1180px (`STACKED`) the slide is one column and the
  mark renders inside slide 1's visual slot; slide 4 then has no mark. Below
  720px (`COMPACT`) the mark uses phone placement fractions.

The Steps band (`steps/Steps.tsx`) is the other auto-advancing control:
`DWELL_MS = 6000`, armed only after the band's `motion:done`, a click selects
a step and restarts the dwell, and below 700px it becomes a tablist over a
scroll-snap track. It has no pause control.

## 9. Shared libraries (`src/lib/`)

| File | Exports and purpose |
|---|---|
| `motion.ts` | `useSectionMotion`, `REDUCED`, `EASE`, helpers `rise`, `pop` (explicit `fromTo`, clears `transform,opacity`), `count`, `intoLines` (masked line split), `one`/`all` query helpers, types `SectionMotion`, `Timeline`. |
| `theme.ts` | Theme store on `<html data-theme>`: `useTheme`, `useThemeEpoch`, `setTheme`, `toggleTheme`, `getTheme`, `tok(name, fallback)` to read a resolved custom property inside a motion build. |
| `router.ts` | Section 2. |
| `sitemap.ts` | `SITEMAP` (footer columns), `MORE_MENU`, `SOCIAL_URLS`, `page(label)`, `linkProps(href, path)`, `isPlaceholder`, `stayPut`. See CONTENT.md. |
| `cta.ts` | CTA targets for landing-page buttons, read through `ctaProps(key)`. See CONTENT.md. |

Styles in `src/styles/`: `tokens.css` (all tokens), `fonts.css` (Galano
`@font-face`), `global.css` (reset, utilities, buttons, hover roll, tabular
figures list), `icon.css` (the `.icon` mask class).

## 10. The one ScrollTrigger pin (`about/About.conv.motion.ts`)

The About conviction band pins while its sentence fills word by word as the
reader scrolls. Two things about it are fragile:

- Creating the pin inserts a spacer that grows the document by about 170% of a
  viewport. With scroll anchoring on, a reader already inside that range is
  thrown past the band, so the module sets `overflow-anchor: none` on `<html>`
  for two frames around the insertion.
- A latch that forces the sentence full once passed waits for the scroll
  position to stop moving before it acts, because `scroll-behavior: smooth`
  turns the browser's anchoring correction into a two-second animated
  excursion that reads as "past the end".

Read the file's comments before changing the pin, the band's height, or
`scroll-behavior` in `global.css`.
