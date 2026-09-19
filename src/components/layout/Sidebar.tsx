"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { AuthUser } from "@/features/auth/types/auth";
import type { MenuTreeNode } from "@/features/navigation/types/menu";
import {
  clearMenuClientCache,
  fetchMenuClient,
  getStoredMenuForUser,
  menusEqual,
} from "@/features/navigation/services/menu-client";
import { toSafeMenuHref } from "@/features/navigation/utils/safe-menu-route";
import { primaryNav } from "@/lib/nav";
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

function resolveIcon(name: string | undefined): LucideIcon {
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

function isNodeActive(node: MenuTreeNode, pathname: string): boolean {
  if (node.route && isChildActive(node.route, pathname)) return true;
  return node.children.some((child) => isChildActive(child.route, pathname));
}

export function Sidebar({ open, onClose, user }: SidebarProps) {
  const t = useTranslations("navigation");
  const tErrors = useTranslations("errors");
  const pathname = usePathname();
  const router = useRouter();
  const [menuState, setMenuState] = useState<MenuLoadState>({ status: "loading" });
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});
  const [loggingOut, setLoggingOut] = useState(false);

  // Paint from localStorage before browser paint (no hydration mismatch).
  useLayoutEffect(() => {
    const cached = getStoredMenuForUser(user.userId, user.orgId);
    if (cached == null) return;
    setMenuState(
      cached.length === 0
        ? { status: "empty" }
        : { status: "ready", items: cached },
    );
  }, [user.orgId, user.userId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshMenu() {
      const result = await fetchMenuClient({
        userId: user.userId,
        orgId: user.orgId,
        force: true,
      });
      if (cancelled) return;

      if (!result.ok) {
        if (result.status === 401) {
          setMenuState({ status: "unauthorized" });
          router.replace("/login");
          router.refresh();
          return;
        }
        // Keep showing cached menu on network/server errors.
        setMenuState((prev) => {
          if (prev.status === "ready" || prev.status === "empty") return prev;
          return {
            status: "error",
            message:
              result.message === "network"
                ? tErrors("network")
                : result.message || tErrors("generic"),
          };
        });
        return;
      }

      setMenuState((prev) => {
        if (result.items.length === 0) {
          if (prev.status === "empty") return prev;
          return { status: "empty" };
        }
        if (prev.status === "ready" && menusEqual(prev.items, result.items)) {
          return prev;
        }
        return { status: "ready", items: result.items };
      });
    }

    void refreshMenu();
    return () => {
      cancelled = true;
    };
  }, [router, tErrors, user.orgId, user.userId]);

  const activeNodeKey = useMemo(() => {
    if (menuState.status !== "ready") return null;
    const active = menuState.items.find((item) => isNodeActive(item, pathname));
    return active ? String(active.id) : null;
  }, [menuState, pathname]);

  function isExpanded(key: string): boolean {
    if (key in collapsedKeys) {
      return !collapsedKeys[key];
    }
    return activeNodeKey === key;
  }

  function toggleNode(key: string) {
    setCollapsedKeys((prev) => {
      const currentlyOpen = key in prev ? !prev[key] : activeNodeKey === key;
      return { ...prev, [key]: currentlyOpen };
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } finally {
      clearMenuClientCache();
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
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
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[var(--sidebar-width)] max-w-[100vw] flex-col overflow-hidden border-r border-border bg-surface pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-300 lg:static lg:h-full lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-sm">
              eZ
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold tracking-tight text-slate-900">
                eZi-Micro
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-soft">
                EZI-MICRO CORE BANKING
              </span>
            </span>
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-thin">
          <Link
            href={primaryNav.href}
            onClick={onClose}
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

          {menuState.status === "loading" ? (
            <>
              <span className="sr-only">{t("menuLoading")}</span>
              <SidebarNavSkeleton />
            </>
          ) : null}

          {menuState.status === "empty" ? (
            <p className="px-3 py-4 text-sm text-muted">{t("menuEmpty")}</p>
          ) : null}

          {menuState.status === "unauthorized" ? (
            <p className="px-3 py-4 text-sm text-rose-600">{t("menuUnauthorized")}</p>
          ) : null}

          {menuState.status === "error" ? (
            <div className="space-y-2 px-3 py-4">
              <p className="text-sm text-rose-600">{t("menuError")}</p>
              <p className="text-xs text-muted">{menuState.message}</p>
            </div>
          ) : null}

          {menuState.status === "ready" ? (
            <nav className="space-y-1.5">
              {menuState.items.map((item) => {
                const key = String(item.id);
                const active = isNodeActive(item, pathname);
                const isOpen = isExpanded(key);
                const Icon = resolveIcon(item.icon);
                const childCount = item.children.length;

                return (
                  <div
                    key={key}
                    className={`overflow-hidden rounded-2xl border transition ${
                      active
                        ? "border-brand/20 bg-brand-soft/40 shadow-sm"
                        : "border-transparent bg-white shadow-[var(--shadow-card)]"
                    }`}
                  >
                    <div className="flex items-stretch">
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
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {item.name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          {childCount}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-soft transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
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
                              const ChildIcon = resolveIcon(child.icon);
                              const href = toSafeMenuHref(child.route);

                              return (
                                <li key={`${child.id}-${child.submenuId}`}>
                                  <Link
                                    href={href}
                                    onClick={onClose}
                                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition ${
                                      childActive
                                        ? "bg-white font-semibold text-brand-ink shadow-sm"
                                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                                    }`}
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
                                    <span className="min-w-0 flex-1 truncate">
                                      {child.name}
                                    </span>
                                  </Link>
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
              onClick={() => void handleLogout()}
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
    </>
  );
}
