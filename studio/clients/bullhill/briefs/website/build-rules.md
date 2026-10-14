# BullHill website, rules for the three pathway builders

Filip's ask, 14 October 2026. Three design pathways, high fidelity, each about 90 percent close to
one style reference in look, section structure and content rhythm. Static for now, motion comes in a
later round. Phone is the main focus and the desktop has to be just as good. English first, German
second. Photos are placeholders.

## Where you work

- Your own git worktree and branch, made for you. Work only inside `bullhill-site/src/p<N>/`.
- Do not edit `src/shared/`, `src/main.tsx`, `package.json`, `index.html` or another pathway's
  folder. If you need a shared change or a new dependency, stop and say so in your report.
- Your entry file is `src/p<N>/<Name>.tsx`, default export, already stubbed. Split sections into
  files inside your folder as you like.
- Every CSS selector is scoped under your root class, `.p1`, `.p2` or `.p3`, set on the outermost
  element. Plain CSS files imported from your entry. No CSS modules, no Tailwind.

## Content

- All copy comes from `useContent()` in `src/shared/lang.ts`, typed in `src/shared/content.ts`.
  Read that file first. The same content renders in all three pathways.
- A string the pathway needs that is not in content.ts goes in `src/p<N>/copy.ts` with an `en` and a
  `de` value, picked by `c.lang`.
- Copy rules. No colons and no em or en dashes in any visible text. Plain sentences. No lorem ipsum.
- German runs about 30 percent longer. Check every section in German at 390.
- Language switch, the shared `LangSwitch`, sits in the header and in the phone menu.

## Brand

- Tokens from `src/shared/tokens.css` only. bull-red `#d00b11` is the one accent colour. Where the
  reference uses teal, orange or any other hue, use bull-red, black, white or a grey token instead.
  No other hue anywhere, no off-brand gradient colour.
- Red text on dark grounds only at 24px and up. Red on white is fine at any size.
- The logo is the shared `Logo` component, `variant` on-dark, on-light, on-red or on-red-alt, `kind`
  logo, mark or wordmark. Never redraw or recolour it.
- Photos are the shared `Placeholder` with `label={c.ui.photo}`, restyled with the `--ph-*` custom
  properties in your CSS. Keep the shot brief visible where the slot is big enough, hide it with
  `brief={false}` on small slots.

## Type and scale

- Sizes from the base scale 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, plus the BullHill display sizes
  56, 64, 72, 80, 96, 120, 160. Working text 14 and up, 16 and up for paragraphs. 12 only for mono
  labels and captions that are not needed to act.
- Spacing on 4, 8, 12, 16, 24, 32, 48, 64, 96, and multiples of 32 above that for section padding.
- Fonts are installed, import them in your entry file only.
  - Pathway 1 `@fontsource-variable/archivo/wdth.css` and `@fontsource-variable/azeret-mono`
  - Pathway 2 `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`
  - Pathway 3 `@fontsource-variable/instrument-sans/wdth.css` and `@fontsource-variable/chivo-mono`
  - Family names are `'Archivo Variable'`, `'Azeret Mono Variable'`, `'Geist Variable'`,
    `'Geist Mono Variable'`, `'Instrument Sans Variable'` and `'Chivo Mono Variable'`.

## Phone first

- Write the phone layout as the base styles, then `@media (min-width: 768px)` and
  `@media (min-width: 1200px)`. Shots run at 390 and 1440. No horizontal scroll at 390.
- Touch targets 44px tall on phone, 40 to 44 on desktop. The phone header always shows a call
  button with `href={c.contact.phoneHref}` and a menu button.
- The phone menu is a Radix `Dialog` from `radix-ui`. Tabs are Radix `Tabs`, the FAQ is Radix
  `Accordion`. Never hand roll a menu, dialog, tabs or accordion.

## Structure and states

- Section ids `services`, `process`, `projects`, `crew`, `contact` for the nav anchors.
- No scroll animation yet. Build the DOM so each element that will move later is its own element.
  Hover and focus states are required on everything interactive, transitions 150 to 200ms.
- The form is real. Labels on every field, required marks, the role choice as a radio group,
  submit runs a fake send, `sending` for 800ms, then the success message. `?form=error` shows the
  error state instead so it can be reviewed. Empty submit shows the required messages next to the
  fields, not colour only.
- Contrast WCAG AA, 4.5 to 1 for body text, 3 to 1 for large text and controls. Visible focus.
- Decorative art (dot fields, wireframes, glows) is `aria-hidden`. Draw it in inline SVG or CSS, no
  canvas, no WebGL, no images from the web.

## Check before you report

1. `npm run typecheck` and `npm run build` in `bullhill-site/` pass.
2. Run the dev server on your own port, 5181 for pathway 1, 5182 for 2, 5183 for 3.
3. Shoot full page at both widths, English and German, with
   `node ../studio/scripts/shoot.mjs --url http://localhost:<port> --routes "en=/?v=<N>,de=/?v=<N>&lang=de" --widths 390,1440 --out <your scratch dir>/shots`
   and open the shots yourself. Compare each section with the reference frames listed in your
   pathway brief. Fix what is off and shoot again. At least two passes.
4. `node ../studio/scripts/baselint.mjs --client bullhill` on your diff, fix what is off scale.
5. Commit on your branch with a plain message. Report in five lines or fewer, detail in
   `studio/clients/bullhill/briefs/website/pathway-<N>-report.md` on your branch, including the
   places you could not match the reference and why.
