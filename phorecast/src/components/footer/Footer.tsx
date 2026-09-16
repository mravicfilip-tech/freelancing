import { gsap } from 'gsap';
import { revealUp, useSectionMotion, type SectionMotion } from '../../lib/motion';
import { clamp01, damp, scaleSetter, trackPointer, useLive, type LiveSetup } from '../faq/live';
import { createGlow, type GlowHandle } from './GlowShader';
import { Logo } from '../Logo';
import x from '../../assets/social/x.svg';
import discord from '../../assets/social/discord.svg';
import telegram from '../../assets/social/telegram.svg';
import tiktok from '../../assets/social/tiktok.svg';
import './Footer.css';

const COLUMNS = [
  { title: 'Product', links: ['Markets', 'Fees', 'How it works', 'Security'] },
  { title: 'Markets', links: ['Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices'] },
  { title: 'Company', links: ['About', 'Careers', 'Blog', 'Brand'] },
  { title: 'Resources', links: ['Docs', 'API', 'Status', 'Support', 'FAQs'] },
];

const SOCIALS = [
  { name: 'X', icon: x },
  { name: 'Discord', icon: discord },
  { name: 'Telegram', icon: telegram },
  { name: 'TikTok', icon: tiktok },
];

const LEGAL = ['Terms of Service', 'Privacy Policy', 'Cookie Preferences'];

/* Entrance -------------------------------------------------------------------
   Directed rather than staggered: the light comes up first, the logo leads, the
   four columns sweep left to right behind it, the rule draws under them, and the
   social buttons land last as the accent. The wordmark is deliberately absent —
   it belongs to the scroll, below. */
function buildFooter({ q, tl }: SectionMotion) {
  // The glow already sits at opacity .8 in CSS (and holds the canvas when WebGL
  // is up), so `from` returns it exactly there.
  const glow = q('.footer__glow');
  if (glow.length) tl.from(glow, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0);

  const logo = q('.footer__brand > .logo');
  if (logo.length) tl.from(logo, { y: 26, opacity: 0, duration: 0.72, ease: 'expo.out' }, 0.04);
  revealUp(tl, q('.footer__tagline'), { y: 18, duration: 0.6, at: 0.16 });

  revealUp(tl, q('.footer__col-title'), { y: 20, stagger: 0.055, duration: 0.6, at: 0.14 });
  // DOM order is column-major, so one even stagger reads as a left-to-right
  // sweep across the four columns rather than as a list filling in.
  revealUp(tl, q('.footer__links li'), { y: 14, stagger: 0.022, duration: 0.52, at: 0.26 });

  const rule = q('.footer__rule');
  if (rule.length) {
    tl.from(
      rule,
      { scaleX: 0, transformOrigin: '0% 50%', duration: 0.85, ease: 'expo.out', clearProps: 'transform' },
      0.46,
    );
  }
  revealUp(tl, q('.footer__meta > *'), { y: 12, stagger: 0.06, duration: 0.5, at: 0.58 });

  // Late accent: the four buttons pop in one at a time, after everything else
  // has settled, with just enough overshoot to be noticed.
  const socials = q('.footer__socials li');
  if (socials.length) {
    tl.from(
      socials,
      {
        scale: 0.6,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'back.out(2.2)',
        transformOrigin: '50% 50%',
        clearProps: 'transform',
      },
      0.62,
    );
  }
}

/* Continuous motion ----------------------------------------------------------
   One tick for the whole footer: the shader's clock, the scroll-linked
   wordmark, and the damped pointer response of the four columns. */
