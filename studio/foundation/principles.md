# Principles

How work gets judged. The `/uireview` critic grades against the rubric in `skills/uireview/rubric.md`
and a client's `README.md` and `taste.md`. A preference that applies to every client goes here,
written by `/taste`.

## Critique heuristics

- Measurement over adjectives. "13px, 3.9 to 1, fails AA" lands, "text is small" does not.
- Rejected on sight. Small type on anything read to work, controls under 32px tall, cards inside
  cards, an element cut off at a container edge, mismatched control heights with no gap between
  groups, native browser chrome showing through, ragged alignment across sibling cards, the same
  number printed twice, clip art or generated vector imagery.
- Asked for. Full width layouts, never a narrow centred column. Icons, hover states and
  transitions on anything interactive. Light display weight on big headlines. Stats shown openly,
  not boxed up. Real photography only.
- Solid colours on cards. No partial height stripes, no coloured card edges, no translucent tint.
- Card element order is status, title, description, price, primary action. Icons match their verb.
  A labelled button beats an icon-only one when there is room. Tooltip copy is sentence case.
- Filters and taxonomy are visible on load, not behind a click, unless a facet list cannot fit on
  one screen. Ask before hiding any.
- A check is a claim about the check until it survives a known answer. Give each automated check
  a negative control before its verdict counts.

## Recurring failure modes

- Guessed instead of asked. Building something plausible to see how it lands.
- Changed unnamed things while fixing a named defect.
- Brand drift. Reading source for structure and inventing the rendered look instead of capturing
  the live reference first.
- Weak states. Hover, focus or active identical to default.
- Low contrast and invisible text. Under 4.5 to 1 on body text is a finding. Under 1.5 to 1 is a
  separate, worse class.
- Demo scaffolding on a product surface, such as walkthrough cards and "start here" prompts.
- Leaked names. The studio's own name or another client's name in rendered text, a page title,
  alt text or view-source.
- A review that checks quality against a scope list without ever checking the list itself.

## Accessibility bar

WCAG 2.2 AA blocks on client work. Personal tools get warnings only.

- Keyboard. Every control reachable and operable by keys, no traps, especially in modals and
  drawers. Test with real Tab presses, never programmatic focus.
- Focus visible. A clear indicator on every focusable element.
- Contrast. 4.5 to 1 for body text, 3 to 1 for large text and essential UI, from token values or
  pixels, never eyeballed.
- Names and roles. Icon-only controls have accessible names.
- Forms. Inputs have labels, and errors are not colour only.
- Images. Meaningful images have alt text, decorative ones are hidden.
- Motion. Nothing flashes or times out without user control.

## Definition of done

A client prototype is real, running and deployed, never a deck or a standalone HTML file. It is
built in the client's folder on a session branch with its own PR, matches the brand exactly, has nothing moved that
was not named, `/uireview` shows no open sev 1, and the preview URL is live.

## Variant rule

- Layout, structure and direction get one argued pick. Say what it argues for and what it refuses.
- Micro detail, such as motion, icons, states and loaders, gets 3 to 5 numbered variants built in
  the real app, picked by number.
