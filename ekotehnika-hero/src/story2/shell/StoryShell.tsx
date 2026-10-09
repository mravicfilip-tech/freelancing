// Stub shell, replaced by the shell builder. Props stay as they are.
import { Suspense, type ComponentType } from 'react';
import { useStoryClock, type SceneProps } from '../clock';
import { TIMELINE } from '../timeline';

export type Tone = 'light' | 'dark';

export function StoryShell({ Scene, tone, reduced }: { Scene: ComponentType<SceneProps>; tone: Tone; reduced: boolean }) {
  const { stageRef, clock, beat } = useStoryClock(reduced);
  return (
    <div ref={stageRef} data-tone={tone} style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={null}>
          <Scene clock={clock} />
        </Suspense>
      </div>
      <p style={{ position: 'absolute', left: 24, bottom: 24, fontFamily: 'Geist, sans-serif' }}>{TIMELINE[beat].id}</p>
    </div>
  );
}
