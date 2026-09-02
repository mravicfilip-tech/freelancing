import * as THREE from 'three';

export interface CoinSpec {
  symbol: string;
  color: string;
  logo?: string;
}

type Draw = (ctx: CanvasRenderingContext2D, s: number) => void;

/** Drawn approximations of the coin marks, in a unit square (0..1) scaled by `s`. */
const MARKS: Record<string, Draw> = {
  BTC(ctx, s) {
    ctx.save();
    ctx.translate(0.5 * s, 0.5 * s);
    ctx.rotate(-14 * (Math.PI / 180));
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${0.58 * s}px "Instrument Sans Variable", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 0.01 * s, 0.03 * s);
    // the two strokes through the B
    ctx.fillRect(-0.075 * s, -0.33 * s, 0.05 * s, 0.09 * s);
    ctx.fillRect(0.0 * s, -0.33 * s, 0.05 * s, 0.09 * s);
    ctx.fillRect(-0.075 * s, 0.25 * s, 0.05 * s, 0.09 * s);
    ctx.fillRect(0.0 * s, 0.25 * s, 0.05 * s, 0.09 * s);
    ctx.restore();
  },
  ETH(ctx, s) {
    const top = [0.5, 0.16], left = [0.27, 0.53], right = [0.73, 0.53], bottom = [0.5, 0.86];
    const mid = [0.5, 0.63], lowL = [0.27, 0.59], lowR = [0.73, 0.59], lowMid = [0.5, 0.69];
    const poly = (pts: number[][], alpha: number) => {
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
      ctx.closePath();
      ctx.fill();
    };
    poly([top, left, mid], 0.62);
    poly([top, right, mid], 1);
    poly([lowL, lowMid, bottom], 0.62);
    poly([lowR, lowMid, bottom], 1);
  },
  USDT(ctx, s) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0.26 * s, 0.24 * s, 0.48 * s, 0.11 * s); // crossbar
    ctx.fillRect(0.44 * s, 0.24 * s, 0.12 * s, 0.52 * s); // stem
    ctx.lineWidth = 0.075 * s;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0.5 * s, 0.46 * s, 0.27 * s, 0.085 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ctxFill(ctx);
    ctx.fillRect(0.44 * s, 0.4 * s, 0.12 * s, 0.12 * s); // punch the stem back through the ellipse
    ctx.fillStyle = '#fff';
    ctx.fillRect(0.44 * s, 0.24 * s, 0.12 * s, 0.52 * s);
  },
  USDC(ctx, s) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.075 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0.5 * s, 0.5 * s, 0.32 * s, Math.PI * 0.62, Math.PI * 1.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0.5 * s, 0.5 * s, 0.32 * s, Math.PI * 1.62, Math.PI * 2.38);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${0.42 * s}px "Instrument Sans Variable", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0.5 * s, 0.52 * s);
  },
};

let currentFill = '#000';
function ctxFill(_ctx: CanvasRenderingContext2D) {
  return currentFill;
}

/**
 * A coin token: flat brand-colour disc with a white keyline and the coin mark.
 * If `logo` is set the image replaces the drawn mark.
 */
export function makeBadgeTexture(coin: CoinSpec, px: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  const c = px / 2;
  const r = px * 0.36;

  const draw = (image?: HTMLImageElement) => {
    ctx.clearRect(0, 0, px, px);
    // thin white keyline so the token separates cleanly from the dots behind it
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(c, c, r + px * 0.02, 0, Math.PI * 2);
    ctx.fill();
    // flat disc
    ctx.fillStyle = coin.color;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();

    // mark
    ctx.save();
    ctx.translate(c - r, c - r);
    const s = r * 2;
    if (image) {
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(image, 0, 0, s, s);
    } else {
      currentFill = coin.color;
      (MARKS[coin.symbol] ?? MARKS.USDC)(ctx, s);
    }
    ctx.restore();
  };

  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  if (coin.logo) {
    const img = new Image();
    img.onload = () => {
      draw(img);
      texture.needsUpdate = true;
    };
    img.src = coin.logo;
  }
  return texture;
}
