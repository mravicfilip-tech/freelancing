import { useRef, type CSSProperties } from 'react';
import type { Audience as AudienceT, Content } from '../shared/content';
import { PixelIcon, type PixelName } from './art';
import { Bracket } from './Bracket';
import { sh } from './copy';
import { Rise } from './motion/Rise';
import { ScatterCloud } from './motion/ScatterCloud';
import { WaveField } from './motion/WaveField';
import { useInView } from './motion/motion';
import './motion/sections-b.css';

const OP_ICONS: PixelName[] = ['bars', 'records', 'lead'];
const CO_ICONS: PixelName[] = ['machine', 'check', 'bolt'];
const TONES = ['red', 'charcoal', 'light'] as const;

// The first sentence of an audience's body, the one line the phone rows carry. Existing copy only.
function firstSentence(body: string) {
  return body.split(/(?<=[.!?])\s+/)[0];
}

function Block({ c, a, icons, flip, seed, row }: { c: Content; a: AudienceT; icons: PixelName[]; flip?: boolean; seed: number; row: number }) {
  // under 1200 each row rises and fades in once, 80ms after the one above
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref);
  return (
    <div className={`aud${flip ? ' aud--flip' : ''}`} ref={ref} style={{ '--r': row } as CSSProperties}>
      <ScatterCloud className={`art aud__field${flip ? ' aud__field--r' : ''}`} seed={seed} mirror={flip} />
      <div className="aud__text">
        <p className="mono kicker">{a.kicker}</p>
        <Rise className="aud__title display">{sh(c, a.title)}</Rise>
        <p className="aud__line mono-body">{firstSentence(a.body)}</p>
        <p className="aud__body mono-body">{a.body}</p>
        <Bracket href="#contact">{a.cta}</Bracket>
      </div>
      <ul className="aud__cards">
        {a.points.map((p, i) => (
          <li key={p.title} className={`pt pt--${TONES[i]}`} style={{ '--k': i } as CSSProperties}>
            <h3 className="pt__title display">{sh(c, p.title)}</h3>
            <PixelIcon name={icons[i]} className="pt__icon" />
            <div className="pt__foot">
              <p className="pt__n mono">{String(i + 1).padStart(2, '0')}</p>
              <p className="pt__body">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Audiences({ c }: { c: Content }) {
  return (
    <section className="auds" aria-label={`${c.audiences.operators.kicker}, ${c.audiences.contractors.kicker}`}>
      <Block c={c} a={c.audiences.operators} icons={OP_ICONS} seed={11} row={0} />
      <Block c={c} a={c.audiences.contractors} icons={CO_ICONS} flip seed={23} row={1} />
      <div className="auds__wave" aria-hidden="true">
        <WaveField className="art art--wave auds__wave-d" w={1440} h={380} />
        <WaveField className="art art--wave auds__wave-p" w={390} h={240} />
      </div>
    </section>
  );
}
