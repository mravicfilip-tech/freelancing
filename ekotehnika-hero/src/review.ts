// Review switches for variant boards, not part of any design. ?hv=<n> picks a hover variant of the primary button and ?mk=<n> a
// marker variant of the Prodaja points, set on the root so the CSS can scope each variant. Removed once Filip picks.
const q = new URLSearchParams(window.location.search);
for (const key of ['hv', 'mk']) {
  const v = q.get(key);
  if (v && /^[1-5]$/.test(v)) document.documentElement.setAttribute(`data-${key}`, v);
}
