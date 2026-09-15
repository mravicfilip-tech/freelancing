import { useEffect, useState } from 'react';
import { CheckIcon } from '../icons';

/** A "Saved" that shows for a couple of seconds after a card's button. */
export function useSaved(): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2600);
    return () => window.clearTimeout(t);
  }, [saved]);
  return [saved, () => setSaved(true)];
}

/** The green pill the settings cards confirm with; `on` shows it. */
export function Saved({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className="set-saved" role="status" aria-live="polite">
      {on && <span className="set-saved__pill"><CheckIcon className="icon-16" />{children}</span>}
    </span>
  );
}
