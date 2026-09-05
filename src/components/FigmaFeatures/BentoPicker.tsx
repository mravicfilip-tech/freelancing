import { useMemo, useState } from 'react';
import { FigmaFeatures } from './FigmaFeatures';
import { MOTION } from './illustrations';
import { DEFAULT_PICKS, type MotionPicks } from './useFeaturesMotion';
import './BentoPicker.css';

const CARDS: [string, string][] = [
  ['pay', 'Pay Remittix'],
  ['fx', 'Zero FX fees'],
  ['simple', 'Made simple'],
  ['fast', 'Super fast'],
  ['ui', 'User-friendly'],
];

/** Reads `?bento=2,1,3,4,5` (one 1-based choice per card, in CARDS order) into picks. */
export function picksFromParam(value: string | null): MotionPicks {
  const picks: MotionPicks = {};
  if (!value) return picks;
  value.split(',').forEach((n, i) => {
    const id = CARDS[i]?.[0];
    const v = Number(n) - 1;
    if (id && v >= 0 && v < (MOTION[id]?.variants.length ?? 0)) picks[id] = v;
  });
  return picks;
}

/**
 * Review page for the bento grid's loop variants (`/?bento-picker`). Each card offers five loops;
 * choosing one re-mounts the section so the load-in replays and the chosen loop follows. The code
 * line at the bottom is what to send back, and it also works on the real page as `?bento=`.
 */
export function BentoPicker() {
  const [picks, setPicks] = useState<MotionPicks>(() => ({ ...DEFAULT_PICKS, ...picksFromParam(new URLSearchParams(window.location.search).get('bento')) }));
  const [replay, setReplay] = useState(0);
  const code = useMemo(() => CARDS.map(([id]) => (picks[id] ?? DEFAULT_PICKS[id] ?? 0) + 1).join(','), [picks]);
  const key = `${code}-${replay}`;
  return (
    <div className="bp">
      <FigmaFeatures key={key} picks={picks} />
      <aside className="bp__panel" aria-label="Loop variants">
        {CARDS.map(([id, label]) => {
          const variants = MOTION[id].variants;
          const v = picks[id] ?? DEFAULT_PICKS[id] ?? 0;
          return (
            <section key={id} className="bp__group">
              <h4 className="bp__name">{label}</h4>
              <div className="bp__options">
                {variants.map((variant, i) => (
                  <button key={variant.name} type="button" className={`bp__opt${i === v ? ' bp__opt--on' : ''}`} onClick={() => setPicks({ ...picks, [id]: i })}>
                    <b>{i + 1}</b> {variant.name}
                  </button>
                ))}
              </div>
              <p className="bp__blurb">{variants[v].blurb}</p>
            </section>
          );
        })}
        <footer className="bp__foot">
          <code className="bp__code">?bento={code}</code>
          <button type="button" className="bp__replay" onClick={() => setReplay((n) => n + 1)}>
            Replay load-in
          </button>
        </footer>
      </aside>
    </div>
  );
}
