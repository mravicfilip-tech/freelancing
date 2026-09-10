import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTokenomicsMotion, type TokVariant } from './useTokenomicsMotion';
import { DIAL, HALOS, SEG_BY_ID, REST, geometry, slicePath, spanOf } from './dial';
import { useMobileArt } from '../FigmaFeatures/illustrations/Stage';
import './FigmaTokenomics.css';

const A = (n: string) => `/figma/tokenomics/${n}.svg`;

/** The band is drawn at its design size and scaled to the frame, so every offset stays exact. */
function Stage({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => el.style.setProperty('--k', String(el.clientWidth / w));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="tk__fit" style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="tk__stage" style={{ width: w, height: h }}>
        {children}
      </div>
    </div>
  );
}

const FACTS: [string, ReactNode][] = [
  ['Token Name', 'Remittix'],
  ['Token Symbol', 'RTX'],
  ['Token Supply', '1,500,000,000'],
  [
    'Network',
    <span className="tk__network" key="n">
      <img loading="lazy" decoding="async" src={A('coin-eth')} alt="" width={32} height={32} />
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
        <img loading="lazy" decoding="async" className="tk__copyIcon" src={A('ic-copy')} alt="" width={20} height={20} />
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
 * Tokenomics (Figma 2592:485). One gradient arc that aims at an allocation and is sized to its
 * share, two hub halos following the same span, six allocations reading outward, and the chain
 * marks on the flanks wired back to the hub. `variant` picks the motion (see useTokenomicsMotion).
 */
export function FigmaTokenomics({ variant = 1 }: { variant?: TokVariant }) {
  const root = useRef<HTMLElement>(null);
  const mobile = useMobileArt();
  const g = geometry(mobile);
  useTokenomicsMotion(root, variant, mobile);
  const [r0, r1] = spanOf(mobile ? g.segments.find((s) => s.id === REST)! : SEG_BY_ID[REST]);

  return (
    <section
      ref={root}
      className={`tk${mobile ? ' tk--m' : ''}`}
      id="tokenomics"
      data-motion="pending"
      data-variant={variant}
      data-layout={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="tk-title"
    >
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
          <Stage w={g.stage.w} h={g.stage.h}>
            {/* Wires and their travelling lights share one canvas, so a dot rides the exact path. */}
            <svg className="tk__wires" viewBox={`0 0 ${g.stage.w} ${g.stage.h}`} width={g.stage.w} height={g.stage.h} fill="none" aria-hidden="true">
              {g.wires.map((w) => (
                <path key={w.id} className="tk__wire" data-wire={w.id} d={w.d} stroke="var(--tk-rail)" strokeWidth={1} />
              ))}
              {g.wires.map((w) => (
                <circle key={w.id} className="tk__pulse" data-pulse={w.id} r={3.5} fill="var(--tk-indigo)" opacity={0} />
              ))}
            </svg>

            <img loading="lazy" decoding="async" className="tk__ring" src={A('ring-outer')} alt="" width={442} height={442} aria-hidden="true" />

            {/* The dial: one gradient arc, aimed and sized by the motion, with the hub halos
                following the same span exactly as they do in the design. */}
            <svg
              className="tk__dial"
              viewBox={`0 0 ${DIAL.size} ${DIAL.size}`}
              width={DIAL.size}
              height={DIAL.size}
              fill="none"
              aria-hidden="true"
            >
              <defs>
                {/* The ramp runs ALONG the wedge's bisector — pale at the hub, indigo at the rim —
                    so the wedge is mirror-symmetric about the direction it points and reads as
                    centred on its allocation. The motion re-aims it as the arc moves. */}
                <linearGradient id="tkRamp" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="0">
                  <stop stopColor="#C4E0F6" />
                  <stop offset="1" stopColor="#8487F1" />
                </linearGradient>
              </defs>
              <path className="tk__arc" d={slicePath(r0, r1)} fill="url(#tkRamp)" />
              {HALOS.map((h) => (
                <path
                  key={h.d}
                  className="tk__halo"
                  data-halo={h.d}
                  d={slicePath(r0, r1, h.d / 2)}
                  fill={h.fill}
                  opacity={h.opacity}
                />
              ))}
            </svg>

            <div className="tk__hub" aria-hidden="true">
              <img loading="lazy" decoding="async" className="tk__hubDisc" src={A('hub')} alt="" width={114} height={114} />
              <img loading="lazy" decoding="async" className="tk__logo tk__logo--1" src={A('logo-union')} alt="" width={14.568} height={14.733} />
              <img loading="lazy" decoding="async" className="tk__logo tk__logo--2" src={A('logo-v2')} alt="" width={25.615} height={28.405} />
              <img loading="lazy" decoding="async" className="tk__logo tk__logo--3" src={A('logo-v3')} alt="" width={25.224} height={29.075} />
            </div>

            {/* the chain marks */}
            {g.coins.map((c) => (
              <span key={c.id} className="tk__coin" data-coin={c.id} style={{ left: c.x, top: c.y - g.disc / 2, width: g.disc, height: g.disc }} aria-hidden="true">
                <img loading="lazy" decoding="async" src={A(c.id)} alt="" width={g.mark} height={g.mark} />
              </span>
            ))}

            {/* the allocations — the live one takes the indigo chip */}
            {g.segments.map((s) => (
              <div key={s.id} className="tk__slice" data-slice={s.id} style={{ left: s.x, top: s.y - 32 }}>
                <span className="tk__chip" style={s.w ? { width: s.w, justifyContent: 'center' } : undefined}>
                  <img loading="lazy" decoding="async" src={A(s.icon)} alt="" width={20} height={20} />
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
