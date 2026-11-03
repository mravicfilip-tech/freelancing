// The frame readout Filip turns on with ?debug=fps, and the numbers behind it. Filip said the scroll "feels like 15 FPS" (round 7), so
// the frame rate is measured, not guessed. Four figures per half second, the frames a second and the frame time from the browser's own
// frame clock, the JS time of the shell loop (StoryShell, the text, the grid and the nav) and the JS time of the scene's useFrame
// work (sistem/index.tsx), and from the renderer the draw calls and triangles of the last frame. Kept free of react and three, like
// preview.ts, so every module can import it. Without ?debug=fps every call here is skipped and nothing is allocated per frame.
//
// window.__perf holds the same meters for a script, reset() clears them and read() returns the averages since the last reset.
export const DEBUG_FPS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'fps';

// A meter keeps two tallies, the total since reset() for a script and the lap since the last lap() for the readout, so the two never
// clear each other.
class Meter {
  sum = 0;
  n = 0;
  max = 0;
  private lapSum = 0;
  private lapN = 0;
  private lapMax = 0;
  add(v: number) {
    this.sum += v;
    this.n++;
    if (v > this.max) this.max = v;
    this.lapSum += v;
    this.lapN++;
    if (v > this.lapMax) this.lapMax = v;
  }
  reset() {
    this.sum = 0;
    this.n = 0;
    this.max = 0;
  }
  lap() {
    const out = { avg: this.lapN ? this.lapSum / this.lapN : 0, max: this.lapMax, n: this.lapN };
    this.lapSum = 0;
    this.lapN = 0;
    this.lapMax = 0;
    return out;
  }
  get avg() {
    return this.n ? this.sum / this.n : 0;
  }
}

export const perf = {
  frame: new Meter(),
  shell: new Meter(),
  scene: new Meter(),
  draw: new Meter(),
  calls: 0,
  tris: 0,
  dpr: 0,
  reset() {
    this.frame.reset();
    this.shell.reset();
    this.scene.reset();
    this.draw.reset();
  },
  read() {
    return {
      fps: this.frame.n ? 1000 / this.frame.avg : 0,
      frameMs: this.frame.avg,
      frameMax: this.frame.max,
      shellMs: this.shell.avg,
      shellMax: this.shell.max,
      sceneMs: this.scene.avg,
      sceneMax: this.scene.max,
      drawMs: this.draw.avg,
      calls: this.calls,
      tris: this.tris,
      dpr: this.dpr,
      frames: this.frame.n,
    };
  },
};

if (DEBUG_FPS) (window as unknown as { __perf: typeof perf }).__perf = perf;
