// The hero's opening, its per-slide choreography, and the life it keeps after.
//
// Two triggers only: the load-in, and loops. Nothing here listens to the pointer.
//
// Built from light and masks rather than fades. Type is revealed by a mask
// wiping up behind it while it pulls from soft to sharp, the light ignites from
// behind the mark and blooms outward, and a specular sheen crosses the headline
// as it lands. A fade is what you reach for when you have not decided what the
// motion is made of.
//
// Everything overlaps: the headline starts before the light has finished, the
// copy before the headline has. Settled in ~1.2s, so the stage is never empty
// long enough to read as loading. Every tween is a `from` that clears its own
// props — if this never runs, the hero is intact.

import { gsap } from 'gsap';

const SHEEN_EVERY = 10; // seconds between repeat passes of the glare

/**
 * Wraps text in masked lines so each can wipe up independently. When `shine` is
 * set each line also gets a duplicate layer whose gradient is clipped to the
 * glyphs, which is what makes the sweep read as light on the letterforms rather
 * than a bar passing over the section.
 */
function intoLines(el: HTMLElement, shine = false): HTMLElement[] {
  const text = el.textContent ?? '';
  const parts = text.includes('\n') ? text.split('\n') : [text];
  el.textContent = '';
  return parts.map((part) => {
    const inner = document.createElement('span');
    inner.className = 'line__in';
    inner.textContent = part;

    const mask = document.createElement('span');
    mask.className = 'line';
    mask.appendChild(inner);

    if (shine) {
      const gloss = document.createElement('span');
      gloss.className = 'line__shine';
      gloss.setAttribute('aria-hidden', 'true');
      gloss.textContent = part;
      inner.appendChild(gloss);
    }

    el.appendChild(mask);
    return inner;
  });
}

/** Runs the specular highlight across the glyphs of every line at once. */
function sweep(title: HTMLElement, at: number, tl: gsap.core.Timeline) {
  const gloss = Array.from(title.querySelectorAll<HTMLElement>('.line__shine'));
  if (!gloss.length) return;

  const pos = { p: 135 };
  tl.set(gloss, { opacity: 1 }, at)
    .to(pos, {
      p: -35,
      duration: 0.95,
      ease: 'power2.inOut',
      onUpdate: () => {
        const v = `${pos.p}% 0`;
        gloss.forEach((g) => { g.style.backgroundPosition = v; });
      },
      onComplete: () => gsap.set(gloss, { opacity: 0 }),
    }, at);
}

/**
 * Animates the copy of one slide in. Used by the load-in and again on every
 * slide change, so the treatment is seen four times rather than once.
 */
export function slideCopyIn(slide: HTMLElement, tl: gsap.core.Timeline, at: number): void {
  const eyebrow = slide.querySelector<HTMLElement>('.eyebrow');
  const title = slide.querySelector<HTMLElement>('.hero__title');
  const lede = slide.querySelector<HTMLElement>('.hero__lede');
  const cta = slide.querySelector<HTMLElement>('.hero__cta');

  if (eyebrow) {
    tl.from(eyebrow, { opacity: 0, x: -10, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' }, at);
  }

  if (title) {
    const lines = title.dataset.split ? Array.from(title.querySelectorAll<HTMLElement>('.line__in')) : intoLines(title, true);
    title.dataset.split = 'true';

    // Mask wipe and focus pull together: the line rises out of nothing and
    // resolves as it arrives.
    tl.from(lines, {
      yPercent: 110,
      filter: 'blur(9px)',
      duration: 0.8,
      stagger: 0.09,
      ease: 'expo.out',
      clearProps: 'transform,filter',
    }, at + 0.06);

    sweep(title, at + 0.38, tl);
  }

  if (lede) {
    const lines = lede.dataset.split ? Array.from(lede.querySelectorAll<HTMLElement>('.line__in')) : intoLines(lede);
    lede.dataset.split = 'true';
    tl.from(lines, { yPercent: 105, opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' }, at + 0.24);
  }

  if (cta) {
    tl.from(cta, {
      opacity: 0,
      scale: 0.96,
      y: 8,
      duration: 0.55,
      ease: 'power3.out',
      transformOrigin: '50% 50%',
      clearProps: 'transform,opacity',
    }, at + 0.36);
  }
}

export function heroEntrance(hero: HTMLElement): () => void {
  const all = (sel: string) => Array.from(hero.querySelectorAll<HTMLElement>(sel));
  const glows = all('.hero__glow');
  const horizon = all('.hero__horizon');
  const mark = all('.hero__logo');
  const cards = all('.hero__foot > *');
  const slide = hero.querySelector<HTMLElement>('.hero__slide.is-active');

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  // Light ignites from the centre and blooms outward — small and bright to full
  // size, rather than a rectangle fading up.
  if (glows.length) {
    tl.from(glows, {
      opacity: 0,
      scale: 0.82,
      duration: 1.0,
      stagger: { each: 0.05, from: 'center' },
      transformOrigin: '50% 50%',
      clearProps: 'transform,opacity',
    }, 0);
  }
  if (horizon.length) {
    tl.from(horizon, { opacity: 0, scaleY: 0.35, transformOrigin: '50% 100%', duration: 0.9, clearProps: 'transform,opacity' }, 0.06);
  }
  if (mark.length) {
    tl.from(mark, { scale: 0.94, duration: 1.0, transformOrigin: '50% 50%', clearProps: 'transform' }, 0.08);
  }

  // Copy starts while the light is still moving. The overlap is what stops it
  // reading as two separate events.
  if (slide) slideCopyIn(slide, tl, 0.18);

  if (all('.hero__position').length) {
    tl.from(all('.hero__position'), { opacity: 0, y: 8, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.62);
  }
  if (cards.length) {
    tl.from(cards, { opacity: 0, yPercent: 24, duration: 0.55, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.6);
  }

  // ---- Loops. Meaningful motion only: the glare, and live numbers. ----------
  const loops: Array<gsap.core.Tween | gsap.core.Timeline> = [];
  let priceTimer = 0;

  tl.call(() => {
    const title = hero.querySelector<HTMLElement>('.hero__slide.is-active .hero__title');
    if (title) {
      const loop = gsap.timeline({ repeat: -1, repeatDelay: SHEEN_EVERY });
      sweep(title, 0, loop);
      loops.push(loop);
    }

    // The market cards were frozen, which is the wrong look for a trading
    // product. Walk each price a few basis points and flash the move.
    priceTimer = window.setInterval(() => {
      const card = cards[Math.floor(Math.random() * cards.length)];
      const priceEl = card?.querySelector<HTMLElement>('.ticker__price');
      if (!priceEl) return;

      const raw = priceEl.textContent ?? '';
      const value = Number(raw.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(value) || value === 0) return;

      const next = value * (1 + (Math.random() - 0.5) * 0.0016);
      const decimals = (raw.split('.')[1] ?? '').length || 2;
      priceEl.textContent = `$${next.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

      gsap.fromTo(priceEl,
        { color: next > value ? '#4ade80' : '#f87171' },
        { color: '', duration: 1.1, ease: 'power2.out', clearProps: 'color' });
    }, 2600);
  });

  return () => {
    tl.kill();
    loops.forEach((t) => t.kill());
    window.clearInterval(priceTimer);
    gsap.set(hero.querySelectorAll('.hero__glow, .hero__horizon, .hero__foot > *, .line__in'), {
      clearProps: 'transform,opacity,filter',
    });
  };
}
