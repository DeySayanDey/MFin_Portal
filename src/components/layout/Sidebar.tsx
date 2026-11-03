"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import type { AuthUser } from "@/features/auth/types/auth";
import type { MenuTreeNode } from "@/features/navigation/types/menu";
import {
  clearMenuClientCache,
  fetchMenuClient,
  getMenuClientSnapshot,
  menusEqual,
  subscribeStoredMenu,
} from "@/features/navigation/services/menu-client";
import { clearStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { mergeStoredMenuIcons } from "@/features/navigation/services/menu-storage";
import { menuIconMarkup } from "@/features/navigation/utils/menu-icon-svg";
import { menuEnglishName } from "@/features/navigation/utils/menu-label";
import { toMenuLang } from "@/features/navigation/utils/menu-lang";
import { sanitizeMenuRoute } from "@/features/navigation/utils/safe-menu-route";
import { resolveMenuChildIcon } from "@/features/navigation/utils/menu-child-icon";
import { primaryNav } from "@/lib/nav";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SidebarNavSkeleton } from "@/components/shared/skeletons/SidebarNavSkeleton";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
};

type MenuLoadState =
  | { status: "loading" }
  | { status: "ready"; items: MenuTreeNode[] }
  | { status: "empty" }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

function menuStateFromItems(items: MenuTreeNode[]): MenuLoadState {
  if (items.length === 0) return { status: "empty" };
  return { status: "ready", items };
}

function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return LayoutDashboard;
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? LayoutDashboard;
}

