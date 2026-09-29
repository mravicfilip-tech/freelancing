---
name: ml-brand-system
description: The Maximum Leverage brand design system. Use this skill whenever the task is to build, style, review or fix any web page for Maximum Leverage (ML): home pages, landing pages, sales pages, webinar registration and replay pages, thank-you pages, opt-ins, email templates, slide backgrounds, social graphics or any HTML/CSS/React output that carries the Maximum Leverage name, logo, tagline "Less Effort. More Scale." or its orange-to-red bar icon. Trigger even when the user only says "make it on brand", "ML page", "our landing page" or references local business owners in the Maximum Leverage context. Ships the logo files, design tokens, a component CSS library, page recipes, full example templates and the brand kit PDF. Do NOT use for Sellout Media, The Build, Corridor AI, Channel Fusion or Kinze work; those have their own skills.
---

# Maximum Leverage brand system

You are building pages for Maximum Leverage. The brand has one idea: leverage. A lever moves what muscle can't. Every page must look like it came from the same hand as the brand kit in `reference/Maximum-Leverage-Brand-Kit.pdf`.

## Workflow

1. Read `reference/brand.md` for the idea, messaging and voice. Use the exact tagline, positioning line, mission and vision. Never paraphrase them.
2. Pick the page recipe in `reference/pages.md`. It gives the section order for each page type.
3. Copy `assets/css/ml-tokens.css` and `assets/css/ml.css` into the project unchanged. Copy the logo files from `assets/logo/`. Never redraw, retype or recolor the logo.
4. Build with the components in `reference/components.md`. Start from the closest file in `templates/` and edit it. The templates are complete, verified pages.
5. Run the QA gate at the bottom of this file before you hand over.

## Non-negotiables

- Dark is the default. Page background is Night (`--ml-night`) or the `.ml-bg-night` glow. Light mode uses Off-white (`--ml-off`) with the navy wordmark. Never white text on a plain white section, never navy text on Night.
- The Ignition gradient (Amber to Flame to Signal) runs bottom-left to top-right, always. It is a highlight, never a full-page wash. Ratio across a page: about 60 Night, 28 Off-white, 12 Ignition.
- One primary button per view, and it is `.ml-btn--primary` on the gradient. Secondary actions use `.ml-btn--ghost`.
- Type is Montserrat for everything you read and Michroma only for section numerals and short labels. The wordmark is an SVG, never text.
- Logo files only: `ml-wordmark-dark.svg` on dark, `ml-wordmark-light.svg` on light, `ml-icon.svg` alone in small or square spaces. Keep one bar-width of clear space. Icon-only below 200px wide.
- No stock photography, no emoji, no drop shadows on the logo, no rounded-corner cards with a colored left border, no Inter, Roboto or Arial.
- Copy follows the voice rules in `reference/brand.md`. Short sentences. Numbers over adjectives. Lever, then result. Owner's language.
- Every page is responsive to 360px, passes 4.5:1 contrast for body text, has real `<a>` and `<button>` elements and a `<label>` for every input.
- Fonts load from Google Fonts with this exact link, placed before the stylesheets:
  `<link href="https://fonts.googleapis.com/css2?family=Michroma&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">`

## What goes where

| Need | File |
| --- | --- |
| Idea, tagline, positioning, mission, vision, voice | `reference/brand.md` |
| Colors, gradient, type scale, spacing, radii | `reference/tokens.md` and `assets/css/ml-tokens.css` |
| Copy-paste HTML for every component | `reference/components.md` |
| Section order for each page type | `reference/pages.md` |
| Do and don't | `reference/rules.md` |
| Full working pages | `templates/landing.html`, `templates/webinar-registration.html`, `templates/thank-you.html` |
| Logo, icon, favicon, banner | `assets/logo/` |
| Decorative line art for hero backgrounds | `assets/backgrounds/lines.svg` |
| The visual reference for everything above | `reference/Maximum-Leverage-Brand-Kit.pdf` |

## QA gate

Do not hand over until every line is true. Open the page in a browser or render a screenshot and check it, do not check from memory.

- [ ] Fonts render as Montserrat and Michroma, not a fallback.
- [ ] Wordmark is the SVG file and matches the section background (dark file on dark, light file on light).
- [ ] Icon has clear space and is never stretched, rotated or recolored.
- [ ] One gradient primary button per view. Gradient direction is bottom-left to top-right.
- [ ] Tagline reads exactly "Less Effort. More Scale." in tracked caps where used as a label.
- [ ] Body text is `--ml-fg-muted` on the right theme and passes 4.5:1.
- [ ] Hero headline uses the positioning line or a headline written in the voice rules, with one orange phrase at most.
- [ ] Page holds together at 360px, 768px and 1280px.
- [ ] No placeholders left in brackets unless the user asked to keep them.
- [ ] No em dashes anywhere in the copy.
