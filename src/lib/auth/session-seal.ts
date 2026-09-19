/**
 * Edge-compatible AES-GCM seal/unseal for the auth session cookie.
 * Base64 alone is NOT encryption — payloads are encrypted with AUTH_SESSION_SECRET.
 */

export type SealedSessionPayload = {
  token: string;
  tokenType: string;
  expiresAt: number;
  orgSchema: string;
  user: {
    userId: number;
    orgId: number;
    branchId: number;
    userName: string;
    shortName: string;
    userCode: string;
    userMob: string;
    userEmail: string;
    isActive: boolean;
    loginStatus: string;
    orgDisplayName: string;
    legalName: string;
    orgSchema: string;
    branchCode: string;
    branchName: string;
    isHead: boolean;
  };
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function sealSessionPayload(
  payload: SealedSessionPayload,
  secret: string,
): Promise<string> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return toBase64Url(combined);
}

export async function unsealSessionPayload(
  sealed: string,
  secret: string,
): Promise<SealedSessionPayload | null> {
  try {
    const combined = fromBase64Url(sealed);
    if (combined.length < 13) return null;
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await deriveKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    const parsed = JSON.parse(decoder.decode(plaintext)) as SealedSessionPayload;
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      !parsed.user ||
      typeof parsed.user.userId !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isSessionExpired(payload: SealedSessionPayload, now = Date.now()): boolean {
  return now >= payload.expiresAt;
}
