import { useRef } from 'react';
import { HeroPlanet } from './index';

/**
 * Standalone, transparent stage used by `npm run fallback` to export the
 * static PNG for browsers without WebGL. Open `/?capture=planet`.
 */
export function CaptureStage() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="captureStage" id="capture-stage">
      <HeroPlanet hostRef={ref} forceStatic layout="capture" scroll={false} />
    </div>
  );
}
