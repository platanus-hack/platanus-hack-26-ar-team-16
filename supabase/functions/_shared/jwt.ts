// @ts-nocheck — Deno runtime
// Minimal HS256 JWT verify/sign helpers for the public API edge functions.
// We avoid a full JWT lib to keep the cold-start small; HS256 is the only
// algorithm we accept (per ADR §10.1 — gym JWTs and Gohan session JWTs).

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlEncodeString(str: string): string {
  return b64urlEncode(new TextEncoder().encode(str));
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlDecodeString(s: string): string {
  return new TextDecoder().decode(b64urlDecode(s));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

export interface JwtClaims {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  [k: string]: unknown;
}

export function decodeJwtParts(token: string): { header: JwtHeader; payload: JwtClaims; signingInput: string; signature: Uint8Array } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(b64urlDecodeString(parts[0])) as JwtHeader;
    const payload = JSON.parse(b64urlDecodeString(parts[1])) as JwtClaims;
    const signature = b64urlDecode(parts[2]);
    return { header, payload, signingInput: `${parts[0]}.${parts[1]}`, signature };
  } catch (_err) {
    return null;
  }
}

export async function verifyHs256(token: string, secret: string): Promise<JwtClaims | null> {
  const parsed = decodeJwtParts(token);
  if (!parsed) return null;
  if (parsed.header.alg !== 'HS256') return null;
  const key = await importHmacKey(secret);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    parsed.signature,
    new TextEncoder().encode(parsed.signingInput)
  );
  if (!ok) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof parsed.payload.exp === 'number' && now >= parsed.payload.exp) return null;
  if (typeof parsed.payload.nbf === 'number' && now < parsed.payload.nbf) return null;

  return parsed.payload;
}

export async function signHs256(claims: JwtClaims, secret: string, kid?: string): Promise<string> {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  if (kid) header.kid = kid;
  const headerB64 = b64urlEncodeString(JSON.stringify(header));
  const payloadB64 = b64urlEncodeString(JSON.stringify(claims));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await importHmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  );
  return `${signingInput}.${b64urlEncode(sig)}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}
