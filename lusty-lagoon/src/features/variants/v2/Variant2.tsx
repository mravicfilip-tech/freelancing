import { Logo } from '../../../components/ui/Logo';
import '../kit/kit.css';

// Variant 2, Mascot stage, round 5. A placeholder so the route and the switcher hold its slot while
// the direction is built. The brief is studio/clients/lusty-lagoon/briefs/round-5/consolidated.md.
export default function Variant2() {
  return (
    <main className="k-page flex min-h-screen flex-col items-start gap-4 p-12">
      <Logo />
      <h1 className="font-display text-40 font-bold text-ink">Mascot stage</h1>
      <p className="text-16 text-ink2">This direction is being built.</p>
    </main>
  );
}
