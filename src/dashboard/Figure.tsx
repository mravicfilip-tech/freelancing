/**
 * A headline number. The currency symbol is set small and raised so the digits
 * carry the line, which is how the figure reads on every reference screen.
 */
export function Figure({
  symbol,
  value,
  suffix,
  className,
}: {
  symbol?: string;
  value: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <p className={className ? `fig ${className}` : 'fig'}>
      {symbol && <span className="fig__sym">{symbol}</span>}
      {value}
      {suffix && <span className="fig__suffix">{suffix}</span>}
    </p>
  );
}
