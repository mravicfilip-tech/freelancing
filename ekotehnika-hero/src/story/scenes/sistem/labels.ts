// Canvas textures for the light signs in the Sistem scene, numbers, checks, the warning, the seal,
// tags and map labels. Light on dark, Geist, drawn again once the font is ready.
import * as THREE from 'three';
import { C } from '../../../tokens';

const FONT = 'Geist, system-ui, sans-serif';

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

function canvasTex(w: number, h: number, draw: Draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const paint = () => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    draw(g, w, h);
  };
  paint();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  if (document.fonts) {
    Promise.all([document.fonts.load(`500 48px Geist`), document.fonts.load(`600 48px Geist`), document.fonts.load(`400 48px Geist`)])
      .then(() => document.fonts.ready)
      .then(() => {
        paint();
        t.needsUpdate = true;
      })
      .catch(() => undefined);
  }
  return t;
}

const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

const checkPath = (g: CanvasRenderingContext2D, cx: number, cy: number, s: number) => {
  g.beginPath();
  g.moveTo(cx - 0.5 * s, cy + 0.02 * s);
  g.lineTo(cx - 0.14 * s, cy + 0.36 * s);
  g.lineTo(cx + 0.52 * s, cy - 0.36 * s);
};

// A numbered station badge for the seven rings. done is a white disc, waiting is a dark disc.
export function numberBadge(n: number, done: boolean) {
  return canvasTex(256, 256, (g) => {
    g.beginPath();
    g.arc(128, 128, 112, 0, Math.PI * 2);
    if (done) {
      g.fillStyle = C.white;
      g.fill();
      g.fillStyle = C.ink;
    } else {
      g.fillStyle = 'rgba(34,34,34,0.92)';
      g.fill();
      g.lineWidth = 7;
      g.strokeStyle = 'rgba(238,239,243,0.55)';
      g.stroke();
      g.fillStyle = 'rgba(238,239,243,0.78)';
    }
    g.font = `500 132px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(n), 128, 136);
  });
}

// A check ring for the pit stop. Waiting is a ring with a dot, done is a white disc with a check.
export function checkBadge(done: boolean) {
  return canvasTex(256, 256, (g) => {
    if (done) {
      g.beginPath();
      g.arc(128, 128, 124, 0, Math.PI * 2);
      g.lineWidth = 6;
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.stroke();
      g.beginPath();
      g.arc(128, 128, 100, 0, Math.PI * 2);
      g.fillStyle = C.white;
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 20;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      checkPath(g, 128, 130, 92);
      g.stroke();
    } else {
      g.beginPath();
      g.arc(128, 128, 112, 0, Math.PI * 2);
      g.fillStyle = 'rgba(34,34,34,0.7)';
      g.fill();
      g.lineWidth = 8;
      g.strokeStyle = 'rgba(238,239,243,0.62)';
      g.stroke();
      g.beginPath();
      g.arc(128, 128, 15, 0, Math.PI * 2);
      g.fillStyle = 'rgba(238,239,243,0.62)';
      g.fill();
    }
  });
}

// The warning sign, a white triangle with a cut out mark.
export function warnTexture() {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = C.white;
    g.lineJoin = 'round';
    g.lineWidth = 34;
    g.strokeStyle = C.white;
    g.beginPath();
    g.moveTo(256, 96);
    g.lineTo(424, 380);
    g.lineTo(88, 380);
    g.closePath();
    g.fill();
    g.stroke();
    g.globalCompositeOperation = 'destination-out';
    g.lineCap = 'round';
    g.lineWidth = 34;
    g.beginPath();
    g.moveTo(256, 192);
    g.lineTo(256, 288);
    g.stroke();
    g.beginPath();
    g.arc(256, 332, 19, 0, Math.PI * 2);
    g.fill();
  });
}

// The renewal seal, a scalloped rosette with a dashed ring and a check, two ribbon tails below.
export function sealTexture() {
  return canvasTex(512, 640, (g) => {
    const cx = 256;
    const cy = 230;
    // ribbons first, behind the rosette
    g.fillStyle = 'rgba(200,204,212,0.9)';
    g.beginPath();
    g.moveTo(170, 330);
    g.lineTo(250, 330);
    g.lineTo(250, 560);
    g.lineTo(210, 520);
    g.lineTo(150, 574);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(232,234,238,0.95)';
    g.beginPath();
    g.moveTo(262, 330);
    g.lineTo(342, 330);
    g.lineTo(362, 574);
    g.lineTo(302, 520);
    g.lineTo(262, 560);
    g.closePath();
    g.fill();
    // the scalloped body
    g.fillStyle = C.white;
    g.beginPath();
    const teeth = 24;
    for (let i = 0; i <= 480; i++) {
      const a = (i / 480) * Math.PI * 2;
      const r = 196 * (1 + 0.05 * Math.cos(a * teeth));
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
    // the cut outs, a dashed ring and the check
    g.globalCompositeOperation = 'destination-out';
    g.lineWidth = 10;
    g.setLineDash([22, 18]);
    g.beginPath();
    g.arc(cx, cy, 158, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.lineWidth = 26;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    checkPath(g, cx, cy + 4, 190);
    g.stroke();
  });
}

// A floating tag, a dark pill with a light edge and a quiet dot.
export function tagTexture(label: string) {
  const w = 640;
  const h = 176;
  const t = canvasTex(w, h, (g) => {
    roundRect(g, 6, 6, w - 12, h - 12, (h - 12) / 2);
    g.fillStyle = 'rgba(24,24,26,0.9)';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(238,239,243,0.6)';
    g.stroke();
    g.fillStyle = C.white;
    g.font = `500 76px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, w / 2, h / 2 + 4);
  });
  return t;
}

// Map and pad labels, white text on nothing. The canvas fits the text, userData.aspect is width over height.
export function textTexture(label: string, weight = 500, alpha = 1) {
  const m = document.createElement('canvas').getContext('2d')!;
  m.font = `${weight} 84px ${FONT}`;
  const w = Math.max(160, Math.ceil(m.measureText(label).width * 1.32 + 90));
  const h = 128;
  const t = canvasTex(w, h, (g) => {
    g.fillStyle = `rgba(255,255,255,${alpha})`;
    g.font = `${weight} 84px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, w / 2, h / 2 + 4);
  });
  // the font may arrive late and change the width, so size for the wider of the two guesses
  t.userData.aspect = w / h;
  return t;
}

// A map pin, white teardrop with an ink dot.
export function pinTexture() {
  return canvasTex(128, 192, (g) => {
    g.fillStyle = C.white;
    g.beginPath();
    g.moveTo(64, 184);
    g.bezierCurveTo(64, 184, 14, 118, 14, 70);
    g.arc(64, 64, 50, Math.PI, 0, false);
    g.bezierCurveTo(114, 118, 64, 184, 64, 184);
    g.closePath();
    g.fill();
    g.fillStyle = C.ink;
    g.beginPath();
    g.arc(64, 64, 19, 0, Math.PI * 2);
    g.fill();
  });
}

// A plain light ring, for the rings around the warning.
export function ringTexture() {
  return canvasTex(512, 512, (g) => {
    g.beginPath();
    g.arc(256, 256, 240, 0, Math.PI * 2);
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.stroke();
  });
}

// A soft round glow, white to clear.
export function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  grd.addColorStop(0.65, 'rgba(255,255,255,0.14)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// White at the base fading to clear at the top, for the light columns.
export function columnTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 256, 0, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
