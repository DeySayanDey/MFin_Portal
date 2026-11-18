import type { NextRequest } from "next/server";
import { getAuthSessionSecret } from "@/lib/config/env";
import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";
import {
  isSessionExpired,
  unsealSessionPayload,
  type SealedSessionPayload,
} from "@/lib/auth/session-seal";

/**
 * Edge-safe session read for middleware.
 * Returns null when missing, tampered, undecryptable, or expired.
 */
export async function readSessionFromRequest(
  request: NextRequest,
): Promise<SealedSessionPayload | null> {
  const raw = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (!raw) return null;

  let secret: string;
  try {
    secret = getAuthSessionSecret();
  } catch {
    return null;
  }

  const payload = await unsealSessionPayload(raw, secret);
  if (!payload) return null;
  if (isSessionExpired(payload)) return null;
  return payload;
}
