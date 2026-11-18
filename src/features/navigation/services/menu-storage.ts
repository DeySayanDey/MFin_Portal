/**
 * Persist MenuTree in localStorage for instant sidebar paint.
 * Not secrets — cleared on logout / unauthorized.
 * Cached per user + org + lang so language switches refetch labels.
 */

import type { MenuTreeNode } from "@/features/navigation/types/menu";
import { resolveMenuRoute } from "@/features/navigation/utils/menu-route-fallbacks";
import { normalizeMenuLang } from "@/features/navigation/utils/menu-lang";

const STORAGE_KEY = "mfin.menu.v3";

type StoredMenuPayload = {
  version: 3;
  userId: number;
  orgId: number;
  lang: string;
  updatedAt: number;
  items: MenuTreeNode[];
  /** Icon name → SVG markup so a refresh can paint icons before React loads. */
  icons?: Record<string, string>;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeMenuTree(items: MenuTreeNode[]): MenuTreeNode[] {
  return items.map((node) => ({
    ...node,
    route: resolveMenuRoute({
      route: node.route,
      menuId: node.menuId,
      name: node.name,
    }),
    children: node.children.map((child) => ({
      ...child,
      route: resolveMenuRoute({
        route: child.route,
        menuId: child.menuId,
        submenuId: child.submenuId,
        name: child.name,
      }),
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

function parseIcons(value: unknown): Record<string, string> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const icons: Record<string, string> = {};
  for (const [key, svg] of Object.entries(value)) {
    if (typeof svg !== "string" || svg.length > 8000 || !svg.startsWith("<svg")) continue;
    icons[key] = svg;
  }
  return Object.keys(icons).length > 0 ? icons : undefined;
}

function iconNames(items: MenuTreeNode[]): string[] {
  const names = new Set<string>([""]);
  for (const item of items) {
    names.add(item.icon ?? "");
    for (const child of item.children) names.add(child.icon ?? "");
  }
  return [...names];
}

function parseStored(raw: string | null): StoredMenuPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredMenuPayload>;
    if (
      parsed.version !== 3 ||
      typeof parsed.userId !== "number" ||
      typeof parsed.orgId !== "number" ||
      typeof parsed.lang !== "string" ||
      !Array.isArray(parsed.items) ||
      !parsed.items.every(isMenuNode)
    ) {
      return null;
    }
    return {
      version: 3,
      userId: parsed.userId,
      orgId: parsed.orgId,
      lang: normalizeMenuLang(parsed.lang),
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
      items: sanitizeMenuTree(parsed.items),
      icons: parseIcons(parsed.icons),
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
  lang?: string | null,
): MenuTreeNode[] | null {
  if (!canUseStorage()) return null;
  const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
  if (!stored) return null;
  const expectedLang = normalizeMenuLang(lang);
  if (
    stored.userId !== userId ||
    stored.orgId !== orgId ||
    stored.lang !== expectedLang
  ) {
    return null;
  }
  return stored.items;
}

/**
 * Saves the menu when the list changed.
 * Returns the stored list and whether the screen should update.
 */
export function writeStoredMenu(
  userId: number,
  orgId: number,
  items: MenuTreeNode[],
  lang?: string | null,
): { items: MenuTreeNode[]; changed: boolean } {
  const next = sanitizeMenuTree(items);
  if (!canUseStorage()) return { items: next, changed: true };

  const previous = readStoredMenu(userId, orgId, lang);
  if (previous && menusEqual(previous, next)) {
    return { items: previous, changed: false };
  }

  const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
  const sameOwner =
    stored !== null &&
    stored.userId === userId &&
    stored.orgId === orgId &&
    stored.lang === normalizeMenuLang(lang);

  const payload: StoredMenuPayload = {
    version: 3,
    userId,
    orgId,
    lang: normalizeMenuLang(lang),
    updatedAt: Date.now(),
    items: next,
    icons: sameOwner ? stored.icons : undefined,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore; memory cache still works.
  }
  return { items: next, changed: true };
}

/** Adds SVG markup for any menu icon that is not already stored. */
export function mergeStoredMenuIcons(
  userId: number,
  orgId: number,
  lang: string | null | undefined,
  markup: (name: string) => string,
): void {
  if (!canUseStorage()) return;
  const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
  if (
    !stored ||
    stored.userId !== userId ||
    stored.orgId !== orgId ||
    stored.lang !== normalizeMenuLang(lang)
  ) {
    return;
  }

  const icons = { ...(stored.icons ?? {}) };
  let changed = false;
  for (const name of iconNames(stored.items)) {
    if (icons[name]) continue;
    const svg = markup(name);
    if (!svg.startsWith("<svg")) continue;
    icons[name] = svg;
    changed = true;
  }
  if (!changed) return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...stored, icons }),
    );
  } catch {
    // Quota / private mode — the built-in preview icons still paint.
  }
}

export function clearStoredMenu(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    // Drop legacy v1 key if present.
    window.localStorage.removeItem("mfin.menu.v1");
  } catch {
    // ignore
  }
}
