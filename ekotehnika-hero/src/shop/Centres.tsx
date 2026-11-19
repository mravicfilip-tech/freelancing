// The two service centres and the servis map, for Servis and Kompanija, Filip 19 November, briefs/pages/plan.md. The homepage's map
// (story2/shell/map/ServisMap.tsx) on its black, beside the two centres with their addresses and numbers. The map's data is large, so
// this part loads on its own when a page shows it. On the homepage the scroll draws the map. Here it draws once when it comes into
// view, the same windows of k from 0, and with less motion asked for it is simply there.
import { useEffect, useRef } from 'react';
import { servisMap } from '../story2/copy';
import { ServisMap } from '../story2/shell/map/ServisMap';
import { Cap, Cell } from './parts';

// the roads arrive by k 0.44 (K in ServisMap.tsx), so k runs to 0.46 over the draw and then rests at 1
const DRAW = 2600;
const END = 0.46;

function useDraw() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.style.setProperty('--k', '0');
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const x = Math.min(1, (t - t0) / DRAW);
          // ease out, the lines slow as they reach the towns
          const k = END * (1 - Math.pow(1 - x, 2.2));
          el.style.setProperty('--k', x < 1 ? k.toFixed(4) : '1');
          if (x < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.style.removeProperty('--k');
    };
  }, []);
  return ref;
}

export default function Centres({ label }: { label: string }) {
  const map = useDraw();
  return (
    <section className="sp-frame pg-centres" aria-labelledby="pg-centres-h">
      <Cell span={2} className="pg-text">
        <h2 className="sp-lab" id="pg-centres-h">
          {label}
        </h2>
        <p className="pg-h2">{servisMap.title.join(' ')}</p>
        <p className="sp-lede">{servisMap.text}</p>
        <ul className="pg-bases">
          {servisMap.bases.map((b) => (
            <li key={b.id}>
              <span className="pg-base-n">{b.label}</span>
              <span className="pg-base-l">{b.line}</span>
              <address>
                <a href={b.maps} target="_blank" rel="noopener noreferrer" aria-label={`${b.address}, otvori u Google mapama`} data-cta="maps">
                  {b.address}
                </a>
                <a href={b.phone.tel} data-cta="call-service">
                  {b.phone.number}
                </a>
              </address>
            </li>
          ))}
        </ul>
      </Cell>
      <Cell span={2} className="pg-map">
        <div className="pg-map-fig" ref={map} role="img" aria-label="Mapa Srbije sa servisnim centrima u Vrčinu i Čurugu">
          <ServisMap />
        </div>
      </Cell>
      <Cap />
    </section>
  );
}
