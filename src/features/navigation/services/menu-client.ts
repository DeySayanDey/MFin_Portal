/**
 * Browser-side menu helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 * Same pattern as LoginForm → endpoints.auth.login.
 */

import { endpoints } from "@/lib/api/endpoints";
import type { MenuTreeNode } from "@/features/navigation/types/menu";
import {
  clearStoredMenu,
  menusEqual,
  readStoredMenu,
  writeStoredMenu,
} from "@/features/navigation/services/menu-storage";
import { normalizeMenuLang, toMenuLang } from "@/features/navigation/utils/menu-lang";

export type MenuClientResult =
  | { ok: true; items: MenuTreeNode[]; fromCache?: boolean }
  | { ok: false; status: number; message: string };

type MenuEnvelope = {
  success?: boolean;
  message?: string;
  data?: MenuTreeNode[] | null;
};

const inflightByKey = new Map<string, Promise<MenuClientResult>>();

let menuSnapshot: { key: string; items: MenuTreeNode[] | null } = {
  key: "",
  items: null,
};

/** Stable localStorage read for useSyncExternalStore. Same key returns the same array. */
export function getMenuClientSnapshot(
  userId: number,
  orgId: number,
  lang?: string | null,
): MenuTreeNode[] | null {
  const key = `${userId}:${orgId}:${normalizeMenuLang(lang)}`;
  if (menuSnapshot.key === key) return menuSnapshot.items;
  menuSnapshot = { key, items: readStoredMenu(userId, orgId, lang) };
  return menuSnapshot.items;
}

export function subscribeStoredMenu(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("mfin-menu-cache", onStoreChange);
  return () => window.removeEventListener("mfin-menu-cache", onStoreChange);
}

function notifyStoredMenu(): void {
  menuSnapshot = { key: "", items: null };
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("mfin-menu-cache"));
}

export function clearMenuClientCache(): void {
  clearStoredMenu();
  notifyStoredMenu();
  inflightByKey.clear();
}

export function getStoredMenuForUser(
  userId: number,
  orgId: number,
  lang?: string | null,
): MenuTreeNode[] | null {
  return readStoredMenu(userId, orgId, lang);
}

function menuRequestKey(options?: {
  userId?: number;
  orgId?: number;
  roleId?: number | null;
  lang?: string | null;
}): string {
  return [
    "status=1",
    `lang=${normalizeMenuLang(options?.lang)}`,
    `role=${typeof options?.roleId === "number" ? options.roleId : ""}`,
    `user=${options?.userId ?? ""}`,
    `org=${options?.orgId ?? ""}`,
  ].join("|");
}

async function fetchMenuOnce(options?: {
  userId?: number;
  orgId?: number;
  roleId?: number | null;
  lang?: string | null;
}): Promise<MenuClientResult> {
  try {
    const lang = normalizeMenuLang(options?.lang ?? toMenuLang(undefined));
    const params = new URLSearchParams({ status: "1", lang });
    if (typeof options?.roleId === "number") {
      params.set("role_id", String(options.roleId));
    }

    const response = await fetch(`${endpoints.bff.menu}?${params}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });

    const payload = (await response.json()) as MenuEnvelope;

    if (response.status === 401) {
      clearStoredMenu();
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

    const items = Array.isArray(payload.data) ? payload.data : [];

    if (options?.userId != null && options.orgId != null) {
      const saved = writeStoredMenu(
        options.userId,
        options.orgId,
        items,
        lang,
      );
      if (saved.changed) notifyStoredMenu();
      return { ok: true, items: saved.items };
    }

    return { ok: true, items };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "network",
    };
  }
}

/**
 * Refresh menu from BFF (`GET /api/menu` → Laravel `GET /api/MenuTree`).
 * Pass `lang` (EN|BN|HI|OR) from the active next-intl locale.
 */
export async function fetchMenuClient(options?: {
  userId?: number;
  orgId?: number;
  roleId?: number | null;
  lang?: string | null;
}): Promise<MenuClientResult> {
  const key = menuRequestKey(options);
  const existing = inflightByKey.get(key);
  if (existing) return existing;

  const request = fetchMenuOnce(options).finally(() => {
    inflightByKey.delete(key);
  });
  inflightByKey.set(key, request);
  return request;
}

export { menusEqual };
