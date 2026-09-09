import { useCallback, useEffect, useRef, useState } from 'react';

/** Copy to the clipboard and flash a confirmation for two seconds. */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback((text: string) => {
    const done = () => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    };
    navigator.clipboard?.writeText(text).then(done, () => {
      /* denied clipboard permission: leave the affordance untouched */
    });
  }, []);

  return [copied, copy];
}
