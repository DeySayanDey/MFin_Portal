import type { MenuTreeNode } from "@/features/navigation/types/menu";
import { menuSearchLabel } from "@/features/navigation/utils/menu-label";
import type { NavItem } from "@/lib/nav";
import { mainModules, primaryNav } from "@/lib/nav";

export type QuickSearchItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords: string;
};

function normalizeHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function pushItem(
  map: Map<string, QuickSearchItem>,
  item: Omit<QuickSearchItem, "id" | "keywords"> & { keywords?: string },
) {
  const href = normalizeHref(item.href);
  if (!href) return;
  const existing = map.get(href);
  const keywords = [item.label, item.group, href, item.keywords ?? ""]
    .join(" ")
    .toLowerCase();
  if (!existing) {
    map.set(href, {
      id: href,
      label: item.label,
      href,
      group: item.group,
      keywords,
    });
    return;
  }
  // Prefer a more specific label/group when merging catalogs.
  map.set(href, {
    ...existing,
    label: existing.label.length >= item.label.length ? existing.label : item.label,
    group: existing.group || item.group,
    keywords: `${existing.keywords} ${keywords}`.trim(),
  });
}

export function flattenMenuTree(nodes: MenuTreeNode[]): QuickSearchItem[] {
  const map = new Map<string, QuickSearchItem>();

  for (const node of nodes) {
    if (node.route) {
      pushItem(map, {
        label: menuSearchLabel(node.name, node.nameDefault),
        href: node.route,
        group: menuSearchLabel(node.name, node.nameDefault),
      });
    }
    for (const child of node.children) {
      if (!child.route) continue;
      pushItem(map, {
        label: menuSearchLabel(child.name, child.nameDefault),
        href: child.route,
        group: menuSearchLabel(node.name, node.nameDefault),
      });
    }
  }

  return Array.from(map.values());
}

export function flattenStaticNav(modules: NavItem[] = mainModules): QuickSearchItem[] {
  const map = new Map<string, QuickSearchItem>();

  pushItem(map, {
    label: primaryNav.label,
    href: primaryNav.href,
    group: primaryNav.label,
  });

  for (const module of modules) {
    if (module.href) {
      pushItem(map, {
        label: module.label,
        href: module.href,
        group: module.label,
      });
    }
    for (const child of module.children ?? []) {
      pushItem(map, {
        label: child.label,
        href: child.href,
        group: module.label,
      });
    }
  }

  return Array.from(map.values());
}

/** Merge role menu (preferred) with static nav fallback; dedupe by href. */
export function buildQuickSearchCatalog(
  menu: MenuTreeNode[] | null | undefined,
): QuickSearchItem[] {
  const map = new Map<string, QuickSearchItem>();

  for (const item of flattenStaticNav()) {
    map.set(item.href, item);
  }

  if (menu && menu.length > 0) {
    for (const item of flattenMenuTree(menu)) {
      // Keep the designed Executive Dashboard label for home.
      if (
        (item.href === "/" || item.href === "/dashboard") &&
        (map.has("/") || map.has("/dashboard"))
      ) {
        continue;
      }
      // Role menu wins on label/group for the same href.
      map.set(item.href, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const groupCmp = a.group.localeCompare(b.group);
    if (groupCmp !== 0) return groupCmp;
    return a.label.localeCompare(b.label);
  });
}

export function filterQuickSearchItems(
  items: QuickSearchItem[],
  query: string,
  limit = 40,
): QuickSearchItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items.slice(0, limit);

  const scored: Array<{ item: QuickSearchItem; score: number }> = [];
  for (const item of items) {
    const label = item.label.toLowerCase();
    const href = item.href.toLowerCase();
    const group = item.group.toLowerCase();
    if (
      !label.includes(needle) &&
      !href.includes(needle) &&
      !group.includes(needle) &&
      !item.keywords.includes(needle)
    ) {
      continue;
    }
    let score = 0;
    if (label.startsWith(needle)) score += 100;
    else if (label.includes(needle)) score += 60;
    if (href.includes(needle)) score += 30;
    if (group.includes(needle)) score += 10;
    scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((entry) => entry.item);
}
