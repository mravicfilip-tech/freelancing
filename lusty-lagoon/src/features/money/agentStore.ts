import { useSyncExternalStore } from 'react';
import { SEEDED_SENDS, type AgentSend } from './agentData';
import { readQuery } from './shared';

// The wallet store's Transaction type only knows coins and cash methods, so an agent send cannot be
// recorded there with a label that reads clearly. Sends live in this small store instead, and
// AgentPage lists them under the form. The balance still moves through useWallet.

let list: AgentSend[] | null = null;
const listeners = new Set<() => void>();

const read = () => {
  if (!list) list = readQuery().get('state') === 'empty' ? [] : SEEDED_SENDS;
  return list;
};
const emit = () => listeners.forEach((l) => l());

export function addSend(send: AgentSend) {
  list = [send, ...read()];
  emit();
}

export function updateSend(id: string, patch: Partial<AgentSend>) {
  list = read().map((s) => (s.id === id ? { ...s, ...patch } : s));
  emit();
}

export function useAgentSends() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    read,
  );
}

let seq = 48213910;
export const nextSendId = () => `AG-${seq++}`;
