/**
 * Email requests: PayFi's beta whitelist and Earn's launch notice. No
 * backend yet: each request is stored against the signed-in account in
 * localStorage under its own key, which is enough to try the received,
 * duplicate and error states end to end.
 */
type Request = { user: string; email: string; at: string };

function who(): string {
  try { return localStorage.getItem('rtx-session') ?? 'guest'; } catch { return 'guest'; }
}
function all(key: string): Request[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as Request[]; } catch { return []; }
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Outcome = 'ok' | 'invalid' | 'exists' | 'error';

/** Files a request under `key`; says which state the form should show. */
export function request(key: string, raw: string): Outcome {
  const email = raw.trim().toLowerCase();
  if (!EMAIL.test(email)) return 'invalid';
  const list = all(key);
  if (list.some((r) => r.email === email)) return 'exists';
  try {
    localStorage.setItem(key, JSON.stringify([...list, { user: who(), email, at: new Date().toISOString() }]));
  } catch {
    return 'error';
  }
  return 'ok';
}

/** The request this account already has on file under `key`, if any. */
export function existing(key: string): string | null {
  const me = who();
  return all(key).find((r) => r.user === me)?.email ?? null;
}
