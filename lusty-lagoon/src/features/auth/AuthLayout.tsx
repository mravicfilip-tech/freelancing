import type { ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';

const ART = {
  login: { back: '/art/auth/login-beach.webp', player: '/art/auth/login-player.webp', alt: 'A player in a white top and shorts on a tropical beach under a blue sky.' },
  register: { back: '/art/auth/register-sunset.webp', player: '/art/auth/register-player.webp', alt: 'A smiling player in a floral dress on a tropical beach at sunset.' },
} as const;

// Full screen, outside the app shell. The form sits on the left half over the page ground, and a
// rounded art panel with a tropical casino scene takes the right half. The art is hero art, so it
// carries the one low contrast scrim the system allows.
export function AuthLayout({ art, children }: { art: keyof typeof ART; children: ReactNode }) {
  const a = ART[art];
  return (
    <div className="flex min-h-screen bg-page">
      <main className="flex w-1/2 flex-col px-12 py-8">
        <Link to="/" aria-label="Lusty Lagoon home" className="self-start rounded-lg">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="flex w-full max-w-[26rem] flex-col gap-6">{children}</div>
        </div>
      </main>
      <aside className="w-1/2 p-4 pl-0">
        <div className="relative h-full min-h-[40rem] overflow-hidden rounded-3xl bg-panel">
          <img src={a.back} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-page/80 via-page/10 to-transparent" />
          <img src={a.player} alt={a.alt} className="absolute bottom-0 left-1/2 h-[78%] max-w-none -translate-x-1/2" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1 rounded-xl bg-page/80 p-4">
            <p className="font-display text-24 font-semibold text-ink">Lust and play</p>
            <p className="text-14 text-ink2">Crypto, fun and games on the lagoon.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function AuthHeading({ id = 'step-title', title, lead }: { id?: string; title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 id={id} tabIndex={-1} className="font-display text-32 font-semibold text-ink outline-none">
        {title}
      </h1>
      {lead && <p className="text-16 text-ink2">{lead}</p>}
    </div>
  );
}

// A form level error. Danger colour, an icon and words. Callout has no danger tone, so this lives here.
export function FormAlert({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger bg-sunken p-4 text-14">
      <WarningCircle weight="bold" className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-ink2">{children}</p>
      </div>
    </div>
  );
}
