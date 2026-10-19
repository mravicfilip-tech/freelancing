// Mock accounts and checks for the auth screens. No server, so these stand in for one.

export const TAKEN_EMAIL = 'john.d@gmail.com';
export const WRONG_PASSWORD = 'wrong';
export const SIGN_IN_DELAY = 800;

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;
const AGENT_CODE = /^[A-Za-z0-9]{4,12}$/;

export const isEmail = (v: string) => EMAIL.test(v.trim());

export function emailError(v: string): string | undefined {
  const email = v.trim();
  if (!email) return 'Enter your email address.';
  if (!isEmail(email)) return 'That email is not complete. Use the form name@example.com.';
  return undefined;
}

export function usernameError(v: string): string | undefined {
  const name = v.trim();
  if (!name) return 'Choose a username.';
  if (!USERNAME.test(name)) return 'Use 3 to 20 letters, numbers or underscores, with no spaces.';
  return undefined;
}

export function agentCodeError(v: string): string | undefined {
  const code = v.trim();
  if (!code) return undefined;
  if (!AGENT_CODE.test(code)) return 'An agent code is 4 to 12 letters or numbers. Check it, or leave the field empty.';
  return undefined;
}

export function newPasswordError(v: string): string | undefined {
  if (!v) return 'Choose a password.';
  if (v.length < 8 || !/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return 'Use at least 8 characters, with a letter and a number.';
  return undefined;
}

export function confirmError(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Type the password again to confirm it.';
  if (confirm !== password) return 'The passwords do not match. Type the same password in both fields.';
  return undefined;
}

export const TAKEN_MESSAGE = 'An account already uses this email. Use a different email, or log in to that account.';
