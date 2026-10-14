import { useEffect, useState } from 'react';
import { content, type Content, type Lang } from './content';

function readLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang');
  return q === 'de' ? 'de' : 'en';
}

// The language lives in the URL, ?lang=de, so a link opens in the language it was sent in.
export function useContent(): [Content, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(readLang);
  useEffect(() => {
    const onPop = () => setLangState(readLang());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = content[lang].meta.title;
  }, [lang]);
  const setLang = (l: Lang) => {
    const url = new URL(window.location.href);
    if (l === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', l);
    window.history.replaceState(null, '', url);
    setLangState(l);
  };
  return [content[lang], setLang];
}
