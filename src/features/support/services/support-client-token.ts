import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { getAuthSessionSecret, isProductionEnv } from "@/lib/config/env";

const COOKIE = "mfin_support_client";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type StoredClientToken = {
  userId: number;
  phone: string;
  token: string;
  expiresAt: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function seal(payload: StoredClientToken): Promise<string> {
  const secret = getAuthSessionSecret();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return toBase64Url(combined);
}

async function unseal(sealed: string): Promise<StoredClientToken | null> {
  try {
    const secret = getAuthSessionSecret();
    const combined = fromBase64Url(sealed);
    if (combined.length < 13) return null;
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: combined.slice(0, 12) },
      key,
      combined.slice(12),
    );
    const parsed = JSON.parse(decoder.decode(plaintext)) as StoredClientToken;
    if (
      typeof parsed?.userId !== "number" ||
      typeof parsed.phone !== "string" ||
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      !parsed.phone ||
      !parsed.token
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: isProductionEnv(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function storePath(userId: number): string {
  return path.join(process.cwd(), "storage", "support-clients", `${userId}.seal`);
}

async function writeStoredToken(userId: number, sealed: string): Promise<void> {
  const file = storePath(userId);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, sealed, { encoding: "utf8", mode: 0o600 });
}

async function readStoredToken(userId: number): Promise<string | null> {
  try {
    const sealed = (await readFile(storePath(userId), "utf8")).trim();
    return sealed || null;
  } catch {
    return null;
  }
}

async function removeStoredToken(userId: number): Promise<void> {
  await rm(storePath(userId), { force: true });
}

export async function saveSupportClientToken(input: {
  userId: number;
  phone: string;
  token: string;
}): Promise<void> {
  const store = await cookies();
  const sealed = await seal({
    userId: input.userId,
    phone: input.phone.trim(),
    token: input.token,
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
  });
  store.set(COOKIE, sealed, cookieOptions(MAX_AGE_SECONDS));
  await writeStoredToken(input.userId, sealed);
}

async function acceptToken(
  userId: number,
  sealed: string,
): Promise<{ token: string; phone: string } | null> {
  const stored = await unseal(sealed);
  if (!stored || stored.userId !== userId || Date.now() >= stored.expiresAt) return null;
  return { token: stored.token, phone: stored.phone };
}

export async function readSupportClientToken(
  userId: number,
): Promise<{ token: string; phone: string } | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) {
    const fromCookie = await acceptToken(userId, raw);
    if (fromCookie) {
      if (!(await readStoredToken(userId))) await writeStoredToken(userId, raw);
      return fromCookie;
    }
    store.set(COOKIE, "", cookieOptions(0));
  }

  const sealed = await readStoredToken(userId);
  if (!sealed) return null;
  const restored = await acceptToken(userId, sealed);
  if (!restored) {
    await removeStoredToken(userId);
    return null;
  }
  store.set(COOKIE, sealed, cookieOptions(MAX_AGE_SECONDS));
  return restored;
}

/** Drops the browser cookie. The saved token for this user stays, so the next login can list tickets. */
export async function clearSupportClientCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", cookieOptions(0));
}

export async function clearSupportClientToken(userId?: number): Promise<void> {
  await clearSupportClientCookie();
  if (userId != null) await removeStoredToken(userId);
}
