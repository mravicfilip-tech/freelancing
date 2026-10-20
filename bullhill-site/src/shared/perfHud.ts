// A frame meter for a review build, ?perf=1, so Filip's own machine reports where a scroll frame goes.
// It never loads in the public build. It counts animation frames and, through the Long Animation Frames API,
// records every frame over 50ms with its style and layout time and the scripts that ran in it, tagged
// with the section on screen. "Copy report" puts a JSON summary on the clipboard for him to paste.

type Script = { invoker?: string; sourceURL?: string; sourceFunctionName?: string; sourceCharPosition?: number; duration: number; forcedStyleAndLayoutDuration?: number };
type Loaf = PerformanceEntry & { blockingDuration: number; renderStart: number; styleAndLayoutStart: number; scripts: Script[] };

function sectionNow(): string {
  const y = window.innerHeight / 2;
  const el = document.elementFromPoint(window.innerWidth / 2, y)?.closest('main > *, footer');
  return el ? (el.id || (el.className.toString().split(' ').find((c) => c && c !== 'g' && c !== 'gc') ?? el.tagName)) : 'top';
}

function gpu(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function startPerfHud() {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;padding:8px 10px;background:#000;color:#0f0;font:12px/16px monospace;border:1px solid #0f0';
  const line = document.createElement('div');
  const btn = document.createElement('button');
  btn.textContent = 'Copy report';
  btn.style.cssText = 'margin-top:6px;padding:4px 8px;background:#0f0;color:#000;font:12px monospace;border:0;cursor:pointer';
  box.append(line, btn);
  document.body.append(box);

  const gaps: { gap: number; sec: string }[] = [];
  const loafs: { sec: string; dur: number; block: number; style: number; render: number; scripts: { src: string; fn: string; pos: number; inv: string; dur: number; forced: number }[] }[] = [];
  let last = 0;
  let frames = 0;
  let t0 = performance.now();
  let fps = 0;
  const tick = (t: number) => {
    if (last) gaps.push({ gap: t - last, sec: sectionNow() });
    if (gaps.length > 20000) gaps.shift();
    last = t;
    frames++;
    if (t - t0 >= 1000) {
      fps = Math.round((frames * 1000) / (t - t0));
      frames = 0;
      t0 = t;
      const slow = gaps.filter((g) => g.gap > 25).length;
      line.textContent = `${fps} fps, frames over 25ms ${slow} of ${gaps.length}, long frames ${loafs.length}`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Loaf[]) {
        loafs.push({
          sec: sectionNow(),
          dur: Math.round(e.duration),
          block: Math.round(e.blockingDuration),
          style: Math.round(e.startTime + e.duration - e.styleAndLayoutStart),
          render: Math.round(e.styleAndLayoutStart - e.renderStart),
          scripts: e.scripts.map((s) => ({ src: (s.sourceURL ?? '').split('/').pop() ?? '', fn: s.sourceFunctionName ?? '', pos: s.sourceCharPosition ?? -1, inv: s.invoker ?? '', dur: Math.round(s.duration), forced: Math.round(s.forcedStyleAndLayoutDuration ?? 0) })),
        });
        if (loafs.length > 400) loafs.shift();
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch {
    line.textContent = 'this browser has no long animation frame timing, use Chrome';
  }

  btn.onclick = () => {
    const bySec: Record<string, { frames: number; over8: number; over25: number; worst: number }> = {};
    for (const g of gaps) {
      const s = (bySec[g.sec] ??= { frames: 0, over8: 0, over25: 0, worst: 0 });
      s.frames++;
      // over 8ms is a dropped frame on a 120Hz or faster screen, over 25ms on any screen
      if (g.gap > 8.5) s.over8++;
      if (g.gap > 25) s.over25++;
      s.worst = Math.max(s.worst, Math.round(g.gap));
    }
    const report = {
      at: new Date().toISOString(),
      ua: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`,
      gpu: gpu(),
      cores: navigator.hardwareConcurrency,
      fps,
      sections: bySec,
      longFrames: [...loafs].sort((a, b) => b.dur - a.dur).slice(0, 40),
    };
    const text = JSON.stringify(report);
    // the report is shown in a box as well, a clipboard a browser refuses still leaves it to copy by hand
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:8px;right:8px;bottom:90px;height:30vh;z-index:10000;font:11px monospace';
    document.body.append(ta);
    ta.select();
    navigator.clipboard.writeText(text).then(
      () => (btn.textContent = 'Copied, paste it in chat'),
      () => (btn.textContent = 'Copy the text in the box'),
    );
  };
}
