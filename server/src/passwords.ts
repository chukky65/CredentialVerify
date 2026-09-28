import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string) {
  if (password.length < 12) throw new Error('Use a password of at least 12 characters');
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function checkPassword(password: string, stored: string) {
  const [salt, digest] = stored.split(':');
  if (!salt || !digest || digest.length !== 128 || password.length > 1024) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(digest, 'hex'));
}
