import 'dotenv/config';
import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'artigiani';

export const SESSION_COOKIE = 'artigiani_admin';
const MAX_AGE_S = 60 * 60 * 8; // 8 ore

function sign(value: string): string {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

/** Verifica la password admin (confronto a tempo costante). */
export function checkPassword(password: string): boolean {
  const a = Buffer.from(password || '');
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Crea il valore del cookie di sessione firmato. */
export function makeSession(): string {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE_S);
  return `${exp}.${sign(exp)}`;
}

/** Valida il valore del cookie di sessione. */
export function isValidSession(value: string | undefined): boolean {
  if (!value) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig) return false;
  if (sign(exp) !== sig) return false;
  return Number(exp) > Math.floor(Date.now() / 1000);
}

export const SESSION_MAX_AGE = MAX_AGE_S;
