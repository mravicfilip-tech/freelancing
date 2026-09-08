import { useState } from 'react';
import { FigmaTokenomics } from './FigmaTokenomics';
import { TOK_VARIANTS, type TokVariant } from './useTokenomicsMotion';
import './TokPicker.css';

/** Reads `?tok=3` into a variant number. */
export function tokFromParam(value: string | null): TokVariant {
  const n = Number(value);
  return (n >= 1 && n <= TOK_VARIANTS.length ? n : 1) as TokVariant;
}

/**
 * Review page for the tokenomics motion variants (`/?tok-picker`). Choosing one re-mounts the
 * section so the entrance replays. The code at the bottom also works on the real page as `?tok=`.
 */
export function TokPicker() {
  const [variant, setVariant] = useState<TokVariant>(() => tokFromParam(new URLSearchParams(window.location.search).get('tok')));
  const [replay, setReplay] = useState(0);

  return (
    <div className="tp">
      <FigmaTokenomics key={`${variant}-${replay}`} variant={variant} />
      <aside className="tp__panel" aria-label="Motion variants">
        <h4 className="tp__name">Tokenomics motion</h4>
        <div className="tp__options">
          {TOK_VARIANTS.map((v, i) => (
            <button
              key={v.name}
              type="button"
              className={`tp__opt${i + 1 === variant ? ' tp__opt--on' : ''}`}
              onClick={() => setVariant((i + 1) as TokVariant)}
            >
              <b>{i + 1}</b> {v.name}
            </button>
          ))}
        </div>
        <p className="tp__blurb">{TOK_VARIANTS[variant - 1].blurb}</p>
        <footer className="tp__foot">
          <code className="tp__code">?tok={variant}</code>
          <button type="button" className="tp__replay" onClick={() => setReplay((n) => n + 1)}>
            Replay
          </button>
        </footer>
      </aside>
    </div>
  );
}
