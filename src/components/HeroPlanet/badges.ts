import * as THREE from 'three';

export interface CoinSpec {
  symbol: string;
  color: string;
  glyph: string;
  logo?: string;
}

/**
 * Builds a camera-facing badge texture: white disc, thin grey rim, coloured inner disc with the
 * coin glyph. If `logo` is set the image is drawn into the inner disc instead (async).
 */
export function makeBadgeTexture(coin: CoinSpec, px: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  const c = px / 2;

  const draw = (image?: HTMLImageElement) => {
    ctx.clearRect(0, 0, px, px);
    // soft shadow so the badge lifts off the light background
    ctx.save();
    ctx.shadowColor = 'rgba(17,18,20,0.18)';
    ctx.shadowBlur = px * 0.08;
    ctx.shadowOffsetY = px * 0.02;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(c, c, px * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(17,18,20,0.10)';
    ctx.lineWidth = Math.max(1, px * 0.01);
    ctx.beginPath();
    ctx.arc(c, c, px * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    const r = px * 0.31;
    if (image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(image, c - r, c - r, r * 2, r * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = coin.color;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(px * 0.34)}px Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(coin.glyph, c, c + px * 0.015);
    }
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
