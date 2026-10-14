// The service card art switch, read from the URL so a link opens the version it names.
//   ?v=1&svc=1..4   1 draw in, once as the card enters (the default for now)
//                   2 loop, a slow quiet loop while the card is on screen
//                   3 assemble, scattered dots settle into the drawing, once as the card enters
//                   4 on hover, version 1's draw once per hover, once at mid screen with no hover
export type SvcN = 1 | 2 | 3 | 4;
export const svcVariant = (): SvcN => {
  const n = Number(new URLSearchParams(window.location.search).get('svc'));
  return n >= 1 && n <= 4 ? (n as SvcN) : 1;
};
