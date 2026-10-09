// Variant 5, Sistem. The second half of the Terminal Industries reel in Linde colours. A lit
// forklift at dusk is scanned into glowing edges, breaks into particles, and the particles settle
// into a dark floor of rounded tiles under converging smoke beams. The scene is full bleed and the
// shared hero frame sits on top in white, see src/ui/HeroFrame.tsx.
import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useScrollStory } from '../../scroll/useScrollStory';
import { HeroFrame } from '../../ui/HeroFrame';
import { SceneContents, type Clock } from './Scene';
import './v5.css';

const LENGTH = 8000;
const REDUCED_P = 0.235;

export default function Variant5({ reduced }: { reduced: boolean }) {
  const { stageRef, progress } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.07 });
  // Reduced motion holds the reel's signature frame, the truck half lines and half particles.
  const clock = useMemo<Clock>(() => ({ p: () => (reduced ? REDUCED_P : progress.current) }), [reduced, progress]);
  const invalidate = useRef<(() => void) | null>(null);

  return (
    <div className={`v5${reduced ? ' is-reduced' : ''}`}>
      <div className="v5-stage" ref={stageRef} role="region" aria-label="Ekotehnika, Linde viljuškari">
        <div className="v5-canvas" aria-hidden="true">
          <Canvas shadows="soft" dpr={[1, 1.5]} frameloop={reduced ? 'demand' : 'always'} camera={{ fov: 30, near: 0.1, far: 200, position: [0.7, 0.72, 7.4] }} gl={{ antialias: true }}>
            <SceneContents clock={clock} invalidateRef={invalidate} />
          </Canvas>
        </div>
        <div className="v5-shade" aria-hidden="true" />
        <div className="v5-shade-top" aria-hidden="true" />
        <HeroFrame tone="white" />
      </div>
    </div>
  );
}
