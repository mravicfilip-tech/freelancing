import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { Roll } from '../Roll';
import { useSectionMotion } from '../../lib/motion';
import { buildFooter } from './Footer.motion';
import x from '../../assets/social/x.svg';
import discord from '../../assets/social/discord.svg';
import telegram from '../../assets/social/telegram.svg';
import tiktok from '../../assets/social/tiktok.svg';
import './Footer.css';

/* A column entry is usually just its label, and its href is that label
   slugged -- every one of these is a placeholder pointing at a fragment that
   does not exist yet. About is the exception: that page is real now and lives
   at a route, so the entry carries its own href rather than being slugged into
   a dead `#about`. Written as a union so the other fifteen stay one string
   each and only the ones with somewhere to go grow a second field. */
type Link = string | { label: string; href: string };

const label = (l: Link) => (typeof l === 'string' ? l : l.label);
const href = (l: Link) =>
  typeof l === 'string' ? `#${l.toLowerCase().replace(/\s+/g, '-')}` : l.href;

const COLUMNS = [
  { title: 'Product', links: ['Markets', 'Fees', 'How it works', 'Security'] },
  { title: 'Markets', links: ['Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices'] },
  { title: 'Company', links: [{ label: 'About', href: '/about' }, 'Careers', 'Blog', 'Brand'] },
  { title: 'Resources', links: ['Docs', 'API', 'Status', 'Support', 'FAQs'] },
];

const SOCIALS = [
  { name: 'X', icon: x },
  { name: 'Discord', icon: discord },
  { name: 'Telegram', icon: telegram },
  { name: 'TikTok', icon: tiktok },
];

const LEGAL = ['Terms of Service', 'Privacy Policy', 'Cookie Preferences'];

export function Footer() {
  // The band arrives when it is scrolled to; see Footer.motion.ts. `data-motion`
  // below holds the animated parts in CSS until this takes over.
  const ref = useSectionMotion<HTMLElement>(buildFooter);

  return (
    <footer ref={ref} className="footer" data-motion="pending">
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
                    <Icon src={s.icon} w={20} h={20} />
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
                    <li key={label(l)}><a href={href(l)}><Roll>{label(l)}</Roll></a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__legal">
          <hr className="footer__rule" />
          <div className="footer__meta">
            <p>© 2026 Phorcast Labs. All rights reserved.</p>
            <ul className="footer__legal-links">
              {LEGAL.map((l) => <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}><Roll>{l}</Roll></a></li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__wordmark" aria-hidden="true"><span>Phorcast</span></div>
    </footer>
  );
}
