import { Link } from 'react-router-dom';
import { DiscordLogo, InstagramLogo, TelegramLogo, XLogo } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { cn } from '../../../lib/cn';
import { WRAP } from './icons';

const LINKS = [
  { to: '/wallet/deposit', label: 'Deposit' },
  { to: '/wallet/withdraw', label: 'Withdraw' },
  { to: '/agent', label: 'Send to agent' },
  { to: '/refer', label: 'Refer a friend' },
  { to: '/account', label: 'Account' },
  { to: '/faq', label: 'FAQ' },
];

const SOCIAL = [
  { l: 'X', i: <XLogo weight="bold" className="h-5 w-5" aria-hidden /> },
  { l: 'Instagram', i: <InstagramLogo weight="bold" className="h-5 w-5" aria-hidden /> },
  { l: 'Telegram', i: <TelegramLogo weight="bold" className="h-5 w-5" aria-hidden /> },
  { l: 'Discord', i: <DiscordLogo weight="bold" className="h-5 w-5" aria-hidden /> },
];

// The floor's footer, one panel with the wordmark, the money and help links, the socials and the
// age line.
export function Footer() {
  return (
    <footer className={cn(WRAP, 'pb-6')}>
      <div className="flex items-center gap-8 rounded-[24px] bg-[rgb(var(--k-panel))] px-8 py-6">
        <Logo className="text-[20px] leading-[22px]" />
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-2">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="flex h-11 items-center rounded-[12px] px-4 text-14 font-bold text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item))] hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {SOCIAL.map((x) => (
            <a key={x.l} href="#" aria-label={`Lusty Lagoon on ${x.l}`} className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink">
              {x.i}
            </a>
          ))}
          <span className="ml-2 flex h-11 items-center rounded-[12px] border-2 border-[rgb(var(--k-item))] px-3 font-display text-16 font-bold text-[rgb(var(--k-muted))]">18+</span>
        </div>
      </div>
    </footer>
  );
}
