import * as THREE from 'three';

export interface CoinSpec {
  symbol: string;
  color: string;
  logo?: string;
}

export type BadgeStyle = 'color' | 'mono';

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
    ctx.fillRect(0.26 * s, 0.24 * s, 0.48 * s, 0.11 * s);
    ctx.fillRect(0.44 * s, 0.24 * s, 0.12 * s, 0.52 * s);
    ctx.lineWidth = 0.075 * s;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0.5 * s, 0.46 * s, 0.27 * s, 0.085 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = currentFill;
    ctx.fillRect(0.44 * s, 0.4 * s, 0.12 * s, 0.12 * s);
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

/**
 * A coin token: flat disc with a white keyline and the coin mark. `mono` renders every coin
 * as an ink disc. If `logo` is set the image replaces the drawn mark.
 */
export function makeBadgeTexture(coin: CoinSpec, px: number, style: BadgeStyle = 'color', monoColor = '#111214'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  const c = px / 2;
  const r = px * 0.36;
  const fill = style === 'mono' ? monoColor : coin.color;

  const draw = (image?: HTMLImageElement) => {
    ctx.clearRect(0, 0, px, px);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(c, c, r + px * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(c - r, c - r);
    const s = r * 2;
    if (image) {
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(image, 0, 0, s, s);
    } else {
      currentFill = fill;
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

/** A white label chip with a hairline border: a bold line and a quieter line beneath. */
/**
 * The chip that names a corridor, drawn like the rate chips on the presale slide: a small grey
 * uppercase pair on top ("ETH → INR") and the bold route beneath, centred, on a silver card.
 * Drawn at 512px tall so a mip level lands close to the on-screen size and the text stays sharp.
 */
export function makeLabelTexture(title: string, subtitle: string, heightPx = 512): { texture: THREE.CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const family = '"Onest Variable", "Instrument Sans Variable", Arial, sans-serif';
  const small = Math.round(heightPx * 0.19);
  const big = Math.round(heightPx * 0.25);
  const gap = Math.round(heightPx * 0.07);
  const fontSmall = `700 ${small}px ${family}`;
  const fontBig = `700 ${big}px ${family}`;
  const pair = subtitle.toUpperCase();
  ctx.font = fontSmall;
  ctx.letterSpacing = `${-small * 0.03}px`;
  const w1 = ctx.measureText(pair).width;
  ctx.font = fontBig;
  ctx.letterSpacing = `${-big * 0.03}px`;
  const w2 = ctx.measureText(title).width;
  const padX = Math.round(heightPx * 0.2);
  const width = Math.ceil(Math.max(w1, w2) + padX * 2);
  canvas.width = width;
  canvas.height = heightPx;
  const radius = heightPx * 0.1;
  const stroke = Math.max(1.5, heightPx * 0.012);

  ctx.beginPath();
  ctx.roundRect(stroke, stroke, width - stroke * 2, heightPx - stroke * 2, radius);
  ctx.fillStyle = '#f1f3f4';
  ctx.fill();
  ctx.lineWidth = stroke;
  ctx.strokeStyle = '#dadee2';
  ctx.stroke();

  const padY = (heightPx - small - gap - big) / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#a2a6aa';
  ctx.font = fontSmall;
  ctx.letterSpacing = `${-small * 0.03}px`;
  ctx.fillText(pair, width / 2, padY);
  ctx.fillStyle = '#122433';
  ctx.font = fontBig;
  ctx.letterSpacing = `${-big * 0.03}px`;
  ctx.fillText(title, width / 2, padY + small + gap);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, aspect: width / heightPx };
}
