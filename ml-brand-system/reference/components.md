# Components

All snippets assume `ml-tokens.css` then `ml.css` are loaded and `<body data-theme="dark">` (or a section with `data-theme="light"`). Paths assume the page sits next to an `assets/` folder; adjust as needed.

## Page head
```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="assets/logo/ml-favicon-512.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Michroma&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/ml-tokens.css">
<link rel="stylesheet" href="assets/css/ml.css">
```

## Lockup (dark section)
```html
<a class="ml-lockup ml-lockup--sm" href="/" aria-label="Maximum Leverage home">
  <img class="ml-lockup__icon" src="assets/logo/ml-icon.svg" alt="">
  <span class="ml-lockup__divider"></span>
  <img class="ml-lockup__wordmark" src="assets/logo/ml-wordmark-dark.svg" alt="Maximum Leverage">
</a>
```
On a light section swap to `ml-wordmark-light.svg`. Sizes: `--sm` 28px, `--md` 44px, `--lg` 96px, `--xl` 180px. Add `ml-lockup--stacked` for square spaces.

## Navigation
```html
<header class="ml-container">
  <nav class="ml-nav" aria-label="Primary">
    <a class="ml-lockup ml-lockup--sm" href="/">...</a>
    <ul class="ml-nav__links">
      <li><a href="#levers">Levers</a></li>
      <li><a href="#results">Results</a></li>
      <li><a href="#faq">FAQ</a></li>
      <li class="ml-nav__cta"><a class="ml-btn ml-btn--primary" href="#book">Get Started</a></li>
    </ul>
  </nav>
</header>
```

## Hero (two column, dark, with lines and glowing icon)
```html
<section class="ml-hero ml-bg-night">
  <div class="ml-lines"><img src="assets/backgrounds/lines.svg" alt=""></div>
  <div class="ml-container" style="position: relative; z-index: 1;">
    <div class="ml-hero__inner">
      <div class="ml-hero__copy">
        <p class="ml-label ml-label--flame">Less Effort. More Scale.</p>
        <h1 class="ml-h1">Proven levers that grow your local business <span class="ml-accent">without you.</span></h1>
        <p class="ml-lead">We build and run the growth levers the big companies use, from offers to AI to automated follow-up.</p>
        <div class="ml-hero__actions">
          <a class="ml-btn ml-btn--primary ml-btn--lg" href="#book">See the levers</a>
          <a class="ml-btn ml-btn--ghost ml-btn--lg" href="#how">How it works</a>
        </div>
      </div>
      <div class="ml-hero__art"><img class="ml-bars ml-bars--glow" src="assets/logo/ml-icon.svg" alt=""></div>
    </div>
  </div>
</section>
```
Add `ml-hero--center` for a single-column centered hero (webinar pages).

## Section header
```html
<div class="ml-stack ml-center">
  <p class="ml-label ml-label--flame">The levers</p>
  <h2 class="ml-h2">Four things we pull. One thing that moves.</h2>
  <p class="ml-lead">Each one is built once and runs without you.</p>
</div>
```

## Lever cards (numbered, three across)
```html
<div class="ml-grid-3">
  <article class="ml-card ml-card--rule">
    <p class="ml-card__num">01</p>
    <h3 class="ml-card__title">Speed to lead</h3>
    <p class="ml-card__body">Every call answered in under 60 seconds, day or night.</p>
  </article>
  ...
</div>
```
Use `.ml-card` (boxed) on light sections and `.ml-card--rule` (top rule, no box) on dark.

## Stats row
```html
<div class="ml-grid-3">
  <div class="ml-stat"><p class="ml-stat__value ml-stat__value--gradient">[31%]</p><p class="ml-stat__label">more booked consults</p></div>
  ...
</div>
```
Only real numbers. If there are none yet, leave the row out.

## Testimonial
```html
<blockquote class="ml-quote">
  <p class="ml-quote__text">"[Quote in the owner's own words.]"</p>
  <footer class="ml-quote__who"><b>[Name]</b>, [Business], [City]</footer>
</blockquote>
```

## CTA band
```html
<div class="ml-band ml-band--ignition">
  <p class="ml-label">Less Effort. More Scale.</p>
  <h2 class="ml-h2">Your business grows. Your hours don't.</h2>
  <a class="ml-btn ml-btn--primary ml-btn--lg" href="#book">Book a call</a>
</div>
```
Use `ml-band--night` inside light sections.

## Registration form (webinar, opt-in)
```html
<form class="ml-form ml-form-card" action="[FORM_ACTION]" method="post">
  <div class="ml-field"><label for="name">First name</label><input class="ml-input" id="name" name="name" type="text" required></div>
  <div class="ml-field"><label for="email">Email</label><input class="ml-input" id="email" name="email" type="email" required></div>
  <div class="ml-field"><label for="phone">Mobile (for the reminder text)</label><input class="ml-input" id="phone" name="phone" type="tel"></div>
  <button class="ml-btn ml-btn--primary ml-btn--lg ml-btn--block" type="submit">Save my seat</button>
  <p class="ml-form__fine">Free. No card. Replay sent to registrants.</p>
</form>
```

## Event details strip
```html
<div class="ml-event">
  <div class="ml-event__item"><p class="ml-label">Date</p><p class="ml-event__value">[Thu, Oct 16]</p></div>
  <div class="ml-event__item"><p class="ml-label">Time</p><p class="ml-event__value">[12:00 PM CT]</p></div>
  <div class="ml-event__item"><p class="ml-label">Length</p><p class="ml-event__value">[45 min]</p></div>
</div>
```

## Video
```html
<div class="ml-video"><iframe src="[EMBED_URL]" title="[Video title]" allowfullscreen></iframe></div>
```

## Offer card
```html
<div class="ml-offer ml-offer--featured">
  <p class="ml-label ml-label--flame">[Offer name]</p>
  <p class="ml-offer__price">[$X,XXX] <small>install</small></p>
  <ul class="ml-check"><li>[What they get]</li><li>[What they get]</li></ul>
  <a class="ml-btn ml-btn--primary ml-btn--lg" href="#book">Book a call</a>
</div>
```

## FAQ
```html
<div class="ml-faq">
  <details><summary>[Question]</summary><p>[Answer]</p></details>
</div>
```

## Footer
```html
<footer class="ml-footer">
  <div class="ml-container ml-footer__inner">
    <a class="ml-lockup ml-lockup--sm" href="/">...</a>
    <ul class="ml-footer__links"><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li><li><a href="#">Contact</a></li></ul>
    <p class="ml-footer__fine">© 2026 Maximum Leverage. Less Effort. More Scale.</p>
  </div>
</footer>
```

## Gradient text
Wrap a short phrase in `<span class="ml-gradient-text">` for statement pages. One phrase per view.
