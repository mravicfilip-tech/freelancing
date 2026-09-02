import { useEffect, useState } from 'react';

const PRESALE_END = Date.UTC(2026, 9, 15, 12, 0, 0); // 15 Oct 2026 12:00 UTC

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function CountdownBar() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const { d, h, m, s } = parts(PRESALE_END - now);
  return (
    <div className="countdown" role="status">
      <span className="countdown__label">Presale ends in</span>
      <span className="countdown__time">
        <span>{d}d</span>
        <span>{pad(h)}h</span>
        <span>{pad(m)}m</span>
        <span>{pad(s)}s</span>
      </span>
      <a className="countdown__link" href="#presale"><span className="countdown__link-text">Secure your </span>allocation →</a>
    </div>
  );
}
