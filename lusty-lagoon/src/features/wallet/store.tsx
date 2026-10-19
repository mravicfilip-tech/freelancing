import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ACCOUNT, historyFor, type Transaction } from '../../data/wallet';

// Balance and history live here, so a finished deposit or withdrawal shows up in the top bar and
// at the top of the history table at once.
//
// URL switches for screenshots and the case study, read once on load.
//   ?history=loading|error|empty|large
//   ?access=locked   withdrawals locked until identity is verified
//   ?outcome=declined   card deposits are declined by the bank

export type HistoryState = 'ready' | 'loading' | 'error';

type Store = {
  balance: number;
  transactions: Transaction[];
  historyState: HistoryState;
  withdrawLocked: boolean;
  declineCards: boolean;
  retryHistory: () => void;
  record: (tx: Transaction, balanceChange: number) => void;
  update: (id: string, patch: Partial<Transaction>, balanceChange?: number) => void;
};

const Ctx = createContext<Store | null>(null);

const params = () => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    const q = params();
    const h = q.get('history');
    return {
      size: (h === 'empty' ? 'empty' : h === 'large' ? 'large' : 'default') as 'default' | 'large' | 'empty',
      state: (h === 'loading' ? 'loading' : h === 'error' ? 'error' : 'ready') as HistoryState,
      locked: q.get('access') === 'locked',
      decline: q.get('outcome') === 'declined',
    };
  });
  const [balance, setBalance] = useState(ACCOUNT.balance);
  const [transactions, setTransactions] = useState(() => historyFor(initial.size));
  const [historyState, setHistoryState] = useState<HistoryState>(initial.state);

  const retryHistory = useCallback(() => {
    setHistoryState('loading');
    setTimeout(() => setHistoryState('ready'), 900);
  }, []);

  const record = useCallback((tx: Transaction, balanceChange: number) => {
    setTransactions((list) => [tx, ...list]);
    setBalance((b) => Math.round((b + balanceChange) * 100) / 100);
  }, []);

  const update = useCallback((id: string, patch: Partial<Transaction>, balanceChange = 0) => {
    setTransactions((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (balanceChange) setBalance((b) => Math.round((b + balanceChange) * 100) / 100);
  }, []);

  const value = useMemo(
    () => ({
      balance,
      transactions,
      historyState,
      withdrawLocked: initial.locked,
      declineCards: initial.decline,
      retryHistory,
      record,
      update,
    }),
    [balance, transactions, historyState, initial, retryHistory, record, update],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useWallet needs WalletProvider');
  return s;
}

let seq = 48213908;
export const nextTxId = () => `LL-${seq++}`;
