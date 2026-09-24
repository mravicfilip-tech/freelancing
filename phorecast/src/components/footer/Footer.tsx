/* The footer.
   ---------------------------------------------------------------------------
   A brand block and four columns (Product, Company, Legal, Social) between two
   hairlines, closed by a two-ended bottom bar. The first three columns are
   rendered from lib/sitemap.ts, which also feeds the nav's MORE menu; see that
   file for the links, their order and their targets.

   The brand is spelled "Phorcast" here, as everywhere else in the codebase.

   Motion lives in Footer.motion.ts; the `data-motion="pending"` hold that goes
   with it is at the foot of Footer.css. */
import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { Roll } from '../Roll';
import { useSectionMotion } from '../../lib/motion';
import { useRoute } from '../../lib/router';
import { SITEMAP, SOCIAL_URLS, linkProps } from '../../lib/sitemap';
import { buildFooter } from './Footer.motion';
/* The four marks are simple-icons 16.32.0 (CC0-1.0), copied byte for byte so
   nothing depends on the package at run time. Each is one flat path on a
   24x24 viewBox, the only kind of file <Icon> can paint: it is a mask, and
   every opaque pixel is painted. */
import x from '../../assets/footer/social/x.svg';
import tiktok from '../../assets/footer/social/tiktok.svg';
import discord from '../../assets/footer/social/discord.svg';
import telegram from '../../assets/footer/social/telegram.svg';
import './Footer.css';

/* URLs live in lib/sitemap.ts (SOCIAL_URLS) beside the other TODO(client)
   links, and behave the same way while empty: a real, focusable, named link
   whose click is cancelled. Order as specified: X, TikTok, Discord, Telegram. */
const SOCIALS = [
  { name: 'X', icon: x, href: SOCIAL_URLS.x },
  { name: 'TikTok', icon: tiktok, href: SOCIAL_URLS.tiktok },
  { name: 'Discord', icon: discord, href: SOCIAL_URLS.discord },
  { name: 'Telegram', icon: telegram, href: SOCIAL_URLS.telegram },
];

/* The glyph scales with the badge: `--glyph` is 20 design pixels on
   `.footer__social`, and 22px where the badge grows to a 44px tap target
   (Footer.css). <Icon> spreads `style` after its inline width/height, so this
   hands the size to CSS; 20px is the fallback. */
const GLYPH = { width: 'var(--glyph, 20px)', height: 'var(--glyph, 20px)' };

export function Footer() {
  // The band arrives when it is scrolled to; see Footer.motion.ts. `data-motion`
  // below holds the animated parts in CSS until this takes over.
  const ref = useSectionMotion<HTMLElement>(buildFooter);
  // Subscribed, so the FAQs link re-resolves ('#faq' on "/", '/#faq' on
  // /about) when the route changes under a pushState.
  const { path } = useRoute();

  return (
    <footer ref={ref} className="footer" data-motion="pending">
      <div className="container footer__inner">
        <hr className="footer__rule footer__rule--top" />

        <div className="footer__top">
          <div className="footer__brand">
            <Logo />
            {/* Approved copy, verbatim. Each sentence is its own block line so
                it is balanced separately (`text-wrap: balance` in Footer.css;
                Chromium will not balance across a <br/>), which keeps a lone
                word off the last line at every width. `.footer__nowrap` keeps
                "one-step" from breaking at its hyphen. */}
            <p className="footer__desc">
              <span className="footer__line">Trade the outcome, not the asset.</span>{' '}
              <span className="footer__line">
                Live markets, portfolio tracking, analytics and{' '}
                <span className="footer__nowrap">one-step</span> crypto deposits, all in one place.
              </span>
            </p>
          </div>

          <nav className="footer__columns" aria-label="Footer">
            {SITEMAP.map((g) => (
              <div key={g.title} className="footer__col">
                <h2 className="footer__col-title">{g.title}</h2>
                <ul className="footer__links">
                  {g.links.map((l) => (
                    <li key={l.label}><a {...linkProps(l.href, path)}><Roll>{l.label}</Roll></a></li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="footer__col footer__col--social">
              <h2 className="footer__col-title">Social</h2>
              {/* The anchor IS the badge, so the focus ring follows the circle.
                  Still a `.footer__links` list, so it takes the link colour
                  and hover, and the columns' entrance picks up the <li>s. */}
              <ul className="footer__links footer__socials">
                {SOCIALS.map((s) => (
                  <li key={s.name}>
                    <a
                      className="footer__social"
                      {...linkProps(s.href, path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Phorcast on ${s.name}`}
                    >
                      <Icon src={s.icon} w={20} h={20} style={GLYPH} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <hr className="footer__rule footer__rule--bottom" />

        <div className="footer__meta">
          <p>© 2026 Phorcast. All rights reserved.</p>
          <p>Information on this site does not constitute investment advice.</p>
        </div>
      </div>
    </footer>
  );
}
