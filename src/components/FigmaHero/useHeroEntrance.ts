import { useEffect, type RefObject } from 'react';

interface Figures {
  /** Filled share of the progress bar, 0–1. */
  progress: number;
  usd: number;
  tokens: number;
}

/**
 * Page-load sequence for the Figma hero: the nav drops in, the headline lines rise out of their
 * masks, the copy and button follow, and the presale panel lifts in while the progress bar fills
 * and the figures count up. A sheen then sweeps the progress bar every few seconds.
 *
 * The hero renders with `data-entrance="pending"`, which hides the animated parts in CSS; the
 * attribute is cleared in the same frame GSAP takes over, so nothing flashes before the sequence.
 */
export function useHeroEntrance(root: RefObject<HTMLElement | null>, { progress, usd, tokens }: Figures) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reveal = () => {
      delete el.dataset.entrance;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }

    let cancelled = false;
    let revert: (() => void) | null = null;
    import('gsap')
      .then(({ gsap }) => {
        if (cancelled) return;
        const ctx = gsap.context(() => {
          const entered =
            '.fh__nav, .fh__brand, .fh__links a, .fh__navRight > *, .fh__lineInner, .fh__body, .fh__intro .fh__btn, ' +
            '.fh__sliderControls, .fh__footer, .fh__priceTitle, .fh__stats p, .fh__unit, .fh__sep';
          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            // Drop the inline transforms/opacity the `from` tweens leave behind, so CSS hovers apply.
            onComplete: () => gsap.set(entered, { clearProps: 'transform,opacity' }),
          });

          // Nav: the bar drops in, then its contents.
          tl.from('.fh__nav', { y: -28, opacity: 0, duration: 0.9 }, 0);
          tl.from('.fh__brand, .fh__links a, .fh__navRight > *', { y: -10, opacity: 0, duration: 0.6, stagger: 0.05 }, 0.25);

          // Copy: headline lines rise out of their masks, then body, button and slide controls.
          tl.from('.fh__lineInner', { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.12 }, 0.35);
          tl.from('.fh__body', { y: 20, opacity: 0, duration: 0.8 }, 0.8);
          tl.from('.fh__intro .fh__btn', { y: 16, opacity: 0, scale: 0.94, duration: 0.7, ease: 'back.out(1.6)' }, 0.95);
          tl.from('.fh__sliderControls', { y: 12, opacity: 0, duration: 0.7 }, 1.1);

          // Presale panel: lifts in, the bar fills, the figures count up, the countdown units step in.
          tl.from('.fh__footer', { y: 36, opacity: 0, duration: 0.9 }, 0.6);
          tl.from('.fh__priceTitle', { y: 12, opacity: 0, duration: 0.6 }, 0.85);
          tl.fromTo('.fh__progressFill', { width: '0%' }, { width: `${progress * 100}%`, duration: 1.6, ease: 'power2.inOut' }, 0.95);
          tl.from('.fh__stats p', { y: 10, opacity: 0, duration: 0.6, stagger: 0.1 }, 1.0);
          tl.from('.fh__unit, .fh__sep', { y: 14, opacity: 0, duration: 0.7, stagger: 0.07 }, 0.9);

          const usdEl = el.querySelector<HTMLElement>('[data-count="usd"]');
          const tokensEl = el.querySelector<HTMLElement>('[data-count="tokens"]');
          const counter = { usd: 0, tokens: 0 };
          tl.to(
            counter,
            {
              usd,
              tokens,
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: () => {
                if (usdEl) usdEl.textContent = `$${counter.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                if (tokensEl) tokensEl.textContent = Math.round(counter.tokens).toLocaleString('en-US');
              },
            },
            0.95,
          );

          // Idle: a sheen sweeps the filled part of the bar every few seconds.
          gsap.fromTo(
            '.fh__progressGlow',
            { xPercent: -100 },
            { xPercent: 250, duration: 1.6, ease: 'power1.inOut', repeat: -1, repeatDelay: 2.4, delay: 2.8 },
          );
        }, el);
        // The `from` tweens have already written their start states, so the CSS hold can go.
        reveal();
        revert = () => ctx.revert();
      })
      .catch(() => reveal());

    return () => {
      cancelled = true;
      revert?.();
    };
    // Figures are constants for the life of the hero; the sequence runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);
}
