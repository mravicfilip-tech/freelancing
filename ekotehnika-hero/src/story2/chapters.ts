// The chapters of the homepage story that the top menu opens at, Filip 18 November, Najam and Servis as chapters of this story and not
// pages of ekotehnika.rs. A link to /#najam or /#servis glides the story to that chapter's first stop, from another page once the story is
// pinned, on this page at once.
import { glideTo, storyStops } from '../scroll/useScrollStory';
import { TIMELINE } from './timeline';

const HOLD: Record<string, string> = { kompanija: 'C1', prodaja: 'P', servis: 'S', najam: 'N' };

/** Glides the story to the first stop of a chapter. False while the story is not pinned yet or the chapter is unknown. */
export function toChapter(ch: string) {
  const beat = TIMELINE.find((b) => b.id === HOLD[ch]);
  // the stops are not in order, the chapter's first is the lowest inside its beat
  const inside = beat ? storyStops().filter((s) => s > beat.start && s <= beat.end) : [];
  if (!inside.length) return false;
  const to = Math.min(...inside);
  glideTo(to);
  return true;
}

/** The chapter the address names, najam from /#najam, or an empty string. */
export const chapterOfHash = () => (typeof window === 'undefined' ? '' : decodeURIComponent(window.location.hash.slice(1)));

/** Follows the address to a chapter, at load once the story is pinned and on every change of the hash. Returns the cleanup. */
export function followChapterHash() {
  let timer = 0;
  const go = () => {
    window.clearInterval(timer);
    const ch = chapterOfHash();
    if (!HOLD[ch]) return;
    let tries = 0;
    timer = window.setInterval(() => {
      // the story pins once its loader has gone, which takes longer than a few seconds on a slow phone, so it waits up to 30
      if (toChapter(ch) || ++tries > 300) window.clearInterval(timer);
    }, 100);
  };
  go();
  window.addEventListener('hashchange', go);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('hashchange', go);
  };
}
