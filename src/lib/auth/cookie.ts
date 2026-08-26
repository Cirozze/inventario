/**
 * Firma e verifica del cookie di sessione con HMAC-SHA256, usando la Web
 * Crypto API (crypto.subtle). Funziona sia nel middleware (Edge runtime)
 * sia nelle API routes (Node runtime) con lo stesso identico codice.
 */

export const SESSION_COOKIE_NAME = "session";

interface SessionPayload {
  exp: number; // unix timestamp (ms) di scadenza
}

function textToBytes(text: string): Uint8Array<ArrayBuffer> {
  // Uint8Array.from forza un nuovo ArrayBuffer "puro" (richiesto da
  // BufferSource nelle tipizzazioni DOM piu' recenti), invece
  // dell'ArrayBufferLike restituito direttamente da TextEncoder.encode().
  return Uint8Array.from(new TextEncoder().encode(text));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("COOKIE_SECRET deve essere definita nelle variabili d'ambiente");
  }
  return secret;
}

export function getCookieExpiryDays(): number {
  const raw = process.env.COOKIE_EXPIRY_DAYS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

/** Crea il valore firmato del cookie di sessione (payload.signature). */
export async function createSessionCookieValue(): Promise<string> {
  const expiryDays = getCookieExpiryDays();
  const payload: SessionPayload = {
    exp: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = bytesToBase64Url(textToBytes(JSON.stringify(payload)));

  const key = await importHmacKey(getCookieSecret());
  const signature = await crypto.subtle.sign("HMAC", key, textToBytes(payloadB64));
  const signatureB64 = bytesToBase64Url(new Uint8Array(signature));

  return `${payloadB64}.${signatureB64}`;
}

/** Verifica il valore del cookie: firma valida e non scaduto. */
export async function verifySessionCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, signatureB64] = parts;

  try {
    const key = await importHmacKey(getCookieSecret());
    const signatureBytes = base64UrlToBytes(signatureB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      textToBytes(payloadB64)
    );
    if (!valid) return false;

    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    if (typeof payload.exp !== "number") return false;

    return Date.now() < payload.exp;
  } catch {
    return false;
  }
}
