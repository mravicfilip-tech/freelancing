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

// The floor's footer, CS2's utility bar turned into one panel with a clipped corner. The wordmark,
// the money and help links as quiet grey text, the socials in slate squares and the age mark.
export function Footer() {
  return (
    <footer className={cn(WRAP, 'pb-6')}>
      <div className="v4-cut flex h-[88px] items-center gap-8 bg-[rgb(var(--v4-top))] px-8 [--cut:16px]">
        <Logo className="text-[20px] leading-[22px]" />
        <span aria-hidden className="h-8 w-[1px] bg-white/[0.08]" />
        <nav aria-label="Footer" className="flex items-center gap-1">
          {LINKS.map((l) => (
            <Link key={l.to + l.label} to={l.to} className="flex h-10 items-center rounded-[4px] px-3 text-14 font-semibold text-[rgb(var(--v4-muted))] outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {SOCIAL.map((x) => (
            <a
              key={x.l}
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label={`Lusty Lagoon on ${x.l}`}
              className="v4-toplight flex h-10 w-10 items-center justify-center rounded-[4px] border border-white/[0.07] bg-[rgb(var(--v4-raised))] text-[rgb(var(--v4-muted))] outline-none transition-colors hover:border-white/[0.14] hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
            >
              {x.i}
            </a>
          ))}
          <span className="ml-3 flex h-10 items-center gap-2 border-l border-white/[0.08] pl-[20px] text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--v4-label))]">
            <span className="flex h-[28px] items-center rounded-[3px] border border-white/[0.2] px-2 text-14 font-extrabold tracking-normal text-ink">18+</span>
            Play responsibly
          </span>
        </div>
      </div>
    </footer>
  );
}
