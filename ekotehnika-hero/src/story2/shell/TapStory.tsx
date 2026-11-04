// The phone pathway of ?m=4, see preview.ts MSCROLL and briefs/mobile/round3.md. Mounted by StoryShell only for that pathway.
// Like a story on a phone. A tap on the right two thirds of the empty scene goes on to the next stop, a tap on the left third goes back,
// a swipe does what it does on every pathway (scroll/useScrollStory.ts). A row of segments at the top of the stage, one for each stop,
// fills as the story glides from stop to stop. It shows past the hero only, where the row of logos is gone (the stage carries data-past).
// A short hint stands at the first stop past the hero until the first tap, and is not shown again in that visit.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SceneProps } from '../clock';
import { stepStop, storyPos, storyStops } from '../../scroll/useScrollStory';
import { TIMELINE } from '../timeline';
import './tapstory.css';

// The share of the stage width, from the left, where a tap goes back.
const BACK = 1 / 3;
// A clock within this many story pixels of a stop is at it.
const AT = 6;
// The hint is kept in session storage so a reload in the same visit does not bring it back.
const SEEN = 'tap-hint-seen';
const seen = () => {
  try {
    return window.sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    window.sessionStorage.setItem(SEEN, '1');
  } catch {
    /* a private window keeps it for this page only */
  }
};

export function TapStory(_props: SceneProps) {
  const bar = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [hint, setHint] = useState(false);
  const done = useRef(seen());

  // The segments follow the clock each frame. Segment i is full once the clock has reached stop i, and fills from the stop before it.
  useEffect(() => {
    let id = 0;
    let n = 0;
    let last: number[] = [];
    let shown = false;
    const loop = () => {
      id = requestAnimationFrame(loop);
      // the stops past the hero only, the two of the hero would always stand full where the segments show
      const stops = storyStops().filter((s) => s > TIMELINE[0].end);
      const pos = storyPos();
      if (!pos && pos !== 0) return;
      if (stops.length !== n) {
        n = stops.length;
        last = [];
        setCount(n);
        return;
      }
      const segs = bar.current?.children;
      if (!segs || segs.length !== n) return;
      for (let i = 0; i < n; i++) {
        const from = i ? stops[i - 1] : TIMELINE[0].end;
        const f = stops[i] > from ? Math.min(1, Math.max(0, (pos - from) / (stops[i] - from))) : 1;
        const v = Math.round(f * 1000) / 1000;
        if (last[i] !== v) {
          last[i] = v;
          (segs[i] as HTMLElement).style.setProperty('--f', String(v));
        }
      }
      // the first stop past the hero, the first one that is not inside it
      if (!done.current) {
        const first = stops.find((s) => s >= TIMELINE[0].end);
        const here = first !== undefined && Math.abs(pos - first) <= AT;
        if (here !== shown) {
          shown = here;
          setHint(here);
          // leaving that stop without a tap has taught the gesture as well, so the hint does not wait for the way back
          if (!here && pos > TIMELINE[0].end) {
            done.current = true;
            markSeen();
          }
        }
      }
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  // Only empty scene takes the tap. The layer stands under the words, so a button, a link or the bar gets its own click first.
  const tap = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!done.current) {
      done.current = true;
      markSeen();
      setHint(false);
    }
    stepStop(e.clientX - r.left < r.width * BACK ? -1 : 1);
  };

  return (
    <>
      <div className="tap-hit" onClick={tap} aria-hidden="true" />
      <div className="tap-bar" ref={bar} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <p className="tap-hint" data-show={hint || undefined} aria-hidden="true">
        Dodirni za dalje
      </p>
    </>
  );
}
