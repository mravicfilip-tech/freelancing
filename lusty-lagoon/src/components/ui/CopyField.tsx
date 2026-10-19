import { useEffect, useState } from 'react';
import { Check, Copy } from '@phosphor-icons/react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

// A read only value with a Copy button. The button says Copied for two seconds and a live region
// tells screen reader users the same.
export function CopyField({ label, value, mono = true, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be blocked in some browsers. The value stays selectable either way.
    }
    setCopied(true);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-14 font-medium text-ink2">{label}</span>
      <div className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-sunken py-1 pl-4 pr-1">
        <span className={cn('min-w-0 flex-1 select-all break-all text-16 text-ink', mono && 'font-mono text-14')}>{value}</span>
        <Button variant="secondary" size="sm" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check weight="bold" className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? `${label} copied` : ''}
      </span>
    </div>
  );
}
