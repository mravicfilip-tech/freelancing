import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';

// The five dashboard variants side by side with the Figma 1 to 1 lobby they grew from.
const VARIANTS = [
  { to: '/lobby', name: 'Baseline', line: 'The Figma Dashboard frame, 1 to 1, with the review notes applied.' },
  { to: '/variants/1', name: '1. Social lagoon', line: 'Three columns with a live chat rail and the daily chest on top of it.' },
  { to: '/variants/2', name: '2. Sunset stage', line: 'A full width sunset stage with your recent games docked on its edge.' },
  { to: '/variants/3', name: '3. Rank road', line: 'Your rank, chest, race and rewards first, the games after.' },
  { to: '/variants/4', name: '4. Casino floor', line: 'Walk into a room, slots, megaways, hold and win, then find a game fast.' },
  { to: '/variants/5', name: '5. Quiet vault', line: 'Money and live wagers first, calm surfaces, art used once.' },
];

export function VariantsIndex() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-12">
      <Logo />
      <h1 className="font-display text-32 font-bold text-ink">Dashboard variants</h1>
      <ul className="flex flex-col gap-3">
        {VARIANTS.map((v) => (
          <li key={v.to}>
            <Link to={v.to} className="ll-card flex flex-col gap-1 p-4 hover:border-card-line/40">
              <span className="text-18 font-semibold text-ink">{v.name}</span>
              <span className="text-14 text-ink2">{v.line}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
