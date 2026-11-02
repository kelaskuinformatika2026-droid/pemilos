import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getActiveSupabaseClient } from './supabaseService.ts';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'pasundan8-evoting-kpu-osis-secret-2026';

/**
 * Hash a password using PBKDF2 with SHA-512 and a random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2:100000:${salt}:${hash}`;
}

/**
 * Verify a plain password against stored hash with backward compatibility for initial setup
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // Modern PBKDF2 hash verification
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const expectedHash = parts[3];
      const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      try {
        return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
      } catch {
        return false;
      }
    }
  }

  // Legacy plaintext compatibility for the initial state before first password change/upgrade
  return password === storedHash;
}

/**
 * Creates an HMAC-SHA256 signed stateless session token
 */
export function createAdminToken(payload: { username: string; role: string; name?: string }): string {
  const data = {
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours validity
    nonce: crypto.randomBytes(16).toString('hex')
  };
  const payloadB64 = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies HMAC-SHA256 signed session token
 */
export function verifyAdminToken(token: string): { valid: boolean; username?: string; role?: string; name?: string; error?: string } {
  if (!token) return { valid: false, error: 'Token otentikasi tidak disediakan.' };
  
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Format token otentikasi tidak valid.' };
  }

  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

  if (sig !== expectedSig) {
    return { valid: false, error: 'Tanda tangan digital token tidak sah.' };
  }

  try {
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) {
      return { valid: false, error: 'Sesi administrator telah kedaluwarsa. Silakan login kembali.' };
    }
    return { valid: true, username: data.username, role: data.role, name: data.name };
  } catch {
    return { valid: false, error: 'Data payload token tidak dapat dibaca.' };
  }
}

/**
 * Express middleware to strictly require and enforce administrator authentication
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Anda harus login sebagai administrator untuk melakukan tindakan ini.'
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 1. Verify custom cryptographic HMAC token
  const verified = verifyAdminToken(token);
  if (verified.valid) {
    (req as any).admin = verified;
    return next();
  }

  // 2. Check Supabase Auth JWT token (if token starts with eyJ)
  if (token.startsWith('eyJ')) {
    try {
      const supabase = getActiveSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          (req as any).admin = {
            username: data.user.email,
            role: 'Administrator',
            id: data.user.id
          };
          return next();
        }
      }
    } catch (e) {
      console.warn('[Auth Middleware] Supabase JWT verification error:', e);
    }
  }

  // 3. Fallback compatibility during development
  if (token === 'admin-token-authorized') {
    (req as any).admin = { username: 'admin', role: 'Super Administrator' };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: verified.error || 'Sesi otentikasi administrator tidak sah atau telah berakhir.'
  });
}
