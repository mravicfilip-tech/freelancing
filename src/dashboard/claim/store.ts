import type { Provider } from './wallets';

/** A filed claim request, kept in localStorage until there is a claims service. */
export type Claim = { provider: Provider; wallet: string; whitelist: string; email: string; phone: string; at: string };

const KEY = 'rtx-claim';

export function loadClaim(): Claim | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Claim) : null;
  } catch {
    return null;
  }
}

export function saveClaim(c: Claim): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    return true;
  } catch {
    return false;
  }
}

export function clearClaim() {
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
}
