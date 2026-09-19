/**
 * Browser-side menu loader with:
 * - request dedupe (Strict Mode safe)
 * - short in-memory cache
 * - localStorage persistence for instant sidebar paint
 */

import type { MenuTreeNode } from "@/features/navigation/types/menu";
import {
  clearStoredMenu,
  menusEqual,
  readStoredMenu,
  writeStoredMenu,
} from "@/features/navigation/services/menu-storage";

export type MenuClientResult =
  | { ok: true; items: MenuTreeNode[]; fromCache?: boolean }
  | { ok: false; status: number; message: string };

type MenuEnvelope = {
  success?: boolean;
  message?: string;
  data?: MenuTreeNode[] | null;
};

const MEMORY_TTL_MS = 5_000;

let inflight: Promise<MenuClientResult> | null = null;
let memoryCache: { at: number; result: MenuClientResult } | null = null;

export function clearMenuClientCache(): void {
  inflight = null;
  memoryCache = null;
  clearStoredMenu();
}

export function getStoredMenuForUser(
  userId: number,
  orgId: number,
): MenuTreeNode[] | null {
  return readStoredMenu(userId, orgId);
}

async function requestMenu(): Promise<MenuClientResult> {
  try {
    const response = await fetch("/api/menu?status=1", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    const payload = (await response.json()) as MenuEnvelope;

    if (response.status === 401) {
      clearMenuClientCache();
      return {
        ok: false,
        status: 401,
        message: payload.message || "Unauthorized",
      };
    }

    if (!response.ok || payload.success === false) {
      return {
        ok: false,
        status: response.status || 500,
        message: payload.message || "Failed to load menu",
      };
    }

    return {
      ok: true,
      items: Array.isArray(payload.data) ? payload.data : [],
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "network",
    };
  }
}

/**
 * Fetch menu from BFF. Optionally scoped to a user for localStorage write.
 * When `user` is provided and the response differs from storage, storage is updated.
 */
export function fetchMenuClient(options?: {
  userId?: number;
  orgId?: number;
  /** Bypass short memory cache (still dedupes in-flight). */
  force?: boolean;
}): Promise<MenuClientResult> {
  const force = options?.force === true;

  if (!force && memoryCache && Date.now() - memoryCache.at < MEMORY_TTL_MS) {
    return Promise.resolve(memoryCache.result);
  }

  if (!inflight) {
    inflight = requestMenu()
      .then((result) => {
        if (result.ok && options?.userId != null && options.orgId != null) {
          const previous = readStoredMenu(options.userId, options.orgId);
          if (!previous || !menusEqual(previous, result.items)) {
            writeStoredMenu(options.userId, options.orgId, result.items);
          }
        }

        memoryCache = { at: Date.now(), result };
        return result;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export { menusEqual };
