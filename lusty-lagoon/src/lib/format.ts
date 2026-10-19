const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const plain = (digits: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: Math.min(2, digits), maximumFractionDigits: digits });

export const formatUsd = (n: number) => usd.format(n);
export const formatAmount = (n: number, digits = 2) => plain(digits).format(n);
export const formatToken = (n: number, symbol: string, digits = 2) => `${formatAmount(n, digits)} ${symbol}`;
export const formatPoints = (n: number) => new Intl.NumberFormat('en-US').format(n);

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function formatDate(iso: string) {
  const d = new Date(iso);
  return { day: dateFmt.format(d), time: timeFmt.format(d) };
}

/** Shortens a long hash or address to its first and last characters. */
export function middleTruncate(value: string, head = 8, tail = 6) {
  return value.length <= head + tail + 3 ? value : `${value.slice(0, head)}...${value.slice(-tail)}`;
}
