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

// Sports is a market category now, alongside the five instrument classes that
// were already here. The footer's MARKETS column is plain text, so it just
// takes another entry -- unlike the icon rows elsewhere on the page, which
// would need an asset that does not exist in src/assets.
const COLUMNS = [
  { title: 'Product', links: ['Markets', 'Fees', 'How it works', 'Security'] },
  { title: 'Markets', links: ['Crypto', 'Forex', 'Stocks', 'Commodities', 'Indices', 'Sports'] },
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
            {/* The strapline used to read "Off-chain execution, on-chain settlement.
                Every position, fill and liquidation is independently verifiable."
                All three claims went with the repositioning: there are no
                liquidations, the off-chain/on-chain framing is not the product's
                framing any more, and the verifiability claim was built on top of
                it -- there is no collateral in contracts to inspect and no
                liquidation to re-derive, so nothing is left for a reader to
                verify. Its job was reassurance, and the reassurance the new copy
                DOES support is bounded risk: the stake is the whole of the
                downside. Same two lines, same length, a premise that is true. */}
            <p className="footer__tagline">A prediction market for real-world events.<br />Your maximum loss is always what you stake.</p>
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
                    <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}><Roll>{l}</Roll></a></li>
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
