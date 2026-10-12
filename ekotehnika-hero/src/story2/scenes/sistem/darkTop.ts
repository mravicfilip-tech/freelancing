// Story pixels where the ground under the top row is dark in Sistem, from the push into the forklift (190px into B) to the
// fork's light ground in L (u 11.8). The shell turns the top row's ink light over exactly this span and the band over the
// top row goes dark with it, both read this one pair, so the two can never disagree for a frame. Kept free of three so the
// version file can import it without pulling the scene into the first chunk.
export const SISTEM_DARK_TOP: [number, number][] = [[7790, 9480]];

export const darkTopAt = (pos: number) => SISTEM_DARK_TOP.some(([a, b]) => pos >= a && pos < b);
