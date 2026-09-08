import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTokenomicsMotion, type TokVariant } from './useTokenomicsMotion';
import { DIAL, SEGMENTS, WIRES, slicePath } from './dial';
import './FigmaTokenomics.css';

const A = (n: string) => `/figma/tokenomics/${n}.svg`;

/** The band is drawn at its design size and scaled to the frame, so every offset stays exact. */
function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => el.style.setProperty('--k', String(el.clientWidth / 1560));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="tk__fit">
      <div className="tk__stage">{children}</div>
    </div>
  );
}

const COINS: { id: string; x: number; y: number }[] = [
  { id: 'coin-btc', x: 136, y: 134 },
  { id: 'coin-eth', x: 226, y: 293 },
  { id: 'coin-usdt', x: 136, y: 453 },
  { id: 'coin-tron', x: 1348, y: 134 },
  { id: 'coin-bnb', x: 1264, y: 293 },
  { id: 'coin-sol', x: 1348, y: 453 },
];

const FACTS: [string, ReactNode][] = [
  ['Token Name', 'Remittix'],
  ['Token Symbol', 'RTX'],
  ['Token Supply', '1,500,000,000'],
  [
    'Network',
    <span className="tk__network" key="n">
      <img src={A('coin-eth')} alt="" width={32} height={32} />
      Ethereum
    </span>,
  ],
  ['Decimal', '18'],
];

const CONTRACT = '0xe7654694ec16F3163084eC559193e10c7ABA17CB';

/**
 * Copy control for the contract address. On success the icon crossfades to a tick that draws
 * itself, the button flashes indigo, and a "Copied" pill rises above it; everything reverts after
 * a beat. The live region announces the result for screen readers.
 */
function CopyAddress({ value }: { value: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      // Clipboard is unavailable over plain http and in some embedded views — fall back to a selection copy.
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1800);
  };

  return (
    <span className="tk__copyWrap" data-state={state}>
      <button type="button" className="tk__copy" onClick={copy} aria-label={`Copy contract address ${value}`}>
        <img className="tk__copyIcon" src={A('ic-copy')} alt="" width={20} height={20} />
        <svg className="tk__tick" viewBox="0 0 20 20" width={20} height={20} aria-hidden="true">
          <path d="M4.5 10.5 L8.5 14.5 L15.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="tk__copied" aria-hidden="true">{state === 'failed' ? 'Press ⌘C' : 'Copied'}</span>
      <span className="tk__sr" role="status" aria-live="polite">
        {state === 'copied' ? 'Contract address copied' : state === 'failed' ? 'Copy failed, press Control or Command C' : ''}
      </span>
    </span>
  );
}

/**
 * Tokenomics (Figma 2592:485). A 442 dial around the mark, six allocations reading outward, and
 * the chain marks on the flanks wired back to the hub — all on the same band and 1560 dashed rails
 * as the sections above. `variant` picks the motion treatment (see useTokenomicsMotion).
 */
