import { RARITY, type Prize } from './data';
import { CoinsGlyph, Dots, FlashGlyph, Ornament, StarGlyph } from './art';

/**
 * One prize card, 160 by 250 as the Figma card is: the brand mark top left,
 * three corner ornaments and a dot cluster in the rarity's colour, the glyph
 * for what the prize is, the value with its glow, and the odds line. The
 * electric border is drawn over the whole row by FxRow (see arc.ts).
 */
export function PrizeCard({ p, won, className }: { p: Prize; won?: boolean; className?: string }) {
  const c = RARITY[p.rarity];

  const Glyph = p.kind === 'cash' ? CoinsGlyph : p.kind === 'bonus' ? FlashGlyph : StarGlyph;

  return (
    <div
      className={`prize${className ? ` ${className}` : ''}`}
      data-rarity={p.rarity}
      data-won={won ? 'true' : undefined}
      style={{ '--p-ink': c.ink, '--p-text': c.text, '--p-glow': c.glow.join(','), '--p-wash-a': c.wash[0], '--p-wash-b': c.wash[1], '--p-wash-c': c.wash[2] } as React.CSSProperties}
    >
      <img className="prize__brand" src="/figma/logo-lime.svg" alt="" width={22} height={12} />
      <Ornament className="prize__orn prize__orn--a" opacity={0.42} />
      <Ornament className="prize__orn prize__orn--b" opacity={0.1} />
      <Ornament className="prize__orn prize__orn--c" opacity={0.1} />
      <Dots className="prize__dots" />
      <span className="prize__glyph"><Glyph /></span>
      <span className="prize__value">{p.value}</span>
      <span className="prize__sub">{p.sub}</span>
      <span className="prize__odds">{p.odds}% — {c.label}</span>
    </div>
  );
}
