/** Where PayFi will pay out, and what a transfer there costs. Illustrative. */
export type Corridor = { iso: string; country: string; ccy: string; perUsd: number; fee: number; eta: string; rail: string; flag: string };

export const CORRIDORS: Corridor[] = [
  { iso: 'GB', country: 'United Kingdom', ccy: 'GBP', perUsd: 0.78, fee: 2.5, eta: 'Same day', rail: 'Faster Payments', flag: '/figma/flags/gb.svg' },
  { iso: 'DE', country: 'Germany', ccy: 'EUR', perUsd: 0.92, fee: 2.5, eta: 'Same day', rail: 'SEPA Instant', flag: '/figma/flags/de.svg' },
  { iso: 'FR', country: 'France', ccy: 'EUR', perUsd: 0.92, fee: 2.5, eta: 'Same day', rail: 'SEPA Instant', flag: '/figma/flags/fr.svg' },
  { iso: 'ES', country: 'Spain', ccy: 'EUR', perUsd: 0.92, fee: 2.5, eta: 'Same day', rail: 'SEPA Instant', flag: '/figma/flags/es.svg' },
  { iso: 'NL', country: 'Netherlands', ccy: 'EUR', perUsd: 0.92, fee: 2.5, eta: 'Same day', rail: 'SEPA Instant', flag: '/figma/flags/nl.svg' },
  { iso: 'US', country: 'United States', ccy: 'USD', perUsd: 1, fee: 2.5, eta: 'Same day', rail: 'ACH, FedNow', flag: '/figma/flags/us.svg' },
  { iso: 'CH', country: 'Switzerland', ccy: 'CHF', perUsd: 0.88, fee: 3, eta: 'Next day', rail: 'SIC', flag: '/figma/flags/ch.svg' },
  { iso: 'AE', country: 'United Arab Emirates', ccy: 'AED', perUsd: 3.67, fee: 3, eta: 'Same day', rail: 'IPP', flag: '/figma/flags/ae.svg' },
  { iso: 'IN', country: 'India', ccy: 'INR', perUsd: 83.5, fee: 2, eta: 'Same day', rail: 'IMPS, UPI', flag: '/figma/flags/in.svg' },
  { iso: 'SG', country: 'Singapore', ccy: 'SGD', perUsd: 1.34, fee: 2.5, eta: 'Same day', rail: 'FAST', flag: '/figma/flags/sg.svg' },
  { iso: 'AU', country: 'Australia', ccy: 'AUD', perUsd: 1.52, fee: 2.5, eta: 'Same day', rail: 'NPP', flag: '/figma/flags/au.svg' },
  { iso: 'CA', country: 'Canada', ccy: 'CAD', perUsd: 1.37, fee: 2.5, eta: 'Next day', rail: 'Interac', flag: '/figma/flags/ca.svg' },
  { iso: 'RS', country: 'Serbia', ccy: 'RSD', perUsd: 108, fee: 3, eta: 'Next day', rail: 'IPS', flag: '/figma/flags/rs.svg' },
];
