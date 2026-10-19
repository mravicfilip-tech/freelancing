import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Gift } from '@phosphor-icons/react';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { GameTile } from '../../components/ui/GameTile';
import { MethodLogo } from '../../components/ui/MethodLogo';
import { Progress } from '../../components/ui/Progress';
import { Rail } from '../../components/ui/Rail';
import { StatusChip } from '../../components/ui/StatusChip';
import { COINS, CASH_METHODS } from '../../data/wallet';
import { GAMES } from '../../data/games';
import { FAQS } from '../faq/faqs';

// The landing page, rebuilt from the Figma's sections on the flat system. The hero text sits on the
// page ground and the art sits in its own stage, so no copy is laid over a busy image and no fade
// is needed to rescue it. One gold action per viewport.

const PARTNERS = ['Juwa City', 'Game Vault', 'Orion Stars', 'Milkyway', 'Firekirin', 'Ultra Panda', 'VBlink', 'Cash Machine', 'Gameroom', 'Mr All In One', 'Vegas Sweeps'];

const art = (name: string) => `/art/landing/${name}`;

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page">
      <div className="mx-auto flex max-w-canvas items-center gap-8 px-[var(--bl-page-pad)] py-3">
        <Link to="/" aria-label="Lusty Lagoon, home" className="rounded-lg">
          <Logo className="text-20" />
        </Link>
        <nav aria-label="Sections" className="flex items-center gap-6">
          {[
            ['#games', 'Games'],
            ['#how', 'How it works'],
            ['#partners', 'Partner platforms'],
            ['#faq', 'FAQ'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="inline-flex h-6 items-center text-14 font-medium text-ink2 transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="quiet">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function PayStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="text-14 text-ink3">Deposit with</span>
      <ul className="flex items-center gap-2" aria-label="Coins and payment methods">
        {COINS.map((c) => (
          <li key={c.id}>
            <img src={c.icon} alt={c.name} title={c.name} width={24} height={24} className="rounded-full ring-1 ring-ink/20" />
          </li>
        ))}
        {CASH_METHODS.filter((m) => m.kind !== 'bank').map((m) => (
          <li key={m.id} title={m.name}>
            <MethodLogo selection={{ kind: 'cash', methodId: m.id }} size="sm" />
            <span className="sr-only">{m.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hero() {
  const popular = GAMES.filter((g) => g.wide).slice(0, 5);
  return (
    <section aria-labelledby="hero-title" className="mx-auto flex max-w-canvas flex-col gap-12 px-[var(--bl-page-pad)] pt-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <h1 id="hero-title" className="font-display text-48 font-semibold text-ink">
          Where luck meets lust
        </h1>
        <p className="text-18 text-ink2">150+ slots and fish games from 11 partner platforms, on one balance. Crypto lands in minutes, cards at once.</p>
        <div className="flex items-center gap-3">
          <Button asChild size="lg">
            <Link to="/register">Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#games">See the games</a>
          </Button>
        </div>
        <PayStrip />
      </div>

      {/* The stage. Beach, the two hosts and the slot cabinet between its flower pillars. */}
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl border border-line">
        <img src={art('hero-beach.webp')} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img src={art('girl-wrap.webp')} alt="" className="absolute bottom-0 left-[3%] h-[96%] w-auto" />
        <img src={art('girl-offshoulder.webp')} alt="" className="absolute bottom-0 right-[3%] h-[96%] w-auto" />
        <div className="absolute bottom-0 left-1/2 flex h-[78%] -translate-x-1/2 items-end gap-0">
          <img src={art('pillar-flowers-left.webp')} alt="" className="relative z-[1] h-full w-auto" />
          <div className="-mx-6 mb-[6%] overflow-hidden rounded-xl border border-line">
            <img src={art('slot-chilli.webp')} alt="Chilli Madness reels" className="block h-auto w-[34vw]" />
          </div>
          <img src={art('pillar-flowers-right.webp')} alt="" className="relative z-[1] h-full w-auto" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4" aria-label="Popular right now">
        {popular.map((g) => (
          <Link key={g.id} to="/register" className="rounded-xl" aria-label={`${g.name}, create an account to play`}>
            <GameTile game={{ ...g, image: g.wide! }} shape="wide" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RightPlace() {
  return (
    <section aria-labelledby="pitch-title" className="mx-auto grid max-w-canvas grid-cols-12 items-center gap-12 px-[var(--bl-page-pad)]">
      <div className="col-span-5 flex flex-col gap-6">
        <h2 id="pitch-title" className="font-display text-40 font-semibold text-ink">
          You have come to the right place
        </h2>
        <p className="text-18 text-ink2">
          The pull of a Las Vegas floor, from your own sofa. Slots and fish games from trusted partner platforms, with new ones every week.
        </p>
        <div className="flex items-start gap-4 rounded-2xl border border-line bg-panel p-6">
          <Gift weight="fill" className="h-6 w-6 shrink-0 text-accent" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-16 font-semibold text-ink">150% on your first deposit</p>
            <p className="text-14 text-ink2">Deposit $100 and play with $250. The bonus lands with the deposit.</p>
          </div>
        </div>
        <div>
          <Button asChild size="lg">
            <Link to="/register">Register account</Link>
          </Button>
        </div>
      </div>
      <div className="relative col-span-7 aspect-[4/3] overflow-hidden rounded-3xl border border-line">
        <img src={art('casino-hall.webp')} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img src={art('pillar-girl.webp')} alt="" className="absolute bottom-0 left-[8%] h-[82%] w-auto" />
        <img src={art('girl-white.webp')} alt="" className="absolute bottom-0 right-[10%] h-[94%] w-auto" />
      </div>
    </section>
  );
}

const STEPS = [
  { title: 'Sign up', body: 'Create your account in a minute. Your partner platform logins come from your agent, or straight from us.' },
  { title: 'Deposit', body: 'Add money with crypto, a card or PayPal. Crypto lands in minutes, cards and PayPal at once.' },
  { title: 'Play', body: 'Pick from 150+ slots and fish games, and start playing.' },
];

function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto grid max-w-canvas scroll-mt-24 grid-cols-12 items-center gap-12 px-[var(--bl-page-pad)]">
      <div className="relative col-span-6 aspect-[4/3] overflow-hidden rounded-3xl border border-line">
        <img src={art('casino-courtyard.webp')} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="col-span-6 flex flex-col gap-8">
        <h2 id="how-title" className="font-display text-40 font-semibold text-ink">
          How to get started
        </h2>
        <ol className="flex flex-col gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent text-16 font-semibold text-ink">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-20 font-semibold text-ink">{s.title}</h3>
                <p className="text-16 text-ink2">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="mx-auto grid max-w-canvas scroll-mt-24 grid-cols-12 items-center gap-12 px-[var(--bl-page-pad)]">
      <div className="col-span-6 flex flex-col gap-6">
        <h2 id="partners-title" className="font-display text-40 font-semibold text-ink">
          Partner platforms
        </h2>
        <p className="text-18 text-ink2">Eleven game platforms, one Lusty Lagoon balance. Move credit to any of them through your agent.</p>
        <ul className="flex flex-wrap gap-2">
          {PARTNERS.map((p) => (
            <li key={p} className="flex h-10 items-center rounded-full border border-line bg-panel px-4 text-14 font-medium text-ink">
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative col-span-6 aspect-[4/3] overflow-hidden rounded-3xl border border-line">
        <img src={art('beach-cove.webp')} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img src={art('girl-offshoulder.webp')} alt="" className="absolute bottom-0 left-1/2 h-[92%] w-auto -translate-x-1/2" />
      </div>
    </section>
  );
}

// Decision 3. Three claims, each beside a real piece of the product instead of a stock icon tile.

function ProofPayouts() {
  const rows = [
    { dir: 'withdraw', sel: { kind: 'coin', coinId: 'btc' } as const, label: 'Bitcoin', amount: '−0.0125 BTC', when: '12 minutes' },
    { dir: 'withdraw', sel: { kind: 'cash', methodId: 'paypal' } as const, label: 'PayPal', amount: '−$250.00', when: '6 hours' },
    { dir: 'deposit', sel: { kind: 'coin', coinId: 'usdt' } as const, label: 'USDT on TRC20', amount: '+500.00 USDT', when: '1 minute' },
  ];
  return (
    <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-panel">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-4 px-6 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-raised">
            {r.dir === 'deposit' ? <ArrowDownLeft weight="bold" className="h-4 w-4 text-ink2" aria-hidden /> : <ArrowUpRight weight="bold" className="h-4 w-4 text-ink2" aria-hidden />}
          </span>
          <MethodLogo selection={r.sel} size="sm" />
          <span className="flex-1 text-16 text-ink">{r.label}</span>
          <span className="num text-14 text-ink3">in {r.when}</span>
          <span className="num text-right text-16 font-semibold text-ink">{r.amount}</span>
          <StatusChip status="completed" />
        </li>
      ))}
    </ul>
  );
}

function ProofMethods() {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-2xl border border-line bg-panel p-6">
      {COINS.map((c) => (
        <div key={c.id} className="flex items-center gap-3 rounded-xl border-2 border-line p-3">
          <img src={c.icon} alt="" width={24} height={24} className="rounded-full ring-1 ring-ink/20" />
          <span className="text-14 font-semibold text-ink">{c.symbol}</span>
        </div>
      ))}
      {CASH_METHODS.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-xl border-2 border-line p-3">
          <MethodLogo selection={{ kind: 'cash', methodId: m.id }} size="sm" />
          <span className="truncate text-14 font-semibold text-ink">{m.name}</span>
        </div>
      ))}
    </div>
  );
}

function ProofRank() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-center gap-3">
        <img src="/brand/rank-bronze.png" alt="" width={40} height={38} />
        <div className="flex flex-col">
          <span className="text-16 font-semibold text-ink">Bronze rank</span>
          <span className="text-14 text-ink2">Next is Silver</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between text-14">
        <span className="num text-ink">
          550,000 <span className="text-ink3">of 650,000 points</span>
        </span>
        <span className="num font-semibold text-ink">84%</span>
      </div>
      <Progress value={84} label="84% of the way to Silver" />
      <p className="flex items-center gap-2 text-14 text-ink2">
        <Gift weight="fill" className="h-5 w-5 text-accent" aria-hidden />
        Silver unlocks a cash drop. Drops grow up to $1,000 at the top rank.
      </p>
    </div>
  );
}

function WhyChoose() {
  const rows = [
    { title: 'Cash out in minutes, not days', body: 'Crypto withdrawals clear a short security check and usually arrive in under 20 minutes. You see the fee and the arrival time before you confirm.', piece: <ProofPayouts /> },
    { title: 'Pay the way you already do', body: 'Eight coins on the networks you use, plus Visa, Mastercard, PayPal and bank transfer. The wallet warns you before a wrong network can cost you.', piece: <ProofMethods /> },
    { title: 'Every game moves you up a rank', body: 'Points add up as you play. Each rank unlocks a bigger cash drop, up to $1,000 at the top.', piece: <ProofRank /> },
  ];
  return (
    <section aria-labelledby="why-title" className="mx-auto flex max-w-canvas flex-col gap-16 px-[var(--bl-page-pad)]">
      <h2 id="why-title" className="font-display text-40 font-semibold text-ink">
        Why players stay
      </h2>
      {rows.map((r) => (
        <div key={r.title} className="grid grid-cols-12 items-center gap-12">
          <div className="col-span-5 flex flex-col gap-3">
            <h3 className="font-display text-28 font-semibold text-ink">{r.title}</h3>
            <p className="text-18 text-ink2">{r.body}</p>
          </div>
          <div className="col-span-7">{r.piece}</div>
        </div>
      ))}
    </section>
  );
}

function Games() {
  return (
    <section id="games" aria-label="Games" className="mx-auto flex max-w-canvas scroll-mt-24 flex-col gap-8 px-[var(--bl-page-pad)]">
      <Rail
        id="games-title"
        title="Your jackpot is waiting"
        action={
          <Button asChild>
            <Link to="/register">Play now</Link>
          </Button>
        }
      >
        {GAMES.filter((g) => g.wide).map((g) => (
          <Link key={g.id} to="/register" className="w-1/4 shrink-0 snap-start rounded-xl" aria-label={`${g.name}, create an account to play`}>
            <GameTile game={{ ...g, image: g.wide! }} shape="wide" />
          </Link>
        ))}
      </Rail>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto grid max-w-canvas scroll-mt-24 grid-cols-12 gap-12 px-[var(--bl-page-pad)]">
      <div className="col-span-4 flex flex-col gap-3">
        <h2 id="faq-title" className="font-display text-40 font-semibold text-ink">
          Questions and answers
        </h2>
        <p className="text-18 text-ink2">Deposits, withdrawals, ranks and partner platforms, in plain words.</p>
      </div>
      <div className="col-span-8 rounded-2xl border border-line bg-panel px-6">
        <Accordion type="single" collapsible defaultValue={FAQS[0].id}>
          {FAQS.slice(0, 6).map((f) => (
            <AccordionItem key={f.id} value={f.id} title={f.q}>
              {f.a}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Footer() {
  const col = (title: string, items: string[]) => (
    <div className="flex flex-col gap-3">
      <h2 className="text-14 font-semibold text-ink">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i} className="text-14 text-ink2">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-canvas grid-cols-12 gap-12 px-[var(--bl-page-pad)] py-16">
        <div className="col-span-4 flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-14 text-ink2">A tropical casino with slots and fish games from 11 partner platforms.</p>
        </div>
        <div className="col-span-2">{col('Casino slots', ['Book of Ra', 'Starburst', 'Mega Moolah', "Gonzo's Quest", 'Buffalo Blitz'])}</div>
        <div className="col-span-2">{col('Payments', ['Bitcoin', 'Ethereum', 'Tether', 'Litecoin', 'Visa and Mastercard', 'PayPal'])}</div>
        <div className="col-span-4 flex flex-col gap-3">
          <h2 className="text-14 font-semibold text-ink">Site</h2>
          <ul className="flex flex-col gap-2">
            {[
              ['#how', 'How it works'],
              ['#partners', 'Partner platforms'],
              ['#faq', 'Questions and answers'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="inline-flex h-6 items-center text-14 text-ink2 hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/login" className="inline-flex h-6 items-center text-14 text-ink2 hover:text-ink">
                Log in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto max-w-canvas px-[var(--bl-page-pad)] pb-8 text-12 text-ink3">Lusty Lagoon 2026. For players 18 and over. Play responsibly.</p>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-page">
      <Header />
      <main id="main" className="flex flex-col gap-24 pb-24">
        <Hero />
        <RightPlace />
        <HowItWorks />
        <Partners />
        <WhyChoose />
        <Games />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
