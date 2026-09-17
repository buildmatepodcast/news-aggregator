import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set - required to sign/verify session cookies");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** email -> signed, expiring session token suitable for a cookie value. */
export function createSessionToken(email: string): string {
  const payload = JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** Verifies signature + expiry, returns the email if valid. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const { email, exp } = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (typeof email !== "string" || typeof exp !== "number") return null;
    if (Date.now() > exp) return null;
    return email;
  } catch {
    return null;
  }
}

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString("base64url");
}
