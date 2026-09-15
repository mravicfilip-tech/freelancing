/**
 * PayFi beta requests. No backend yet: each request is stored against the
 * signed-in account in localStorage, which is enough to try the success,
 * duplicate and error states end to end.
 */
const KEY = 'rtx-payfi-beta';

type Request = { user: string; email: string; at: string };

function who(): string {
  try { return localStorage.getItem('rtx-session') ?? 'guest'; } catch { return 'guest'; }
}
function all(): Request[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Request[]; } catch { return []; }
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Outcome = 'ok' | 'invalid' | 'exists' | 'error';

/** Files a request; says which of the four states the form should show. */
export function request(raw: string): Outcome {
  const email = raw.trim().toLowerCase();
  if (!EMAIL.test(email)) return 'invalid';
  const list = all();
  if (list.some((r) => r.email === email)) return 'exists';
  try {
    localStorage.setItem(KEY, JSON.stringify([...list, { user: who(), email, at: new Date().toISOString() }]));
  } catch {
    return 'error';
  }
  return 'ok';
}

/** The request this account already has on file, if any. */
export function existing(): string | null {
  const me = who();
  return all().find((r) => r.user === me)?.email ?? null;
}
