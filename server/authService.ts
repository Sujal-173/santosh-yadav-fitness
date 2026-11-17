import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getRedis } from './database';

const COOKIE_NAME = 'syf_admin_session';
const SESSION_PREFIX = 'admin:session:';
const SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 28800);

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function getAdminCredentials(): { email: string; passwordHash: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!email || !passwordHash) return null;
  return { email, passwordHash };
}

export function verifyAdminPassword(password: string, encodedHash: string): boolean {
  const [salt, expected] = encodedHash.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return safeEqual(actual, expected);
}

export function parseCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index >= 0 && part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

export async function createAdminSession(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await getRedis().set(`${SESSION_PREFIX}${tokenHash}`, JSON.stringify({ email, createdAt: Date.now() }), { EX: SESSION_TTL_SECONDS });
  return token;
}

export async function getAdminSession(token: string | null): Promise<{ email: string } | null> {
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const raw = await getRedis().get(`${SESSION_PREFIX}${tokenHash}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as { email: string }; } catch { return null; }
}

export async function destroyAdminSession(token: string | null): Promise<void> {
  if (!token) return;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await getRedis().del(`${SESSION_PREFIX}${tokenHash}`);
}

export function setAdminSessionCookie(res: Response, token: string): void {
  const parts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${SESSION_TTL_SECONDS}`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAdminSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = parseCookie(req, COOKIE_NAME);
    const session = await getAdminSession(token);
    if (!session) { res.status(401).json({ error: 'Unauthorized. Admin login required.' }); return; }
    (req as Request & { adminEmail?: string }).adminEmail = session.email;
    next();
  } catch (error) {
    console.error('Admin session lookup failed:', error);
    res.status(503).json({ error: 'Admin session service unavailable.' });
  }
}

export function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
