import 'dotenv/config';
import { Pool, QueryResult } from 'pg';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('[DB] WARNING: DATABASE_URL not set in environment.');
}

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : undefined
);

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err);
});

// Helper for atomic queries
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    // console.log('[DB Query]', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
}

// Token encryption & decryption helpers (AES-256-GCM)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'dawnexus_token_vault_aes256_32char_key_2026!';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSecret(cipherText: string): string {
  const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted secret format.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Hash API keys (SHA-256)
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
