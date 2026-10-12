// The button variant, picked on the page with ?btn=1 to 5, default 1. It sets data-btn on the html element, and the
// button rules in src/ui/heroframe.css read it, so the whole site follows. /?buttons shows all five on one board.
export type BtnVariant = '1' | '2' | '3' | '4' | '5';

export function btnVariant(): BtnVariant {
  const v = new URLSearchParams(window.location.search).get('btn');
  return v && /^[1-5]$/.test(v) ? (v as BtnVariant) : '1';
}

export function applyBtnVariant() {
  document.documentElement.setAttribute('data-btn', btnVariant());
  document.documentElement.setAttribute('data-mk', mkVariant());
}

// The section marker variant, ?mk=1 to 4, default 1. 1 hairline and label, 2 index and name, 3 grid label cell, 4 no marker and
// the section name in the right edge counter.
export function mkVariant(): BtnVariant | '4' {
  const v = new URLSearchParams(window.location.search).get('mk');
  return v && /^[1-4]$/.test(v) ? (v as BtnVariant) : '1';
}
