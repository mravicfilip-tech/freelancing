/**
 * Indicative prices for the Markets preview. A seeded walk per pair, so the
 * page opens on the same chart every time and ticks from there; the real
 * feed lives on remittixmarkets.io.
 */
export type Pair = { id: string; base: string; quote: string; kind: 'Spot' | 'Perp'; start: number; decimals: number; volume: number };
export type Candle = { o: number; h: number; l: number; c: number };

export const PAIRS: Pair[] = [
  { id: 'BTC-USDT', base: 'BTC', quote: 'USDT', kind: 'Spot', start: 96_400, decimals: 1, volume: 412_000_000 },
  { id: 'ETH-USDT', base: 'ETH', quote: 'USDT', kind: 'Spot', start: 3_140, decimals: 2, volume: 188_000_000 },
  { id: 'SOL-USDT', base: 'SOL', quote: 'USDT', kind: 'Spot', start: 182, decimals: 2, volume: 64_000_000 },
  { id: 'BNB-USDT', base: 'BNB', quote: 'USDT', kind: 'Spot', start: 634, decimals: 2, volume: 41_000_000 },
  { id: 'RTX-USDT-PERP', base: 'RTX', quote: 'USDT', kind: 'Perp', start: 0.312, decimals: 4, volume: 9_800_000 },
  { id: 'ETH-USDT-PERP', base: 'ETH', quote: 'USDT', kind: 'Perp', start: 3_141.5, decimals: 2, volume: 236_000_000 },
];

export const N = 48;

/** A small seeded generator, so each pair's history is its own and stable. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function history(p: Pair): Candle[] {
  const r = rng(p.id.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 7));
  const out: Candle[] = [];
  let c = p.start * (1 - 0.012 + r() * 0.01);
  for (let i = 0; i < N; i++) {
    const o = c;
    const drift = (r() - 0.48) * 0.006;
    c = o * (1 + drift);
    const h = Math.max(o, c) * (1 + r() * 0.002);
    const l = Math.min(o, c) * (1 - r() * 0.002);
    out.push({ o, h, l, c });
  }
  // Land the last close on the pair's quoted price, so the ticker agrees with the chart.
  const k = p.start / out[N - 1].c;
  return out.map((x) => ({ o: x.o * k, h: x.h * k, l: x.l * k, c: x.c * k }));
}

/** One tick: the last candle moves, and every tenth tick a new one opens. */
export function tick(candles: Candle[], n: number, r: () => number): Candle[] {
  const last = candles[candles.length - 1];
  const c = last.c * (1 + (r() - 0.5) * 0.0024);
  if (n % 10 === 9) {
    return [...candles.slice(1), { o: last.c, h: Math.max(last.c, c), l: Math.min(last.c, c), c }];
  }
  return [...candles.slice(0, -1), { ...last, c, h: Math.max(last.h, c), l: Math.min(last.l, c) }];
}

export const fmt = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (a: number, b: number) => ((a / b - 1) * 100);
export const vol = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${(n / 1e3).toFixed(0)}K`);
