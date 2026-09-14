/**
 * No backend yet: one demo account, and a session flag in localStorage so the
 * sign-in and log-out moves can be tried end to end.
 */
export const DEMO = { email: 'filip@remittix.io', password: 'Presale2026!' } as const;

const KEY = 'rtx-session';

export function signIn(email: string, password: string): string | null {
  if (email.trim().toLowerCase() !== DEMO.email || password !== DEMO.password) {
    return 'That email and password do not match. The demo account is filled in for you.';
  }
  try { localStorage.setItem(KEY, email.trim().toLowerCase()); } catch { /* private mode */ }
  return null;
}

export function register(email: string) {
  try { localStorage.setItem(KEY, email.trim().toLowerCase()); } catch { /* private mode */ }
}

export function signOut() {
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
}
