// The stops of the story, round 7. Filip held the wheel down and the page ran through every section, "us skipping content is not what we
// want". A stop is the story pixel in a section where its words have finished arriving, and the scroll clock waits there while the wheel is
// still being turned (scroll/useScrollStory.ts, feel 7). Every stop is worked out from the spans in timeline.ts when the page loads, so
// they move with the spans when another builder changes them, and nothing here holds a pixel of its own.
//
// The words of a beat have arrived when the last of three things is done, the parts have come in (WIPE_DONE of the beat), the figures
// have counted up (COUNT_DONE) and the lede has filled from grey to ink (FILL_TO). The first two are stretched by SLOW, the beats whose
// text takes a few hundred pixels of a long beat. A stop never sits where the text has already left.
//
// Najam is one long beat in four sub beats (N_SUB). N1 stops where the words of N have arrived, held inside its window. N2 and N4 bring no
// new words, so they stop where the camera has settled for them, at the start of their window. N3 is the terms pane, it stops where the
// terms have arrived, held inside its window, so the four pallets and the lit term have the screen to themselves.
import { COUNT_DONE, FILL_TO, WIPE_DONE } from './shell/motion';
import { NAJAM_TERMS, N_SUB, SERVIS_MAP, TIMELINE, WAREHOUSE, type BeatSpan } from './timeline';

// Beats whose text reveals over more or less of the hold than WIPE_DONE, by the factor given. C1's wipes and counts took about 144px of
// scroll, one or two wheel ticks (Filip 2026-10-12, video round 4, "this animation is happening too fast"), so they run over
// 0.36 of the hold, twice the old pace, which is 1.45 times the slower pace every beat has now.
// S and its map take the same 250 to 300px for their text as the other holds, though S is 2000px long now.
// N is 4,300px now and its text keeps the 375px it took when N was 900, the terms pane takes about 330px of its 1,800.
export const SLOW: Record<string, number> = { C1: 1.45, S: 0.5, SM: 0.9, ...(WAREHOUSE ? { N: 0.094, NT: 0.69 } : {}) };

// The story pixel where the words of a span have arrived.
function arrived(span: BeatSpan, slow = 1) {
  return span.start + (span.end - span.start) * Math.max(FILL_TO, COUNT_DONE * slow, WIPE_DONE * slow);
}

// The hero's words come in on real time and then follow the clock, so its stop is the same share of H as any other beat's.
const at = (id: string) => TIMELINE.find((b) => b.id === id)!;
const hold = (id: string, span: BeatSpan = at(id)) => arrived(span, SLOW[id] ?? 1);

function stops() {
  const out: number[] = [hold('H'), hold('C1'), hold('R'), hold('P'), hold('S'), hold('SM', SERVIS_MAP), hold('AT')];
  if (WAREHOUSE) {
    const n = at('N');
    const px = (k: number) => n.start + k * (n.end - n.start);
    // N1, the words of N, held inside the lorry's arrival
    out.push(Math.min(hold('N'), px(N_SUB.N1[1])));
    // N2, the camera has come to dock 1 and the unloading starts
    out.push(px(N_SUB.N2[0]));
    // N3, the terms have arrived, held inside the loading of the racks
    out.push(Math.min(hold('NT', NAJAM_TERMS), px(N_SUB.N3[1])));
    // N4, the high view is back and the lorry is loaded
    out.push(px(N_SUB.N4[0]));
  } else {
    out.push(hold('N'));
  }
  // the end of the story is not a stop, the page leaves it freely
  return out.filter((s) => s > 0 && s < at('AT').end - 1).sort((a, b) => a - b);
}

/** The stops in story pixels, ascending. */
export const STOPS = stops();
