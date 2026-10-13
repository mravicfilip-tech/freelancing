// The story shell. One wireframe for all three UI themes, A soft sheet, B glow cards, C pills and
// dots. Logo tile top left, a pill nav centred, phone and quote top right, a left panel with the copy
// of the current beat, the scene behind, and a service rail under the scene. With reduced motion there
// is no pin, the four services are four stacked still sections, then the closing panel.
import { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useStoryClock, stillClock, type SceneProps, type StoryClock } from '../clock';
import { SERVICES, TIMELINE, stillBeatOf } from '../timeline';
import { StoryNav } from './StoryNav';
import { LivePanel, StillPanel } from './Panel';
import { Chips, Rail } from './Rail';
import './shell.css';

export type UiTheme = 'A' | 'B' | 'C';

const ANCHOR = 'posle-animacije';

// The beat and k from the clock, as state that changes only when the beat or k did. Panel parts that
// follow k update from this every frame and never re-mount.
function useClockState(clock: StoryClock) {
  const [s, setS] = useState({ beat: clock.beat.current, k: clock.k.current });
  useEffect(() => {
    let id = 0;
    const loop = () => {
      const beat = clock.beat.current;
      const k = Math.round(clock.k.current * 500) / 500;
      setS((p) => (p.beat === beat && p.k === k ? p : { beat, k }));
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [clock]);
  return s;
}

function SkipLink() {
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(ANCHOR);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: 'auto' });
    target.focus({ preventScroll: true });
  };
  return (
    <a className="sk" href={`#${ANCHOR}`} onClick={go}>
      Preskoči animaciju
    </a>
  );
}

function Live({ ui, Scene }: { ui: UiTheme; Scene: ComponentType<SceneProps> }) {
  const { stageRef, clock, goToService } = useStoryClock(false);
  const { beat, k } = useClockState(clock);
  return (
    <>
      <div ref={stageRef} className={`st st-${ui}`}>
        <SkipLink />
        <div className="st-scene">
          <Suspense fallback={null}>
            <Scene clock={clock} />
          </Suspense>
        </div>
        <StoryNav />
        {ui === 'C' && <Chips beat={beat} k={k} />}
        <LivePanel ui={ui} beat={beat} k={k} />
        <Rail ui={ui} beat={beat} k={k} onPick={goToService} />
      </div>
      <div id={ANCHOR} tabIndex={-1} className="st-after" />
    </>
  );
}

// Reduced motion. The four services as four stacked still sections, each the panel of its last beat
// beside the scene at rest, then the closing panel.
function Still({ ui, Scene }: { ui: UiTheme; Scene: ComponentType<SceneProps> }) {
  useStoryClock(true);
  const beats = useMemo(() => [...SERVICES.map((s) => stillBeatOf(s.id)), TIMELINE.length - 1], []);
  const clocks = useMemo(() => beats.map((b) => stillClock(b, 1)), [beats]);
  return (
    <div className={`st-reduced st-${ui}`}>
      <SkipLink />
      <StoryNav fixed />
      {beats.map((b, i) => (
        <section key={b} className="st st-sec" aria-label={SERVICES[i]?.name ?? 'Ekotehnika'}>
          <div className="st-scene">
            <Suspense fallback={null}>
              <Scene clock={clocks[i]} />
            </Suspense>
          </div>
          {ui === 'C' && <Chips beat={b} k={1} />}
          <StillPanel ui={ui} idx={b} level={i === 0 ? 1 : 2} />
        </section>
      ))}
      <div id={ANCHOR} tabIndex={-1} className="st-after" />
    </div>
  );
}

export function StoryShell({ ui, Scene, reduced }: { ui: UiTheme; Scene: ComponentType<SceneProps>; reduced: boolean }) {
  return reduced ? <Still ui={ui} Scene={Scene} /> : <Live ui={ui} Scene={Scene} />;
}
