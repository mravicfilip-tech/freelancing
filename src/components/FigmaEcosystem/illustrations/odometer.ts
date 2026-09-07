import type { Gsap } from '../../FigmaFeatures/illustrations/motion';

/**
 * An odometer for a figure that changes. Each digit stays in normal flow, so the number keeps its
 * baseline and tracking; the rolling column is an absolutely positioned overlay shown only while
 * that digit is actually moving. Styles live in ecosystem-illustrations.css (`.odo__*`).
 */

/** Lays `text` out as odometer cells: one per character, digits able to roll, the rest static. */
export function odoBuild(host: HTMLElement, text: string) {
  host.dataset.odo = text;
  host.textContent = '';
  for (const ch of text) {
    if (ch < '0' || ch > '9') {
      const sep = document.createElement('span');
      sep.className = 'odo__sep';
      sep.textContent = ch;
      host.appendChild(sep);
      continue;
    }
    const cell = document.createElement('span');
    cell.className = 'odo__cell';
    cell.dataset.d = ch;
    const face = document.createElement('span');
    face.className = 'odo__face';
    face.textContent = ch;
    const mask = document.createElement('span');
    mask.className = 'odo__mask';
    const strip = document.createElement('i');
    strip.className = 'odo__strip';
    // two runs of 0-9, so a digit can always roll forwards and never back through the deck
    for (let n = 0; n < 20; n += 1) {
      const u = document.createElement('u');
      u.textContent = String(n % 10);
      strip.appendChild(u);
    }
    mask.appendChild(strip);
    cell.append(face, mask);
    host.appendChild(cell);
  }
}

/**
 * Rolls the figure to `text`. Only the digits that actually change move, each taking a full turn
 * before it lands, and they leave from the units up so the change travels along the number
 * instead of the whole figure swapping out.
 */
export function odoSet(gsap: Gsap, host: HTMLElement, text: string, flash = '#4042d1') {
  const shape = (v: string) => v.replace(/[0-9]/g, '#');
  if (host.dataset.odo === undefined || shape(host.dataset.odo) !== shape(text)) {
    odoBuild(host, text);
    return;
  }
  const cells = Array.from(host.children) as HTMLElement[];
  const ink = getComputedStyle(host).color;
  const moving: [HTMLElement, string][] = [];
  Array.from(text).forEach((ch, i) => {
    const cell = cells[i];
    if (!cell || !cell.classList.contains('odo__cell') || cell.dataset.d === ch) return;
    moving.push([cell, ch]);
  });
  host.dataset.odo = text;
  moving.reverse().forEach(([cell, ch], n) => {
    const face = cell.querySelector<HTMLElement>('.odo__face')!;
    const mask = cell.querySelector<HTMLElement>('.odo__mask')!;
    const strip = cell.querySelector<HTMLElement>('.odo__strip')!;
    const h = cell.offsetHeight; // layout px: the tween runs in the cell's own space, whatever the stage is scaled to
    const from = Number(cell.dataset.d);
    const to = Number(ch);
    // one full turn past the shortest forward route, so the roll is seen rather than inferred
    const stop = from + ((to - from + 10) % 10) + 10;
    cell.dataset.d = ch;
    gsap
      .timeline({ delay: 0.06 * n })
      .set(strip, { y: -from * h })
      .set([face, mask], { visibility: 'hidden', opacity: 0 })
      .set(mask, { visibility: 'visible', opacity: 1 })
      .to(strip, { y: -stop * h, duration: 0.92, ease: 'power4.out' }, 0)
      .add(() => {
        face.textContent = ch;
      })
      .set(face, { visibility: 'visible', opacity: 1 })
      .set(mask, { opacity: 0 })
      .fromTo(cell, { color: flash }, { color: ink, duration: 0.9, ease: 'power1.out' }, 0);
  });
}
