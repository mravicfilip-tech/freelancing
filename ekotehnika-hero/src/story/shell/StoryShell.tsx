// Stub shell, replaced by the shell builder with the real nav, panel themes A, B and C, rail, skip
// link and reduced motion fallback. The props and the clock contract stay as they are.
import { Suspense, useEffect, useState, type ComponentType } from 'react';
import { useStoryClock, type SceneProps } from '../clock';
import { BEATS } from '../../board/beats';

export type UiTheme = 'A' | 'B' | 'C';

export function StoryShell({ ui, Scene, reduced }: { ui: UiTheme; Scene: ComponentType<SceneProps>; reduced: boolean }) {
  const { stageRef, clock, beat } = useStoryClock(reduced);
  const [k, setK] = useState(0);
  useEffect(() => {
    let id = 0;
    const loop = () => {
      setK(Math.round(clock.k.current * 50) / 50);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [clock]);
  const spec = BEATS[beat].panel(k);
  return (
    <div ref={stageRef} className={`st st-${ui}`} style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#f5f6fa' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={null}>
          <Scene clock={clock} />
        </Suspense>
      </div>
      <section style={{ position: 'absolute', left: 24, top: 88, width: 440, bottom: 96, background: '#fff', borderRadius: 24, padding: 32, fontFamily: 'Geist, sans-serif' }}>
        <p>{spec.kick}</p>
        <h1 style={{ fontWeight: 500 }}>{spec.title.join(' ')}</h1>
        <p>{BEATS[beat].id} k {k.toFixed(2)}</p>
      </section>
    </div>
  );
}
