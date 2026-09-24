import { CONTACT_EMAILS, FOOTER_NAV, HOME_URL, LEGAL_NAV, SOCIAL_LINKS } from '../site/navigation';
import logoMarkLarge from './assets/logo-mark-lg.svg';
import arrowUpRight from './assets/arrow-up-right.svg';
import iconX from './assets/social-x.svg';
import iconTelegram from './assets/social-telegram.svg';
import iconInstagram from './assets/social-instagram.svg';

const SOCIALS = [
  { label: 'X', icon: iconX, href: SOCIAL_LINKS.x },
  { label: 'Telegram', icon: iconTelegram, href: SOCIAL_LINKS.telegram },
  { label: 'Instagram', icon: iconInstagram, href: SOCIAL_LINKS.instagram },
];
const LEGAL = [LEGAL_NAV.privacy, LEGAL_NAV.terms];

/**
 * Source order follows the mobile footer (brand, socials, links, contact, policies, disclaimer);
 * the desktop grid places the same nodes into the two-column layout.
 */
export function SiteFooter() {
  return (
    <footer className="rtx-footer">
      <div className="rtx-footer__inner">
        <a className="rtx-footer__brand" href={HOME_URL}>
          <img src={logoMarkLarge} width={73} height={38} alt="" />
          Remittix
        </a>

        <nav className="rtx-footer__links" aria-label="Footer">
          <ul className="rtx-footer__social">
            {SOCIALS.map(({ label, icon, href }) => (
              <li key={label} aria-hidden={href ? undefined : true}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Remittix on ${label}`}>
                    <img src={icon} width={25} height={25} alt="" />
                  </a>
                ) : (
                  <img src={icon} width={25} height={25} alt="" />
                )}
              </li>
            ))}
          </ul>
          {FOOTER_NAV.map((group, i) => (
            <div className="rtx-footer__group" key={LEGAL[i].href}>
              <ul className="rtx-footer__menu">
                {group.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
              <a className="rtx-footer__policy" href={LEGAL[i].href}>
                {LEGAL[i].label}
              </a>
            </div>
          ))}
          <div className="rtx-footer__contact">
            <p className="rtx-footer__contact-title">
              Contact info
              <img src={arrowUpRight} width={13} height={13} alt="" />
            </p>
            <ul>
              {CONTACT_EMAILS.map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="rtx-footer__legal">
          <p className="rtx-footer__disclaimer-title">Disclaimer:</p>
          <p className="rtx-footer__disclaimer">
            Digital currencies may be unregulated in your jurisdiction. The value of digital currencies may go down
            as well as up. Profits may be subject to capital gains or other taxes applicable in your jurisdiction.
          </p>
          <p className="rtx-footer__copyright">© All Rights reserved by Remittix - 2024</p>
        </div>
      </div>
    </footer>
  );
}