function userInitials(user: AuthUser): string {
  const source = user.shortName || user.userName || user.userCode || "?";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function isChildActive(route: string | null, pathname: string): boolean {
  if (!route) return false;
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isDashboardName(name: string): boolean {
  const value = name.trim().toLowerCase();
  return (
    value === "dashboard" ||
    value === "executive dashboard" ||
    value === "executive dashbord"
  );
}

function isDashboardMenuItem(item: MenuTreeNode): boolean {
  return (
    isDashboardName(item.name) ||
    isDashboardName(item.nameDefault ?? "") ||
    item.route === "/" ||
    item.route === "/dashboard" ||
    item.route === "/home"
  );
}

function MenuLabel({
  name,
  nameDefault,
  emphasize = false,
}: {
  name: string;
  nameDefault: string | null;
  emphasize?: boolean;
}) {
  const english = menuEnglishName(name, nameDefault);
  const title = english ? `${name} (${english})` : name;
  return (
    <span className="min-w-0 flex-1" title={title}>
      <span className={`block break-words leading-snug ${emphasize ? "font-medium" : ""}`}>
        {name}
      </span>
      {english ? (
        <span className="block break-words text-[11px] font-normal leading-tight text-muted-soft">
          {english}
        </span>
      ) : null}
    </span>
  );
}

function isNodeActive(node: MenuTreeNode, pathname: string): boolean {
  if (node.route && isChildActive(node.route, pathname)) return true;
  return node.children.some((child) => isChildActive(child.route, pathname));
}

const OPEN_MENUS_KEY = "mfin.sidebar.open.v1";

function readOpenMenus(userId: number): string[] {
  try {
    const raw = sessionStorage.getItem(`${OPEN_MENUS_KEY}.${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(0, 40);
  } catch {
    return [];
  }
}

function writeOpenMenus(userId: number, keys: string[]) {
  try {
    sessionStorage.setItem(
      `${OPEN_MENUS_KEY}.${userId}`,
      JSON.stringify(keys),
    );
  } catch {
    // Private mode or a full quota should not block navigation.
  }
}

/** Scroll only the sidebar list, and place the current item in the middle of it. */
function revealMenuItem(scroller: HTMLElement, target: HTMLElement) {
  const scrollerBox = scroller.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  const delta = targetBox.top - scrollerBox.top;
  const next =
    scroller.scrollTop + delta - scroller.clientHeight / 2 + target.offsetHeight / 2;
  const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  scroller.scrollTo({ top: Math.min(max, Math.max(0, next)) });
}

export function Sidebar({ open, onClose, user }: SidebarProps) {
  const t = useTranslations("navigation");
  const tConfirm = useTranslations("confirmDialog");
  const locale = useLocale();
  const menuLang = toMenuLang(locale);
  const pathname = usePathname();
  // SSR and the first client render stay on the skeleton so hydration matches.
  // After hydration, the localStorage menu is shown before the browser paints.
  const [menuState, setMenuState] = useState<MenuLoadState>({ status: "loading" });
  const storedItems = useSyncExternalStore(
    subscribeStoredMenu,
    () => getMenuClientSnapshot(user.userId, user.orgId, menuLang),
    () => null,
  );
  const shownMenu = useMemo<MenuLoadState>(() => {
    if (menuState.status === "loading" && storedItems) {
      return menuStateFromItems(storedItems);
    }
    return menuState;
  }, [menuState, storedItems]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [menusHydrated, setMenusHydrated] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (shownMenu.status !== "ready") return;
    mergeStoredMenuIcons(user.userId, user.orgId, menuLang, menuIconMarkup);
    document.documentElement.classList.add("mfin-menu-live");
  }, [shownMenu.status, user.userId, user.orgId, menuLang]);

  // Browser → BFF GET /api/menu?status=1&role_id=…&lang=HI → Laravel MenuTree.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await fetchMenuClient({
        userId: user.userId,
        orgId: user.orgId,
        roleId: user.roleId,
        lang: menuLang,
      });
      if (cancelled) return;

      if (result.ok) {
        setMenuState((current) => {
          const onScreen =
            current.status === "ready"
              ? current.items
              : getMenuClientSnapshot(user.userId, user.orgId, menuLang);
          if (onScreen && menusEqual(onScreen, result.items)) {
            return current.status === "ready"
              ? current
              : { status: "ready", items: onScreen };
          }
          return menuStateFromItems(result.items);
        });
        return;
      }

      if (result.status === 401) {
        setMenuState({ status: "unauthorized" });
        return;
      }

      setMenuState((current) => {
        const onScreen =
          current.status === "ready"
            ? current.items
            : getMenuClientSnapshot(user.userId, user.orgId, menuLang);
        if (onScreen) {
          return current.status === "ready"
            ? current
            : { status: "ready", items: onScreen };
        }
        return { status: "error", message: result.message };
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [menuLang, user.orgId, user.roleId, user.userId]);

  const activeNodeKey = useMemo(() => {
    if (shownMenu.status !== "ready") return null;
    const active = shownMenu.items.find((item) => isNodeActive(item, pathname));
    return active ? String(active.id) : null;
  }, [shownMenu, pathname]);

  useEffect(() => {
    setOpenKeys(readOpenMenus(user.userId));
    setMenusHydrated(true);
  }, [user.userId]);

  useEffect(() => {
    setDismissedKey(null);
  }, [pathname]);

  useEffect(() => {
    if (!menusHydrated) return;
    setOpenKeys(activeNodeKey ? [activeNodeKey] : []);
  }, [activeNodeKey, menusHydrated, pathname]);

  useEffect(() => {
    if (!menusHydrated) return;
    writeOpenMenus(user.userId, openKeys);
  }, [menusHydrated, openKeys, user.userId]);

  useEffect(() => {
    if (shownMenu.status !== "ready") return;
    const scroller = navScrollRef.current;
    if (!scroller) return;

    const reveal = () => {
      const current = scroller.querySelector<HTMLElement>(
        "[data-menu-current='true']",
      );
      const group = activeNodeKey
        ? scroller.querySelector<HTMLElement>(
            `[data-menu-group="${activeNodeKey}"]`,
          )
        : null;
      const target =
        current && current.getBoundingClientRect().height > 8 ? current : group;
      if (!target) return;
      revealMenuItem(scroller, target);
    };

    const frame = window.requestAnimationFrame(reveal);
    const timer = window.setTimeout(reveal, 240);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeNodeKey, shownMenu, pathname]);

  function isExpanded(key: string): boolean {
    if (openKeys.includes(key)) return true;
    return activeNodeKey === key && dismissedKey !== key;
  }

  function toggleNode(key: string) {
    const open = isExpanded(key);
    if (key === activeNodeKey) setDismissedKey(open ? key : null);
    setOpenKeys((prev) => {
      const without = prev.filter((item) => item !== key);
      return open ? without : [...without, key];
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch(endpoints.auth.logout, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } finally {
      clearMenuClientCache();
      clearStoredAuthUser();
      window.location.assign("/login");
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[var(--sidebar-width)] max-w-[100vw] shrink-0 flex-col overflow-hidden border-r border-border bg-surface pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center rounded-lg dark:bg-white dark:px-2 dark:py-1"
            onClick={onClose}
          >
            <BrandLogo priority className="w-[13.5rem]" />
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden"
            onClick={onClose}
            aria-label={t("closeSidebar")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={navScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-thin"
        >
          <Link
            href={primaryNav.href}
            onClick={onClose}
            data-menu-current={pathname === primaryNav.href ? "true" : undefined}
            aria-current={pathname === primaryNav.href ? "page" : undefined}
            className={`mb-5 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
              pathname === primaryNav.href
                ? "bg-brand-soft text-brand-ink shadow-sm"
                : "text-slate-700 hover:bg-surface-muted"
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
              <primaryNav.icon className="h-4 w-4" />
            </span>
            {t("dashboard")}
          </Link>

          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-soft">
            {t("mainModules")}
          </p>

          {/* Light DOM stays empty. The boot script paints the saved menu in a shadow root. */}
          <div id="mfin-menu-boot" />

          {shownMenu.status === "loading" ? (
            <div className="sidebar-nav-pending">
              <span className="sr-only">{t("menuLoading")}</span>
              <SidebarNavSkeleton />
            </div>
          ) : null}

          {shownMenu.status === "empty" ? (
            <p className="px-3 py-4 text-sm text-muted">{t("menuEmpty")}</p>
          ) : null}

          {shownMenu.status === "unauthorized" ? (
            <p className="px-3 py-4 text-sm text-rose-600">{t("menuUnauthorized")}</p>
          ) : null}

          {shownMenu.status === "error" ? (
            <div className="space-y-2 px-3 py-4">
              <p className="text-sm text-rose-600">{t("menuError")}</p>
              <p className="text-xs text-muted">{shownMenu.message}</p>
            </div>
          ) : null}

          {shownMenu.status === "ready" ? (
            <nav className="space-y-1.5">
              {shownMenu.items.filter((item) => !isDashboardMenuItem(item)).map((item) => {
                const key = String(item.id);
                const active = isNodeActive(item, pathname);
                const isOpen = isExpanded(key);
                const Icon = resolveIcon(item.icon);
                const childCount = item.children.length;
                const isLeaf = childCount === 0;
                const leafHref = isLeaf ? sanitizeMenuRoute(item.route) : null;

                return (
                  <div
                    key={key}
                    data-menu-group={key}
                    className={`overflow-hidden rounded-[var(--radius-card)] border transition ${
                      active
                        ? "border-brand bg-brand-soft shadow-sm"
                        : "border-border bg-surface shadow-[var(--shadow-card)]"
                    }`}
                  >
                    <div className="flex items-stretch">
                      {leafHref ? (
                        <Link
                          href={leafHref}
                          onClick={onClose}
                          data-menu-current={active ? "true" : undefined}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                            active
                              ? "text-brand-ink"
                              : "text-slate-700 hover:bg-surface-muted/80"
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                            <Icon className="h-4 w-4" />
                          </span>
                          <MenuLabel
                            name={item.name}
                            nameDefault={item.nameDefault}
                            emphasize
                          />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleNode(key)}
                          className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                            active
                              ? "text-brand-ink"
                              : "text-slate-700 hover:bg-surface-muted/80"
                          }`}
                          aria-expanded={isOpen}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                            <Icon className="h-4 w-4" />
                          </span>
                          <MenuLabel
                            name={item.name}
                            nameDefault={item.nameDefault}
                            emphasize
                          />
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            {childCount}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-soft transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {childCount > 0 ? (
                      <div
                        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <ul className="space-y-0.5 border-t border-border/70 px-2 py-2">
                            {item.children.map((child) => {
                              const childActive = isChildActive(
                                child.route,
                                pathname,
                              );
                              const ChildIcon = resolveMenuChildIcon(child, item.icon);
                              const childHref = sanitizeMenuRoute(child.route);
                              const itemClass = `flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition ${
                                childActive
                                  ? "bg-surface font-semibold text-brand-ink shadow-sm"
                                  : "text-slate-600 hover:bg-surface-muted hover:text-slate-900"
                              }`;

                              return (
                                <li key={`${child.id}-${child.submenuId}`}>
                                  {childHref ? (
                                    <Link
                                      href={childHref}
                                      onClick={onClose}
                                      data-menu-current={
                                        childActive ? "true" : undefined
                                      }
                                      aria-current={childActive ? "page" : undefined}
                                      className={itemClass}
                                    >
                                      <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                          childActive
                                            ? "bg-brand-soft text-brand-ink"
                                            : "bg-blue-50 text-blue-600"
                                        }`}
                                      >
                                        <ChildIcon className="h-3.5 w-3.5" />
                                      </span>
                                      <MenuLabel
                                        name={child.name}
                                        nameDefault={child.nameDefault}
                                      />
                                    </Link>
                                  ) : (
                                    <span
                                      className={`${itemClass} cursor-default opacity-60`}
                                      title={t("routeUnavailable")}
                                    >
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                        <ChildIcon className="h-3.5 w-3.5" />
                                      </span>
                                      <MenuLabel
                                        name={child.name}
                                        nameDefault={child.nameDefault}
                                      />
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {userInitials(user)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.shortName || user.userName}
                </p>
                <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-ink">
                  {user.loginStatus}
                </span>
              </div>
              <p className="truncate text-[11px] uppercase tracking-wide text-muted-soft">
                {t("branchLabel", { branch: user.branchName })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              disabled={loggingOut}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
              aria-label={t("logout")}
              title={t("logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => {
          if (!loggingOut) setLogoutConfirmOpen(false);
        }}
        onConfirm={handleLogout}
        actionType="custom"
        variant="warning"
        icon={LogOut}
        title={tConfirm("logout.title")}
        description={tConfirm("logout.description")}
        confirmLabel={tConfirm("logout.button")}
        loading={loggingOut}
        disableBackdropClick={loggingOut}
      />
    </>
  );
}
