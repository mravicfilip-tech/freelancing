import { BrandText } from './BrandText';
import { cn } from '../../lib/cn';

// The wordmark from the Figma file (339:2088). Bai Jamjuree Bold in capitals, LUSTY over LAGOON on
// one left edge, a white to ice blue fill and a hard purple copy 2px below with a thin purple rim.
// The soft glow and drop shadow layers are dropped (note 2).
export function Logo({ className }: { className?: string }) {
  return (
    <BrandText drop={2} rim={1.5} className={cn('text-[23px] leading-[25px]', className)}>
      <span className="block">Lusty</span>
      <span className="block">Lagoon</span>
    </BrandText>
  );
}
