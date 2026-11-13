export const norm = (e) => e.trim().toLowerCase();
export const emailOk = (e) => norm(e).length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(norm(e));
export const RULES = [
  { id: 'len', label: '8 to 72 characters', test: (p) => p.length >= 8 && p.length <= 72 },
  { id: 'up', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lo', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'num', label: 'One number', test: (p) => /\d/.test(p) },
  { id: 'sp', label: 'One special character', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: 'ws', label: 'No spaces', test: (p) => !/\s/.test(p) },
];
export const passOk = (p) => RULES.every((r) => r.test(p));
export function friendly(err) {
  const m = `${err?.message ?? ''} ${err?.code ?? ''}`;
  if (/invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
  if (/rate.?limit|too many|429/i.test(m) || err?.status === 429) return 'Too many attempts. Wait a minute and try again.';
  if (/expired|invalid/i.test(m) && /token|otp/i.test(m)) return 'That code is wrong or has expired. Request a new one.';
  if (/different from the old/i.test(m)) return 'Choose a password you haven’t used before.';
  if (/network|fetch/i.test(m)) return 'No internet connection. Check your network and try again.';
  return 'Something went wrong. Try again.';
}