function footerLive(el: HTMLElement): LiveSetup {
  const glowHost = el.querySelector<HTMLElement>('.footer__glow');
  const wordmark = el.querySelector<HTMLElement>('.footer__wordmark');
  const mark = el.querySelector<HTMLElement>('.footer__wordmark span');
  const cols = Array.from(el.querySelectorAll<HTMLElement>('.footer__col'));
  const brand = el.querySelector<HTMLElement>('.footer__brand');

  const setY = mark ? gsap.quickSetter(mark, 'yPercent') : null;
  const setX = mark ? gsap.quickSetter(mark, 'x', 'px') : null;
  const setS = mark ? scaleSetter(mark) : null;
  const setO = mark ? gsap.quickSetter(mark, 'opacity') : null;

  const depth = cols.map((_, i) => 0.55 + i * 0.2);
  const colSet = cols.map((c) => ({ x: gsap.quickSetter(c, 'x', 'px'), y: gsap.quickSetter(c, 'y', 'px') }));
  const brandSet = brand ? { x: gsap.quickSetter(brand, 'x', 'px'), y: gsap.quickSetter(brand, 'y', 'px') } : null;

  const pointer = trackPointer(el);
  let px = 0;
  let py = 0;

  // Scroll-linked reveal of the cropped wordmark, damped so a flicked scroll
  // wheel does not snap it.
  let reveal = 0;

  let glow: GlowHandle | null = null;
  let glowStarted = false;
  let glowLevel = 0;
  let glowAcc = 0;
  let ro: ResizeObserver | null = null;

  const startGlow = () => {
    glowStarted = true;
    if (!glowHost) return;
    createGlow(glowHost)
      .then((handle) => {
        if (!handle) return; // silently keep the CSS gradients
        glow = handle;
        ro = new ResizeObserver(() => handle.resize());
        ro.observe(glowHost);
      })
      .catch(() => {
        /* CSS fallback stays */
      });
  };

  const tick = (dt: number, time: number) => {
    if (!glowStarted) startGlow();

    // --- reads ------------------------------------------------------------
    const vh = window.innerHeight;
    const wr = wordmark?.getBoundingClientRect();

    // --- integrate --------------------------------------------------------
    if (wr) {
      const target = clamp01((vh - wr.top) / (wr.height + 200));
      reveal = damp(reveal, target, 9, dt);
    }
    px = damp(px, pointer.state.x * pointer.state.inside, 5, dt);
    py = damp(py, pointer.state.y * pointer.state.inside, 5, dt);
    glowLevel = damp(glowLevel, 1, 2.2, dt);

    // --- writes -----------------------------------------------------------
    if (setY && setX && setS && setO) {
      const hidden = 1 - reveal;
      setY(hidden * 44);
      setS(1 + hidden * 0.05 + Math.sin(time * 0.21) * 0.004);
      setX(Math.sin(time * 0.13) * 9);
      setO(0.94 + Math.sin(time * 0.17 + 1.2) * 0.06);
    }
    colSet.forEach((s, i) => {
      s.x(px * depth[i] * -5);
      s.y(py * depth[i] * -4);
    });
    if (brandSet) {
      brandSet.x(px * 3);
      brandSet.y(py * 2.5);
    }
    // The band only breathes; there is nothing in it that needs 60Hz, so it is
    // capped at 30 and costs half of what it otherwise would.
    glowAcc += dt;
    if (glow && glowAcc >= 1 / 30) {
      glowAcc = 0;
      glow.render(time, glowLevel);
    }
  };

  return {
    tick,
    stop() {
      pointer.stop();
      ro?.disconnect();
      glow?.dispose();
      glow = null;
      const targets = [mark, brand, ...cols].filter(Boolean) as HTMLElement[];
      if (targets.length) gsap.set(targets, { clearProps: 'transform,opacity' });
    },
  };
}

export function Footer() {
  const ref = useSectionMotion<HTMLElement>(buildFooter);
  useLive(ref, footerLive);

  return (
    <footer className="footer" ref={ref}>
      <div className="footer__glow glow-fade--top" aria-hidden="true">
        <span className="footer__g footer__g--red" />
        <span className="footer__g footer__g--orange" />
        <span className="footer__g footer__g--peach" />
        <span className="footer__g footer__g--cream" />
      </div>

      <div className="container footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo />
            <p className="footer__tagline">Off-chain execution, on-chain settlement.<br />Every position, fill and liquidation is independently verifiable.</p>
            <ul className="footer__socials">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a href={`#${s.name.toLowerCase()}`} className="footer__social" aria-label={s.name}>
                    <img src={s.icon} alt="" width={20} height={20} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className="footer__columns" aria-label="Footer">
            {COLUMNS.map((c) => (
              <div key={c.title} className="footer__col">
                <h2 className="footer__col-title">{c.title}</h2>
                <ul className="footer__links">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__legal">
          <hr className="footer__rule" />
          <div className="footer__meta">
            <p>© 2026 Phorecast Labs. All rights reserved.</p>
            <ul className="footer__legal-links">
              {LEGAL.map((l) => <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}>{l}</a></li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__wordmark" aria-hidden="true"><span>Phorecast</span></div>
    </footer>
  );
}
