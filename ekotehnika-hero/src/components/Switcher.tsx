// Review chrome for comparing the three motion variants. Not part of the design.
import type { Variant } from './Stage';

const names: Record<Variant, string> = { 1: 'Izbor usluge', 2: 'Podizanje', 3: 'Linija na podu' };

export function Switcher({ variant, onPick }: { variant: Variant; onPick: (v: Variant) => void }) {
  return (
    <div className="switcher" role="group" aria-label="Varijante animacije, tasteri 1, 2 i 3">
      {([1, 2, 3] as const).map((v) => (
        <button key={v} type="button" aria-pressed={v === variant} title={names[v]} onClick={() => onPick(v)}>
          V{v}
        </button>
      ))}
    </div>
  );
}
