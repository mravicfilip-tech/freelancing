import { useEffect, useState } from 'react';
import { TRANSACTIONS, type TxRow } from './data';

/** Same latency and same once-per-session cache as the dashboard's data hook. */
const LATENCY_MS = 900;
const cache = new Map<string, Promise<TxRow[]>>();

function load(empty: boolean) {
  const key = empty ? 'empty' : 'full';
  let p = cache.get(key);
  if (!p) {
    p = new Promise((resolve) => setTimeout(() => resolve(empty ? [] : TRANSACTIONS), LATENCY_MS));
    cache.set(key, p);
  }
  return p;
}

export function useTransactions(empty = false) {
  const [rows, setRows] = useState<TxRow[] | null>(null);
  useEffect(() => {
    let live = true;
    load(empty).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [empty]);
  return rows;
}
