/**
 * Persist MenuTree in localStorage for instant sidebar paint.
 * Not secrets — cleared on logout / unauthorized.
 */

import type { MenuTreeNode } from "@/features/navigation/types/menu";
import { sanitizeMenuRoute } from "@/features/navigation/utils/safe-menu-route";

const STORAGE_KEY = "mfin.menu.v1";

type StoredMenuPayload = {
  version: 1;
  userId: number;
  orgId: number;
  updatedAt: number;
  items: MenuTreeNode[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeMenuTree(items: MenuTreeNode[]): MenuTreeNode[] {
  return items.map((node) => ({
    ...node,
    route: sanitizeMenuRoute(node.route),
    children: node.children.map((child) => ({
      ...child,
      route: sanitizeMenuRoute(child.route),
    })),
  }));
}

function isMenuNode(value: unknown): value is MenuTreeNode {
  if (typeof value !== "object" || value === null) return false;
  const node = value as Partial<MenuTreeNode>;
  return (
    typeof node.id === "number" &&
    typeof node.menuId === "number" &&
    typeof node.name === "string" &&
    Array.isArray(node.children)
  );
}

function parseStored(raw: string | null): StoredMenuPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredMenuPayload>;
    if (
      parsed.version !== 1 ||
      typeof parsed.userId !== "number" ||
      typeof parsed.orgId !== "number" ||
      !Array.isArray(parsed.items) ||
      !parsed.items.every(isMenuNode)
    ) {
      return null;
    }
    return {
      version: 1,
      userId: parsed.userId,
      orgId: parsed.orgId,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      items: sanitizeMenuTree(parsed.items),
    };
  } catch {
    return null;
  }
}

/** Stable fingerprint for change detection (order-sensitive, matches API order). */
export function menuFingerprint(items: MenuTreeNode[]): string {
  return JSON.stringify(items);
}

export function menusEqual(a: MenuTreeNode[], b: MenuTreeNode[]): boolean {
  return menuFingerprint(a) === menuFingerprint(b);
}

export function readStoredMenu(
  userId: number,
  orgId: number,
): MenuTreeNode[] | null {
  if (!canUseStorage()) return null;
  const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
  if (!stored) return null;
  if (stored.userId !== userId || stored.orgId !== orgId) return null;
  return stored.items;
}

export function writeStoredMenu(
  userId: number,
  orgId: number,
  items: MenuTreeNode[],
): void {
  if (!canUseStorage()) return;
  const payload: StoredMenuPayload = {
    version: 1,
    userId,
    orgId,
    updatedAt: Date.now(),
    items: sanitizeMenuTree(items),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore; memory cache still works.
  }
}

export function clearStoredMenu(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
