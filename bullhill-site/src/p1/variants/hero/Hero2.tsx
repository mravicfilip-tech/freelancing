import type { Content } from '../../../shared/content';
import { photoAlt } from '../../../shared/photos';
import { Bracket } from '../../Bracket';
import './hero.css';

// Hero 2, photo. The trench photo runs full bleed and darkens toward the bottom. The only red is a
// line of dots laid along the trench in the photo. The dots are drawn in the photo's own units
// inside the same svg, so they stay on the trench at every crop.

const DESK = '15 250 480 300';
const PHONE = '170 215 185 400';
const TOP = 368;
const BOTTOM = 880;
// The trench centre line in the 640 by 880 preview of route-trench-village, from near to far.
const TRENCH: [number, number][] = [[312, 880], [314, 780], [316, 700], [320, 620], [324, 540], [328, 470], [334, 420], [342, 385], [352, 368]];

function trenchX(y: number) {
  for (let i = 0; i < TRENCH.length - 1; i++) {
    const [x1, y1] = TRENCH[i];
    const [x2, y2] = TRENCH[i + 1];
    if (y <= y1 && y >= y2) return x1 + ((x2 - x1) * (y1 - y)) / (y1 - y2);
  }
  return TRENCH[TRENCH.length - 1][0];
}

const DOTS: { x: number; y: number; r: number; o: number }[] = (() => {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  let y = BOTTOM;
  while (y > TOP) {
    const near = (y - TOP) / (BOTTOM - TOP);
    out.push({ x: Math.round(trenchX(y) * 10) / 10, y: Math.round(y * 10) / 10, r: Math.round((0.75 + 1.05 * near) * 100) / 100, o: 1 });
    y -= 2.6 + 4.4 * (1 - near);
  }
  return out;
})();

function TrenchDots() {
  return (
    <g className="dr">
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity={d.o} />
      ))}
    </g>
  );
}

export function Hero2({ c }: { c: Content }) {
  const alt = photoAlt('route-trench-village', c.lang);
  return (
    <section className="hero hv hv2" data-hero="2" aria-labelledby="hv2-title">
      <svg className="hv2__ph hv2__ph--d" viewBox={DESK} preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt}>
        <image href="/photos/route-trench-village-2560.webp" x="0" y="0" width="640" height="880" preserveAspectRatio="none" />
      </svg>
      <svg className="hv2__ph hv2__ph--p" viewBox={PHONE} preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt}>
        <image href="/photos/route-trench-village-1280.webp" x="0" y="0" width="640" height="880" preserveAspectRatio="none" />
      </svg>
      <div className="hv2__shade" aria-hidden="true" />
      <svg className="hv2__ph hv2__ph--d hv2__dots" viewBox={DESK} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <TrenchDots />
      </svg>
      <svg className="hv2__ph hv2__ph--p hv2__dots" viewBox={PHONE} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <TrenchDots />
      </svg>
      <div className="hv2__in g">
        <p className="hv2__meta mono">
          <span>{c.hero.kicker}</span>
          <span className="hv2__regions">{c.crew.regions.join(' · ')}</span>
        </p>
        <div className="hv2__main gc">
          <h1 id="hv2-title" className="hv2__title display">
            <span>{c.hero.split[0]}</span> <span>{c.hero.split[1]}</span>
          </h1>
          <div className="hv2__side">
            <p className="hv2__lede mono-body">{c.hero.lede}</p>
            <div className="hv__cta">
              <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
              <Bracket href="#contact">{c.ui.send}</Bracket>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
