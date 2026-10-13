// Story pixels where the ground under the top row is dark in Sistem, from the push into the forklift (190px into B) to the
// moment the light section docks on the top rule under the fork's blade in L (9300, k 0.5), while the steel still covers the
// rule from 9252 to 9345, so the flip happens under it. The shell turns the top row's ink light over exactly this span and the band over the
// top row goes dark with it, both read this one pair, so the two can never disagree for a frame. Kept free of three so the
// version file can import it without pulling the scene into the first chunk.
export const SISTEM_DARK_TOP: [number, number][] = [[7790, 9300]];

export const darkTopAt = (pos: number) => SISTEM_DARK_TOP.some(([a, b]) => pos >= a && pos < b);
