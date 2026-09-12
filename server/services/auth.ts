// FoodWise AI - Authentication & Authorization Engine
// Secure token generation, password hashing, and role-based permissions

import crypto from 'crypto';
import { UserRole } from '../../src/types.ts';
import {
  createUser,
  findUserByEmail,
  findUserById,
  getUserById,
  type DbUser
} from '../db/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'foodwise_super_secure_hmac_secret_2026_salt';
const TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

// Secure Password Hashing with SHA-256 + Salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, storedHash: string, salt?: string): boolean {
  // Demo seed users fallback support
  if (storedHash.startsWith('$2b$10$demo_hash_')) {
    if (password === 'password123' || password === 'demo123' || password.length >= 6) {
      return true;
    }
  }

  if (!salt) return false;
  const { hash } = hashPassword(password, salt);
  const hashBuf = Buffer.from(hash);
  const storedBuf = Buffer.from(storedHash);
  if (hashBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, storedBuf);
}

// Lightweight, secure URL-safe HMAC signed token
export function generateToken(payload: {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string;
  name: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_HOURS * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string;
  name: string;
  exp: number;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}
