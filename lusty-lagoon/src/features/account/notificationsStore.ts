import { useSyncExternalStore } from 'react';
import { BASE_ITEMS, largeItems, type NotificationItem } from './notificationsData';

// One small store, so the bell panel and the full page share read state. Marking an item read in
// the panel shows in the page and the other way round. ?state=empty or ?state=large seeds the list.

type Snapshot = { items: NotificationItem[]; unread: number };

const seed = (): NotificationItem[] => {
  const state = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('state');
  if (state === 'empty') return [];
  if (state === 'large') return largeItems();
  return BASE_ITEMS;
};

const count = (items: NotificationItem[]) => items.filter((n) => !n.read).length;

let current: Snapshot | null = null;
const listeners = new Set<() => void>();

function snapshot(): Snapshot {
  if (!current) {
    const items = seed();
    current = { items, unread: count(items) };
  }
  return current;
}

function set(items: NotificationItem[]) {
  current = { items, unread: count(items) };
  listeners.forEach((l) => l());
}

export const notificationActions = {
  markRead(id: string) {
    const { items } = snapshot();
    if (items.some((n) => n.id === id && !n.read)) set(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  },
  markAllRead() {
    const { items } = snapshot();
    if (items.some((n) => !n.read)) set(items.map((n) => (n.read ? n : { ...n, read: true })));
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useNotifications() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** For the bell badge in the top bar. */
export function useUnreadCount() {
  return useNotifications().unread;
}

// The page load time, so "4 min ago" stays put while the page is open.
const LOADED_AT = Date.now();

const dayTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function whenOf(minutesAgo: number) {
  const at = new Date(LOADED_AT - minutesAgo * 60_000);
  const iso = at.toISOString();
  const full = dayTime.format(at);
  if (minutesAgo < 1) return { iso, label: 'Just now', full };
  if (minutesAgo < 60) return { iso, label: `${minutesAgo} min ago`, full };
  if (minutesAgo < 24 * 60) return { iso, label: `${Math.floor(minutesAgo / 60)} h ago`, full };
  const midnight = new Date(LOADED_AT);
  midnight.setHours(0, 0, 0, 0);
  const yesterday = midnight.getTime() - 24 * 60 * 60_000;
  if (at.getTime() >= yesterday && at.getTime() < midnight.getTime()) return { iso, label: `Yesterday, ${clock.format(at)}`, full };
  return { iso, label: full, full };
}