export function FigmaTokenomics({ variant = 1 }: { variant?: TokVariant }) {
  const root = useRef<HTMLElement>(null);
  useTokenomicsMotion(root, variant);

  return (
    <section ref={root} className="tk" id="tokenomics" data-motion="pending" data-variant={variant} aria-labelledby="tk-title">
      <div className="tk__frame">
        <header className="tk__head">
          <h2 id="tk-title" className="tk__title">
            <span className="tk__line">
              <span className="tk__lineInner">Tokenomics</span>
            </span>
          </h2>
          <p className="tk__sub">Use the contract information below to add the Remittix token to your wallet.</p>
        </header>

        <div className="tk__band">
          <Stage>
            {/* Wires and their travelling lights share one canvas, so a dot rides the exact path. */}
            <svg className="tk__wires" viewBox="0 0 1560 586" width={1560} height={586} fill="none" aria-hidden="true">
              {WIRES.map((w) => (
                <path key={w.id} className="tk__wire" data-wire={w.id} d={w.d} stroke="var(--tk-rail)" strokeWidth={1} />
              ))}
              {WIRES.map((w) => (
                <circle key={w.id} className="tk__pulse" data-pulse={w.id} r={3.5} fill="var(--tk-indigo)" opacity={0} />
              ))}
            </svg>

            {/* the dial */}
            <img className="tk__ring" src={A('ring-outer')} alt="" width={442} height={442} aria-hidden="true" />
            <svg
              className="tk__dial"
              viewBox={`0 0 ${DIAL.size} ${DIAL.size}`}
              width={DIAL.size}
              height={DIAL.size}
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="tkRamp" gradientUnits="userSpaceOnUse" x1="122" y1="325" x2="23" y2="152">
                  <stop stopColor="#C4E0F6" />
                  <stop offset="1" stopColor="#8487F1" />
                </linearGradient>
              </defs>
              <g className="tk__slices">
                {SEGMENTS.map((s) => (
                  <path key={s.id} className="tk__wedge" data-wedge={s.id} d={slicePath(s.a0, s.a1)} fill="url(#tkRamp)" />
                ))}
              </g>
              {/* The pointer: an arc that slides and resizes onto whichever allocation is live. */}
              <path className="tk__pointer" d={slicePath(SEGMENTS[0].a0, SEGMENTS[0].a1)} fill="var(--tk-indigo)" opacity={0} />
              {/* Radar only: the hand that sweeps the dial. Points at 0° (three o'clock) at rest. */}
              <line
                className="tk__hand"
                x1={DIAL.c}
                y1={DIAL.c}
                x2={DIAL.size}
                y2={DIAL.c}
                stroke="var(--tk-indigo)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Trace only: the rim the dot rides, anticlockwise from twelve. */}
              <path className="tk__rimPath" d={`M ${DIAL.c} 0 A ${DIAL.r} ${DIAL.r} 0 1 0 ${DIAL.c - 0.01} 0`} fill="none" />
              <circle className="tk__rimDot" r={6} fill="var(--tk-indigo)" />
            </svg>

            <div className="tk__hub" aria-hidden="true">
              <img className="tk__hubDisc" src={A('hub')} alt="" width={114} height={114} />
              <img className="tk__logo tk__logo--1" src={A('logo-union')} alt="" width={14.568} height={14.733} />
              <img className="tk__logo tk__logo--2" src={A('logo-v2')} alt="" width={25.615} height={28.405} />
              <img className="tk__logo tk__logo--3" src={A('logo-v3')} alt="" width={25.224} height={29.075} />
              <span className="tk__total" aria-hidden="true">0%</span>
            </div>

            {/* the chain marks */}
            {COINS.map((c) => (
              <span key={c.id} className="tk__coin" data-coin={c.id} style={{ left: c.x, top: c.y - 32 }} aria-hidden="true">
                <img src={A(c.id)} alt="" width={32} height={32} />
              </span>
            ))}

            {/* the allocations */}
            {SEGMENTS.map((s) => (
              <div key={s.id} className="tk__slice" data-slice={s.id} style={{ left: s.x, top: s.y - 32 }}>
                <span className={`tk__chip${s.dark ? '' : ' tk__chip--indigo'}`}>
                  <img src={A(s.icon)} alt="" width={20} height={20} />
                  {s.label}
                </span>
                <span className="tk__pct">
                  <b data-pct={s.pct}>{s.pct}%</b>
                </span>
              </div>
            ))}
          </Stage>
        </div>

        <dl className="tk__facts">
          <div className="tk__fact tk__fact--addr">
            <dt>Contract Address</dt>
            <dd>
              <span className="tk__addr">{CONTRACT}</span>
              <CopyAddress value={CONTRACT} />
            </dd>
          </div>
          {FACTS.map(([label, value]) => (
            <div className="tk__fact" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
