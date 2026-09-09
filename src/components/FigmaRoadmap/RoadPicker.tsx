import { useState } from 'react';
import { FigmaRoadmap, ROAD_VARIANTS, type RoadVariant } from './FigmaRoadmap';
import './RoadPicker.css';

/** Reads `?road=3` into a direction number; 0, the default, is the design of record. */
export function roadFromParam(value: string | null): RoadVariant | 0 {
  const n = Number(value);
  return (n >= 1 && n <= ROAD_VARIANTS.length ? n : 0) as RoadVariant | 0;
}

/**
 * Review page for the five roadmap directions (`/?road-picker`). Choosing one re-mounts the
 * section so the entrance replays. The code at the bottom also works on the real page as `?road=`.
 */
export function RoadPicker() {
  const [variant, setVariant] = useState<RoadVariant>(
    () => (roadFromParam(new URLSearchParams(window.location.search).get('road')) || 1) as RoadVariant,
  );
  const [replay, setReplay] = useState(0);

  return (
    <div className="rp">
      <FigmaRoadmap key={`${variant}-${replay}`} variant={variant} />
      <aside className="rp__panel" aria-label="Roadmap directions">
        <h4 className="rp__name">Roadmap direction</h4>
        <div className="rp__options">
          {ROAD_VARIANTS.map((v, i) => (
            <button
              key={v.name}
              type="button"
              className={`rp__opt${i + 1 === variant ? ' rp__opt--on' : ''}`}
              onClick={() => setVariant((i + 1) as RoadVariant)}
            >
              <b>{i + 1}</b> {v.name}
            </button>
          ))}
        </div>
        <p className="rp__blurb">{ROAD_VARIANTS[variant - 1].blurb}</p>
        <footer className="rp__foot">
          <code className="rp__code">?road={variant}</code>
          <button type="button" className="rp__replay" onClick={() => setReplay((n) => n + 1)}>
            Replay
          </button>
        </footer>
      </aside>
    </div>
  );
}
