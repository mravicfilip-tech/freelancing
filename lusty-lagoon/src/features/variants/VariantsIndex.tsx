import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { DASHBOARD_VARIANTS } from './variants';

// The dashboard variants side by side with the Figma 1 to 1 lobby they grew from.
export function VariantsIndex() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-12">
      <Logo />
      <h1 className="font-display text-32 font-bold text-ink">Dashboard variants</h1>
      <p className="text-16 text-ink2">Open one, then move between them with the bar at the bottom, the [ and ] keys, or a number key.</p>
      <ul className="flex flex-col gap-3">
        {DASHBOARD_VARIANTS.map((v) => (
          <li key={v.href}>
            <Link to={v.href} className="ll-card flex flex-col gap-1 p-4 hover:border-card-line/40">
              <span className="text-18 font-semibold text-ink">
                {v.short ? v.label : `${v.key}. ${v.label}`}
              </span>
              <span className="text-14 text-ink2">{v.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
