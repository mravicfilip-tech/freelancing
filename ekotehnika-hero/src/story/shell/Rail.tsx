// The service rail under the scene, four pills that call goToService, and the floating status chips of
// theme C. Red never appears here, the active pill is ink or light.
import type { CSSProperties } from 'react';
import { BEATS } from '../../board/beats';
import { ServiceIcon } from '../../variants/v2/art';
import { SERVICES, TIMELINE, type ServiceId } from '../timeline';
import type { UiTheme } from './StoryShell';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function Rail({ ui, beat, k, onPick }: { ui: UiTheme; beat: number; k: number; onPick: (s: ServiceId) => void }) {
  const active = TIMELINE[beat].service;
  const b = BEATS[beat];
  const op = b.rail ? b.rail(k) : 1;
  return (
    <nav className={`rl rl-${ui}`} aria-label="Usluge" style={{ opacity: op, pointerEvents: op < 0.2 ? 'none' : undefined, visibility: op <= 0 ? 'hidden' : undefined }}>
      {ui === 'A' && <span className="rl-notch" aria-hidden="true" />}
      <ul>
        {SERVICES.map((s) => (
          <li key={s.id}>
            <button type="button" className={s.id === active ? 'rl-pill rl-on' : 'rl-pill'} aria-current={s.id === active ? 'true' : undefined} onClick={() => onPick(s.id)}>
              <svg viewBox="0 0 44 44" width={22} height={22} aria-hidden="true" focusable="false">
                <ServiceIcon id={s.id} color="currentColor" />
              </svg>
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Progress of the story through the four services, 0 to 1 over the service's three beats.
const serviceProgress = (beat: number, k: number) => {
  const s = TIMELINE[beat].service;
  if (!s) return beat === 0 ? k : 1;
  const first = TIMELINE.findIndex((x) => x.service === s);
  return clamp((beat - first + k) / 3);
};

const CHIP_LABEL = (beat: number) => {
  const s = TIMELINE[beat].service;
  return s ? SERVICES.find((x) => x.id === s)!.name : 'Ekotehnika';
};

// Small dark status chips with a live dot that float beside the scene, theme C.
export function Chips({ beat, k }: { beat: number; k: number }) {
  const service = TIMELINE[beat].service;
  const label = CHIP_LABEL(beat);
  return (
    <div className="cc" aria-hidden="true">
      <div className="cc-chip cc-main">
        <span className="cc-live" />
        <span className="cc-label">{label}</span>
        <span className="cc-bar" style={{ '--p': serviceProgress(beat, k) } as CSSProperties} />
      </div>
      {service === 'servis' && (
        <div className="cc-chip cc-urgent">
          <span className="cc-live" />
          <span className="cc-label">Hitan servis</span>
          <span className="cc-state">aktivan</span>
        </div>
      )}
    </div>
  );
}
