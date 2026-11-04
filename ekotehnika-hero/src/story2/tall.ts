// The phone version, briefs/mobile/plan.md, Filip's yes of 4 November to its defaults. Any screen held upright, its width at most 4/5 of its
// height, a phone or a tablet, gets the tall layout and the tall camera. It is chosen by the screen's shape and not its width, so CSS uses the
// same line as a media query, @media (max-aspect-ratio: 4/5), and the camera tests the size it is drawn at each frame.
export const TALL_RATIO = 4 / 5;
export const TALL_QUERY = '(max-aspect-ratio: 4/5)';
export const isTall = (w: number, h: number) => w > 0 && h > 0 && w / h <= TALL_RATIO;

// The tall frame. The two logos stand at the top at their 160 by 96px screen minimum, the wordmark as wide and 30px away (LMH co-branding
// guideline 1.3), in a row top px high. A bar of bar px with the menu, the Hitan servis call and the quote button stands at the foot. The words
// of a beat stand on a frosted sheet that starts at sheet, a share of the stage height, and runs down to the bar. The camera keeps what matters in
// the band between the logos and the sheet, its middle at subject, a share of the stage height from the top.
export const TALL = { top: 120, bar: 64, sheet: 0.56, subject: 0.34 } as const;
