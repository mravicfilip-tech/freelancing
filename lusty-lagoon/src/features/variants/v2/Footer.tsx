import { Link } from 'react-router-dom';
import { DiscordLogo, InstagramLogo, TelegramLogo, XLogo } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';

// A slim foot so the page ends on purpose. The wordmark, the help links, the socials and the age line.

const LINKS = [
  { to: '/faq', label: 'Help and FAQ' },
  { to: '/refer', label: 'Refer a friend' },
  { to: '/agent', label: 'Send to agent' },
  { to: '/wallet/deposit', label: 'Wallet' },
];

const SOCIALS = [
  { l: 'X', i: <XLogo weight="bold" className="h-4 w-4" /> },
  { l: 'Instagram', i: <InstagramLogo weight="bold" className="h-4 w-4" /> },
  { l: 'Telegram', i: <TelegramLogo weight="bold" className="h-4 w-4" /> },
  { l: 'Discord', i: <DiscordLogo weight="bold" className="h-4 w-4" /> },
];

export function Footer() {
  return (
    <footer className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-6">
      <div className="flex items-center gap-4">
        <Logo className="text-[20px] leading-[22px]" />
        <span className="flex h-8 items-center gap-2 rounded-full border border-white/[0.1] px-3 text-12 font-bold text-[rgb(var(--m2-ink2))]">
          <span className="num rounded-full bg-white/[0.08] px-2 text-ink">18+</span>
          Play responsibly
        </span>
      </div>
      <nav aria-label="Footer" className="flex items-center gap-6">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-full text-14 font-semibold text-[rgb(var(--m2-ink2))] outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {SOCIALS.map((s) => (
          <a key={s.l} href="#" aria-label={`Lusty Lagoon on ${s.l}`} className="m2-box m2-hover flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--m2-ink2))] outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
            {s.i}
          </a>
        ))}
      </div>
    </footer>
  );
}
