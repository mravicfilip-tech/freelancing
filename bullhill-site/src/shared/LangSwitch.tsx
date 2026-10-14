import type { Lang } from './content';

// Two plain buttons, EN and DE. aria-pressed marks the live one.
export function LangSwitch({ lang, setLang, label, className }: { lang: Lang; setLang: (l: Lang) => void; label: string; className?: string }) {
  return (
    <div className={className} role="group" aria-label={label}>
      {(['en', 'de'] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
