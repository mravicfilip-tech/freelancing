// The client's own logo files, cropped to the artwork with the ground square removed. Never
// redrawn. on-dark is white and red, on-light is black and red, on-red has a black Bull and
// on-red-alt a white Bull, matching the four lockups Filip sent.
type Variant = 'on-dark' | 'on-light' | 'on-red' | 'on-red-alt';
type Kind = 'logo' | 'mark' | 'wordmark';

const RATIO: Record<Kind, number> = { logo: 860 / 488, mark: 860 / 308, wordmark: 824 / 172 };

export function Logo({ variant, kind = 'logo', height, className, alt = 'BullHill' }: { variant: Variant; kind?: Kind; height: number; className?: string; alt?: string }) {
  return (
    <img
      src={`/brand/${kind}-${variant}.svg`}
      alt={alt}
      height={height}
      width={Math.round(height * RATIO[kind])}
      className={className}
      draggable={false}
    />
  );
}
