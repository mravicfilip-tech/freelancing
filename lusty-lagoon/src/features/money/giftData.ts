// Mock gift card offers. Brands, codes and the 1st deposit blurbs are from the Figma (Gift Cards,
// 373:802). The Figma repeats one blurb on every card, so values and end dates vary here.

export type GiftFilter = 'all' | 'popular' | 'trending' | 'recent';

export type GiftOffer = {
  id: string;
  brand: string;
  domain: string;
  /** The headline the card leads with. */
  value: string;
  blurb: string;
  code: string;
  tags: Exclude<GiftFilter, 'all'>[];
  ends: string;
  ended?: boolean;
};

export const OFFERS: GiftOffer[] = [
  { id: 'betsson', brand: 'Betsson', domain: 'betsson.com', value: '100% up to $500', blurb: 'Get your 1st deposit matched 100% up to $500 in Bonus Credits.', code: 'BETSSON500', tags: ['popular', 'trending'], ends: 'Ends 30 Nov' },
  { id: 'royal', brand: 'Royal Partners', domain: 'royal.partners', value: '100% up to $200', blurb: 'Get your 1st deposit matched 100% up to $200 in Bonus Credits.', code: 'ROYAL200', tags: ['popular'], ends: 'Ends 15 Nov' },
  { id: 'bitstarz', brand: 'Bitstarz', domain: 'www.bitstarz.com', value: '100% up to $500', blurb: 'Get your 1st deposit matched 100% up to $500 in Bonus Credits.', code: 'STARZ500', tags: ['popular', 'recent'], ends: 'Ends 31 Dec' },
  { id: 'alpha', brand: 'Alpha Affiliates', domain: 'alpha-affiliates.com', value: '50 free spins', blurb: 'Make a 1st deposit of $20 or more and get 50 free spins on Gold Fever.', code: 'ALPHA50', tags: ['trending'], ends: 'Ends 22 Nov' },
  { id: '1win', brand: '1Win', domain: 'www.1win.com', value: '100% up to $500', blurb: 'Get your 1st deposit matched 100% up to $500 in Bonus Credits. Read the FAQ first to check you qualify.', code: '1WIN500', tags: ['popular', 'trending'], ends: 'Ends 30 Nov' },
  { id: 'casumo', brand: 'Casumo', domain: 'www.casumo.com', value: '$25 no deposit', blurb: 'A $25 credit on sign-up, no deposit needed. One per player.', code: 'CASUMO25', tags: ['recent'], ends: 'Ends 10 Nov' },
  { id: 'vpartners', brand: 'vPartners', domain: 'www.vpartners.xyz', value: '100% up to $500', blurb: 'Get your 1st deposit matched 100% up to $500 in Bonus Credits.', code: 'VPARTNERS500', tags: ['recent'], ends: 'Ends 5 Dec' },
  { id: 'fortunejack', brand: 'Fortune Jack', domain: 'www.fortunejack.com', value: '150% up to $1,000', blurb: 'Get your 1st deposit matched 150% up to $1,000 in Bonus Credits. Crypto deposits only.', code: 'FORTUNEJACK1000', tags: ['trending'], ends: 'Ended 12 Oct', ended: true },
  { id: 'the-long-one', brand: 'International Sweepstakes and Gaming Partners Alliance', domain: 'www.international-sweepstakes-gaming-partners-alliance.example.com', value: '20% weekly cashback', blurb: 'Cashback on your net losses every Monday, paid as Bonus Credits with no wagering. Applies to slots only.', code: 'ISGPA-CASHBACK-20', tags: ['recent'], ends: 'Ends 31 Dec' },
];

const BRANDS = ['Nova', 'Sunset', 'Harbor', 'Lumen', 'Tidal', 'Ember', 'Cobalt', 'Maple', 'Orbit', 'Delta'];

// 60 offers, for the large list state.
export function largeOffers(): GiftOffer[] {
  const out: GiftOffer[] = [...OFFERS];
  const tags: GiftOffer['tags'][] = [['popular'], ['trending'], ['recent'], ['popular', 'recent']];
  for (let i = 0; i < 51; i++) {
    const brand = `${BRANDS[i % BRANDS.length]} ${['Play', 'Bet', 'Spin', 'Club'][i % 4]}`;
    const slug = brand.toLowerCase().replace(' ', '');
    out.push({
      id: `big${i}`,
      brand,
      domain: `www.${slug}.com`,
      value: `${50 + (i % 5) * 25}% up to $${(2 + (i % 4)) * 100}`,
      blurb: `Get your 1st deposit matched ${50 + (i % 5) * 25}% up to $${(2 + (i % 4)) * 100} in Bonus Credits.`,
      code: `${slug.toUpperCase()}${100 + i}`,
      tags: tags[i % tags.length],
      ends: `Ends ${5 + (i % 24)} Dec`,
    });
  }
  return out;
}

// Codes a player might already hold. Anything else is not recognised.
export const VALID_CODES: Record<string, number> = { LAGOON25: 25, WELCOME10: 10, SPRING100: 100 };
export const USED_CODES = ['SUMMER50'];
