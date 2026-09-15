/**
 * The referral payout wallet: which networks USDT can be sent on, what a
 * valid address looks like on each, and where the saved wallet lives until
 * there is an account service to keep it.
 */
export const NETWORKS = [
  { id: 'erc20', name: 'Ethereum', standard: 'ERC-20', mark: 'ETH', test: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'trc20', name: 'Tron', standard: 'TRC-20', mark: 'T', test: /^T[1-9A-HJ-NP-Za-km-z]{33}$/ },
  { id: 'bep20', name: 'BNB Smart Chain', standard: 'BEP-20', mark: 'BNB', test: /^0x[0-9a-fA-F]{40}$/ },
  { id: 'sol', name: 'Solana', standard: 'SPL', mark: 'SOL', test: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { id: 'polygon', name: 'Polygon', standard: 'ERC-20', mark: 'P', test: /^0x[0-9a-fA-F]{40}$/ },
] as const;
export type NetworkId = (typeof NETWORKS)[number]['id'];

export type PayoutWallet = { address: string; network: NetworkId };

const KEY = 'rtx-referral-wallet';

export function loadWallet(): PayoutWallet | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const w = JSON.parse(raw) as PayoutWallet;
    return NETWORKS.some((n) => n.id === w.network) && typeof w.address === 'string' ? w : null;
  } catch {
    return null;
  }
}

export function saveWallet(w: PayoutWallet): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
    return true;
  } catch {
    return false;
  }
}

export type Problem = 'address' | 'network' | 'invalid';

/** Which of the form's messages applies, or nothing when the pair is good. */
export function check(address: string, network: NetworkId | null): Problem | null {
  if (!address.trim()) return 'address';
  if (!network) return 'network';
  const n = NETWORKS.find((x) => x.id === network)!;
  return n.test.test(address.trim()) ? null : 'invalid';
}
