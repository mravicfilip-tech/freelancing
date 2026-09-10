import { useEffect, useRef, useState } from 'react';
import './SplineSlide.css';

const VIEWER = 'https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js';
const SCENE = 'https://prod.spline.design/JrFJL7h8NW-86ujZ/scene.splinecode';

/* `<spline-viewer>` is a custom element, so TypeScript has to be told it exists before JSX will
   accept it. React 19 passes unknown attributes straight through to the element. */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        url?: string;
        'events-target'?: string;
      };
    }
  }
}

/** One load per document, however many slides ask for it, and never twice on a re-render. */
let loading: Promise<void> | null = null;
function loadViewer() {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    if (customElements.get('spline-viewer')) return resolve();
    const el = document.createElement('script');
    el.type = 'module';
    el.src = VIEWER;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('spline viewer failed to load'));
    document.head.appendChild(el);
  });
  return loading;
}

/**
 * The third hero slide: a Spline scene.
 *
 * It is fetched the first time the slide is reached rather than on page load — the viewer and the
 * scene together are a few megabytes and a WebGL context, and most readers never leave slide one.
 * Once it has arrived it stays, so stepping back and forth costs nothing.
 *
 * If the fetch fails — an offline reader, a blocked CDN — the slide stays empty rather than
 * showing a broken frame, and the other two are untouched.
 */
export function SplineSlide({ active }: { active: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const asked = useRef(false);

  useEffect(() => {
    if (!active || asked.current) return;
    asked.current = true;
    setState('loading');
    let live = true;
    loadViewer().then(
      () => live && setState('ready'),
      () => live && setState('failed'),
    );
    return () => {
      live = false;
    };
  }, [active]);

  return (
    <div className="fh__spline" data-state={state}>
      {state === 'ready' && <spline-viewer url={SCENE} />}
    </div>
  );
}
