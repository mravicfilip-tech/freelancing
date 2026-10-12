// The button look, picked on the page with ?btn=<structure><hover>, for example ?btn=3C, default 1A. Structures 1 to 6, hovers
// A to E. It sets data-bs and data-bh on the html element, the button rules in src/ui/heroframe.css read them, so the whole
// site follows. /?buttons shows every pair on one board.
export type BtnPair = { bs: string; bh: string };

export function btnPair(): BtnPair {
  const v = (new URLSearchParams(window.location.search).get('btn') ?? '').toUpperCase();
  const m = /^([1-6])([A-E])$/.exec(v);
  return m ? { bs: m[1], bh: m[2] } : { bs: '1', bh: 'A' };
}

export function applyBtnVariant() {
  const { bs, bh } = btnPair();
  document.documentElement.setAttribute('data-bs', bs);
  document.documentElement.setAttribute('data-bh', bh);
}
