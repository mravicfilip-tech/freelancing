// The servis map, the second half of S, round 5. Filip's pick, the Mreža map (option 1) with road 1, twelve roads that run
// from Čurug and Vrčin to the ends of Serbia and stop inside its border (taste 2026-10-14 10:10 and 10:40). The map scales
// with the stage and stands centred between the centre grid line and the right one, from the top rule to the foot of the
// frame. It draws on from the scroll. The shell sets --k on the layer, 0 to 1 over the map's span (SERVIS_MAP in
// timeline.ts), and every part reads its own window of k in CSS, see map.css. With no --k, the reduced motion still, every
// part shows in full.
import { useMemo, type CSSProperties } from 'react';
import { Btn, Fill, Marker, TitleLines, between } from '../ui';
import { markers, servisMap } from '../../copy';
import { BASES, MAP, fit, pathOf, unfit, type LonLat, type Pt } from './geo';
import { reach } from './roads';
import './map.css';

// the map's own drawing space, the size it was picked at on a 1440 by 900 stage, scaled to the stage by its viewBox
const W = 659;
const H = 764;

// draw on windows, in k of the map's span
const K = {
  neighbours: [0, 0.12],
  outline: [0, 0.16],
  rivers: [0.06, 0.2],
  bases: [0.12, 0.15],
  roads: [0.16, 0.3],
  road: 0.14,
};

function lengthOf(d: string) {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  return p.getTotalLength();
}

const win = (a: number, b: number, len: number) => ({ '--a': a, '--b': b, '--len': len.toFixed(1) }) as CSSProperties;

export function ServisMap() {
  const P = useMemo(() => fit(W, H, 0), []);
  const inv = useMemo(() => unfit(W, H, 0), []);
  const parts = useMemo(() => {
    const neighbours = pathOf(MAP.neighbours, P);
    const outline = pathOf([...MAP.serbia, ...MAP.kosovo], P);
    const rivers = MAP.rivers.map((r) => pathOf([r.pts], P, false));
    // roads start in turn, Čurug and Vrčin interleaved, each takes K.road of k
    const roads = reach(P, inv)
      .map((r, i, all) => ({ ...r, a: K.roads[0] + (i / Math.max(1, all.length - 1)) * (K.roads[1] - K.roads[0]) }))
      .map((r) => ({ ...r, b: r.a + K.road, len: lengthOf(r.d) }));
    return {
      neighbours: { d: neighbours, len: lengthOf(neighbours) },
      outline: { d: outline, len: lengthOf(outline) },
      rivers: rivers.map((d) => ({ d, len: lengthOf(d) })),
      roads,
    };
  }, [P, inv]);
  const pct = (p: Pt): CSSProperties => ({ left: `${((p[0] / W) * 100).toFixed(3)}%`, top: `${((p[1] / H) * 100).toFixed(3)}%` });
  return (
    <div className="sm-live">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <clipPath id="smv-serbia">
            <path d={parts.outline.d} />
          </clipPath>
          {parts.roads.map((r) => (
            <mask id={`smv-m-${r.key}`} key={r.key} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
              <path className="smd" d={r.d} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" style={win(r.a, r.b, r.len)} />
            </mask>
          ))}
        </defs>
        {/* the neighbours run on to the grid lines and the rules, where the figure clips them, see .sm-fig-live */}
        <g>
          <path className="smd" d={parts.neighbours.d} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth={1} strokeLinejoin="round" style={win(K.neighbours[0], K.neighbours[1], parts.neighbours.len)} />
        </g>
        {/* the outer border as one line, a stroke twice the width with the fill over it, see the options file */}
        <path className="smd" d={parts.outline.d} fill="none" stroke="rgb(255 255 255 / 0.92)" strokeWidth={2} strokeLinejoin="round" style={win(K.outline[0], K.outline[1], parts.outline.len)} />
        <path d={parts.outline.d} fill="#000" />
        {/* the rivers are drawn inside Serbia only, so none ends in the air where the data stops */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#smv-serbia)">
          {parts.rivers.map((r, i) => (
            <path key={i} className="smd" d={r.d} stroke={`rgb(255 255 255 / ${MAP.rivers[i].name === 'Danube' ? 0.33 : 0.22})`} strokeWidth={MAP.rivers[i].name === 'Danube' ? 1.5 : 1} style={win(K.rivers[0], K.rivers[1], r.len)} />
          ))}
        </g>
        <g fill="none">
          {parts.roads.map((r) => (
            <g key={r.key} mask={`url(#smv-m-${r.key})`}>
              <path d={r.d} stroke="rgb(255 255 255 / 0.16)" strokeWidth={5} strokeLinecap="round" />
              <path className="sm-flow" d={r.d} stroke="rgb(255 255 255 / 0.9)" strokeWidth={1} strokeDasharray="5 7" style={{ '--p': 12 } as CSSProperties} />
            </g>
          ))}
        </g>
        <g stroke="#fff" strokeWidth={1}>
          {parts.roads.map((r) => {
            const [x, y] = r.end.map((v) => Math.round(v) + 0.5);
            return <path key={r.key} className="sme" d={`M${x - 4} ${y}H${x + 5}M${x} ${y - 4}V${y + 5}`} style={{ '--b': r.b } as CSSProperties} />;
          })}
        </g>
      </svg>
      {BASES.map((b) => {
        const up = b.id === 'vrcin';
        return (
          <div key={b.id} className={`sm-base${up ? ' is-up' : ''}`} style={pct(P(b.ll as LonLat))}>
            <i className="p-dot sm-dot smb" style={{ '--a': K.bases[0], '--b': K.bases[1] } as CSSProperties} />
            <span className="sm-name" data-wipe={6}>
              {b.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SMPane() {
  const c = servisMap;
  return (
    <div className="s2-pane sm-pane">
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.s} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <ul className="sm-bases sm-bases-live blk at-bottom" style={between(1, 3)} data-rule="t">
        {c.bases.map((b, i) => (
          <li key={b.id}>
            <i className="p-dot sm-dot" aria-hidden="true" data-wipe={7 + i} />
            <b className="fig" data-wipe={7 + i}>
              {b.label}
            </b>
            <span className="line" data-wipe={8 + i}>
              {b.line}
            </span>
            <address className="sm-adr">
              <span data-wipe={9 + i}>{b.address}</span>
              <a href={b.phone.tel} data-cta="call-service" data-wipe={10 + i}>
                {b.phone.number}
              </a>
            </address>
          </li>
        ))}
      </ul>
      <figure className="sm-fig sm-fig-live" style={between(3, 5)} aria-label="Mapa Srbije sa servisnim centrima u Vrčinu i Čurugu">
        <ServisMap />
      </figure>
    </div>
  );
}
