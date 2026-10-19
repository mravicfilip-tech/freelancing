import { cn } from '../../lib/cn';

// The wordmark from the Figma file. Bai Jamjuree Bold, uppercase, two lines with LAGOON set in,
// a white to ice blue fill and a hard purple copy 2px below. The soft glow layers are dropped.
export function Logo({ className }: { className?: string }) {
  const lines = (
    <>
      <span className="block">Lusty</span>
      <span className="block pl-3">Lagoon</span>
    </>
  );
  return (
    <span className={cn('relative inline-block font-display text-24 font-bold uppercase leading-none tracking-tight', className)}>
      <span aria-hidden className="absolute inset-0 translate-y-0.5 text-brand">
        {lines}
      </span>
      <span className="relative block bg-gradient-to-b from-white via-[#E1F5FE] to-[#B6E3F6] bg-clip-text text-transparent">
        {lines}
      </span>
    </span>
  );
}
