/* The footer, rebuilt to the client's supplied design.
   ---------------------------------------------------------------------------
   Three columns and a brand block between two hairlines, closed by a two-ended
   bottom bar. What it replaced was four columns (Product / Markets / Company /
   Resources), a row of four bare social icon buttons, a Terms/Privacy/Cookies
   legal row, and a giant cropped PHORCAST wordmark over a four-disc glow.

   TWO THINGS THE DESIGN SAYS THAT THIS FILE DOES NOT DO, each raised rather
   than decided, and one the client has since settled:

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

   3. THE DESCRIPTION, SETTLED. The screenshot's "A prediction platform and
      event markets" was prediction-market copy on a landing page whose copy
      had moved away from that story (commit 24fbbc1). The client has since
      replaced it, word for word, with the two sentences under the logo, and
      removed the Contacts link that stood under them. There was never a
      Contacts page or route -- the link pointed at `#contacts`, a fragment
      nothing on either page carries -- so the link was all there was to go.

   MOTION lives in Footer.motion.ts and the `data-motion="pending"` hold that
   goes with it is at the foot of Footer.css. */
import type { MouseEvent } from 'react';
import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { Roll } from '../Roll';
import { useSectionMotion } from '../../lib/motion';
import { buildFooter } from './Footer.motion';
/* The four marks are simple-icons 16.32.0 (CC0-1.0), copied byte for byte
   from the package's icons/ directory so nothing here depends on it at run
   time: the current X mark, TikTok, Discord's Clyde and Telegram's plane in
   its disc. Each is one flat path on transparent on a 24x24 viewBox, which is
   the only kind of file <Icon> can paint -- it is a mask, and every opaque
   pixel is painted.

   The Telegram file is the same path the single glyph here was drawn from
   before (footer/telegram-glyph.svg, now deleted): that file was this path
   translated by 10,10 inside a 44x44 Figma frame. So the Telegram badge is
   unchanged in drawing, and the other three now come from the same source.

   NOT src/assets/social/*. Those are 44x44 Figma exports that draw their own
   rounded-SQUARE plate and border inside the file, under the glyph, and a mask
   paints the plate too. They are unreferenced and left on disk untouched. */
import x from '../../assets/footer/social/x.svg';
import tiktok from '../../assets/footer/social/tiktok.svg';
import discord from '../../assets/footer/social/discord.svg';
import telegram from '../../assets/footer/social/telegram.svg';
import './Footer.css';

/* WHERE THE FOUR ICONS GO. TODO(client): send the four URLs.
   ---------------------------------------------------------------------------
   Empty on purpose, and nothing here is a guess: no social URL exists in this
   repository, and the brief is "put empty links for now". Paste each URL in
   as it arrives; that is the whole change, one line each.

   An empty href still has to behave. The anchor keeps `href=""`, so it is a
   real, focusable link with its accessible name and the markup is already
   final; but an empty href means "this page", so a click would reload it.
   `stayPut` below cancels the click (and the middle click) for exactly the
   entries that are still empty, and nothing else. NOT `href="#"`, which jumps
   the page to the top, and not a missing href, which stops it being a link or
   a tab stop.

   One Telegram icon: the design's two Telegram rows (channel and chat) are
   now the client's single "Telegram". */
const SOCIAL_URLS = {
  x: '',
  tiktok: '',
  discord: '',
  telegram: '',
};

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

/* In the client's order: "X, TikTok, Discord, Telegram". */
const SOCIALS = [
  { name: 'X', icon: x, href: SOCIAL_URLS.x },
  { name: 'TikTok', icon: tiktok, href: SOCIAL_URLS.tiktok },
  { name: 'Discord', icon: discord, href: SOCIAL_URLS.discord },
  { name: 'Telegram', icon: telegram, href: SOCIAL_URLS.telegram },
];

/* See SOCIAL_URLS: an empty link stays where it is. */
const stayPut = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault();

/* The glyph is geometry, so it rides the band's design pixel like the badge
   around it: `--glyph` is 20 design pixels on `.footer__social`, and 22px where
   the badge grows to a 44px tap target (Footer.css). <Icon> writes
   width/height inline from `w`/`h`, and spreads `style` after them, so this is
   the supported way to hand the box to CSS; the 20/20 stays as the value a
   styleless render would land on. */
const GLYPH = { width: 'var(--glyph, 20px)', height: 'var(--glyph, 20px)' };

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
            {/* The client's copy, character for character. The <br/> gives
                the short first sentence a line of its own, as the design's
                two sentences had; the second then wraps inside the brand
                column. Two phrases are held together: "one-step", so the line
                can never break at its hyphen, and "all in one place.", so the
                sentence never ends on "one place." or "place." alone (it did
                at 1280, 600 and 320 without it). */}
            <p className="footer__desc">
              Trade the outcome, not the asset.<br />
              Live markets, portfolio tracking, analytics and{' '}
              <span className="footer__nowrap">one-step</span> crypto deposits,{' '}
              <span className="footer__nowrap">all in one place.</span>
            </p>
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
              {/* A row of four badges, the anchor IS the badge: the focus
                  ring then follows the circle rather than a square round it.
                  Still a `.footer__links` list, so the anchor takes the band's
                  link colour and its hover, and the columns' entrance picks
                  the four <li> up with no beat of its own. */}
              <ul className="footer__links footer__socials">
                {SOCIALS.map((s) => (
                  <li key={s.name}>
                    <a
                      className="footer__social"
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Phorcast on ${s.name}`}
                      onClick={s.href ? undefined : stayPut}
                      onAuxClick={s.href ? undefined : stayPut}
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
