/* The footer, rebuilt to the client's supplied design.
   ---------------------------------------------------------------------------
   Three columns and a brand block between two hairlines, closed by a two-ended
   bottom bar. What it replaced was four columns (Product / Markets / Company /
   Resources), a row of four bare social icon buttons, a Terms/Privacy/Cookies
   legal row, and a giant cropped PHORCAST wordmark over a four-disc glow.

   THREE THINGS THE DESIGN SAYS THAT THIS FILE DOES NOT DO, each raised rather
   than decided:

   1. THE SPELLING. The supplied screenshot sets the brand as "Phorecast",
      with an e, and the domain is phorecast.io. Every other surface in this
      codebase -- the wordmark in <Logo>, the FAQ copy, the About page, the
      <title> -- and the Figma file say "Phorcast". Introducing a second
      spelling in the one place the brand is stated twice (the wordmark and
      the copyright line) would be the worst of both, so this keeps the
      codebase's spelling and the question goes to the client.

   2. THE ABOUT LINK IS GONE. It lived in the Company column, which the new
      design does not have, and pointed at /about -- a real route. Nothing
      here links to it any more. The page is NOT orphaned: <Nav>'s MORE menu
      carries it on both surfaces (src/components/Nav.tsx, MORE_LINKS), which
      is the only reason implementing the design as drawn was safe to do.

   3. THE DESCRIPTION IS PREDICTION-MARKET COPY. "A prediction platform and
      event markets" is the client's own wording from the screenshot, and this
      band renders on the landing page, whose copy was deliberately moved away
      from that story (commit 24fbbc1). The design is implemented as given;
      the tension is the client's to resolve.

   MOTION lives in Footer.motion.ts and the `data-motion="pending"` hold that
   goes with it is at the foot of Footer.css. */
import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { Roll } from '../Roll';
import { useSectionMotion } from '../../lib/motion';
import { buildFooter } from './Footer.motion';
/* NOT src/assets/social/telegram.svg, which is a 44x44 export that draws its
   own rounded-SQUARE plate and border inside the file, under the glyph. <Icon>
   is a mask, so every opaque pixel in the file is painted -- that plate
   included -- and the design's badge is a CIRCLE. This is the same glyph path,
   byte for byte, on a 24x24 viewBox with the plate left out; the badge is now
   drawn in CSS where the theme can reach it. It sits beside the component
   rather than in src/assets because it exists for this one band, which is the
   arrangement HeroLogo/logo-outline.svg already uses.

   The three icons that fall out of the design -- x, discord, tiktok -- are
   left on disk untouched. They were only ever imported here (checked), so they
   are now unreferenced, but deleting an asset is not this job. */
import telegram from './telegram-glyph.svg';
import './Footer.css';

/* A link is usually just its label, and its href is that label slugged. Every
   one of these is a placeholder pointing at a fragment that does not exist
   yet, exactly as the four columns before them were; the union that let a
   single entry carry a real href went with the About link it existed for. */
const slug = (label: string) =>
  `#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const COLUMNS = [
  { title: 'Product', links: ['Markets', 'Portfolio', 'Leaderboard', 'Deposit', 'Withdraw'] },
  {
    title: 'Legal',
    links: ['Terms of Service', 'Privacy Policy', 'Risk Disclosure', 'Deposit & Withdrawal Policy'],
  },
];

const SOCIALS = ['Telegram channel', 'Telegram chat'];

/* The glyph is geometry, so it rides the band's design pixel like the badge
   around it. <Icon> writes width/height inline from `w`/`h`, and spreads
   `style` after them, so this is the supported way to hand the box to CSS;
   the 20/20 stays as the value a styleless render would land on. */
const GLYPH = { width: 'calc(20 * var(--u))', height: 'calc(20 * var(--u))' };

export function Footer() {
  // The band arrives when it is scrolled to; see Footer.motion.ts. `data-motion`
  // below holds the animated parts in CSS until this takes over.
  const ref = useSectionMotion<HTMLElement>(buildFooter);

  return (
    <footer ref={ref} className="footer" data-motion="pending">
      <div className="container footer__inner">
        <hr className="footer__rule footer__rule--top" />

        <div className="footer__top">
          <div className="footer__brand">
            <Logo />
            <p className="footer__desc">
              A prediction platform and event markets.<br />
              Analytics, portfolio and convenient deposit options.
            </p>
            {/* One link, in a list, carrying `.footer__links` -- which is what
                global.css's roll-hover selectors address and what paints a
                footer link. A bare <a> here would be the only link in the band
                without the hover. */}
            <ul className="footer__links footer__contacts">
              <li><a href="#contacts"><Roll>Contacts</Roll></a></li>
            </ul>
          </div>

          <nav className="footer__columns" aria-label="Footer">
            {COLUMNS.map((c) => (
              <div key={c.title} className="footer__col">
                <h2 className="footer__col-title">{c.title}</h2>
                <ul className="footer__links">
                  {c.links.map((l) => (
                    <li key={l}><a href={slug(l)}><Roll>{l}</Roll></a></li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="footer__col footer__col--social">
              <h2 className="footer__col-title">Social</h2>
              <ul className="footer__links footer__socials">
                {SOCIALS.map((s) => (
                  <li key={s}>
                    <a href={slug(s)}>
                      <span className="footer__badge">
                        <Icon src={telegram} w={20} h={20} style={GLYPH} />
                      </span>
                      <Roll>{s}</Roll>
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
