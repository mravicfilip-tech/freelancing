import { REDUCED, revealUp, useSectionMotion, type SectionMotion } from '../../lib/motion';
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

/* The footer's own entrance: glow, brand, columns, rule, legal line. */
function buildFooter({ q, tl }: SectionMotion) {
  // The glow already sits at opacity .8 in CSS; `from` returns it there.
  const glow = q('.footer__glow');
  if (glow.length) tl.from(glow, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 0);

  revealUp(tl, q('.footer__brand > *'), { y: 20, stagger: 0.07, duration: 0.6, at: 0.05 });
  revealUp(tl, q('.footer__col-title'), { y: 16, stagger: 0.06, duration: 0.55, at: 0.18 });
  revealUp(tl, q('.footer__links li'), { y: 12, stagger: 0.022, duration: 0.5, at: 0.3 });

  const rule = q('.footer__rule');
  if (rule.length) {
    tl.from(
      rule,
      { scaleX: 0, transformOrigin: '0% 50%', duration: 0.7, ease: 'power3.out', clearProps: 'transform' },
      0.42,
    );
  }
  revealUp(tl, q('.footer__meta > *'), { y: 12, stagger: 0.06, duration: 0.5, at: 0.55 });
}

/* The cropped wordmark gets its own observer. It sits ~900px below the footer's
   top edge, so on the body's timeline it would play out unseen and be finished
   before anyone scrolled to it.
   The letters are split here and put back together on completion, so the
   settled DOM is exactly the text node the design ships — no inline-block
   fragments left behind to shift kerning. */
function buildWordmark({ el, tl }: SectionMotion) {
  const span = el.querySelector<HTMLElement>('span');
  const text = span?.textContent;
  if (!span || !text || REDUCED) return;

  const restore = () => {
    if (span.firstElementChild) span.textContent = text;
  };
  const letters = [...text].map((ch) => {
    const s = document.createElement('span');
    s.className = 'footer__wm-ch';
    s.textContent = ch;
    return s;
  });
  span.textContent = '';
  letters.forEach((l) => span.appendChild(l));

  // The wordmark box already clips: pushing each letter below its own line box
  // parks it outside the crop, so this reads as the mark rising into the frame
  // at its real size rather than fading on in place.
  tl.from(letters, { yPercent: 118, duration: 0.8, ease: 'expo.out', stagger: 0.035 }, 0);
  tl.eventCallback('onComplete', restore);
}

export function Footer() {
  const ref = useSectionMotion<HTMLElement>(buildFooter);
  const wordmarkRef = useSectionMotion<HTMLDivElement>(buildWordmark, { threshold: 0.3 });

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
                    <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}>{l}</a></li>
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

      <div className="footer__wordmark" aria-hidden="true" ref={wordmarkRef}><span>Phorecast</span></div>
    </footer>
  );
}
