"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
import {
  currentUser,
  mainModules,
  primaryNav,
  toneClasses,
  type NavItem,
} from "@/lib/nav";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

function isModuleActive(item: NavItem, pathname: string) {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  return item.children?.some((child) => child.href === pathname) ?? false;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(() => {
    const active = mainModules.find((item) => isModuleActive(item, pathname));
    return active ? [active.href] : [];
  });

  useEffect(() => {
    const active = mainModules.find((item) => isModuleActive(item, pathname));
    if (!active) return;
    setExpanded((prev) =>
      prev.includes(active.href) ? prev : [...prev, active.href],
    );
  }, [pathname]);

  function toggleModule(href: string) {
    setExpanded((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href],
    );
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
            aria-label="Close sidebar"
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
            {primaryNav.label}
          </Link>

          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-soft">
            Main Modules
          </p>

          <nav className="space-y-1.5">
            {mainModules.map((item) => {
              const active = isModuleActive(item, pathname);
              const isOpen = expanded.includes(item.href);
              const tones = toneClasses[item.tone];
              const childCount = item.children?.length ?? 0;

              return (
                <div
                  key={item.href}
                  className={`overflow-hidden rounded-2xl border transition ${
                    active
                      ? "border-brand/20 bg-brand-soft/40 shadow-sm"
                      : "border-transparent bg-white shadow-[var(--shadow-card)]"
                  }`}
                >
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => toggleModule(item.href)}
                      className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "text-brand-ink"
                          : "text-slate-700 hover:bg-surface-muted/80"
                      }`}
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tones.icon}`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {item.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {item.badge ?? childCount}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-soft transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {item.children && item.children.length > 0 ? (
                    <div
                      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ul className="space-y-0.5 border-t border-border/70 px-2 py-2">
                          {item.children.map((child) => {
                            const childActive =
                              pathname === child.href ||
                              pathname.startsWith(`${child.href}/`);

                            const ChildIcon = child.icon;
                            return (
                              <li key={`${child.href}-${child.label}`}>
                                <Link
                                  href={child.href}
                                  onClick={onClose}
                                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition ${
                                    childActive
                                      ? "bg-white font-semibold text-brand-ink shadow-sm"
                                      : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                                  }`}
                                >
                                  {ChildIcon ? (
                                    <span
                                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                        childActive
                                          ? "bg-brand-soft text-brand-ink"
                                          : "bg-blue-50 text-blue-600"
                                      }`}
                                    >
                                      <ChildIcon className="h-3.5 w-3.5" />
                                    </span>
                                  ) : (
                                    <span
                                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                        childActive ? "bg-brand" : "bg-slate-300"
                                      }`}
                                    />
                                  )}
                                  <span className="min-w-0 flex-1 truncate">
                                    {child.label}
                                  </span>
                                  {child.badge ? (
                                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                      {child.badge}
                                    </span>
                                  ) : null}
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
        </div>

        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {currentUser.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {currentUser.name}
                </p>
                <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-ink">
                  {currentUser.status}
                </span>
              </div>
              <p className="truncate text-[11px] uppercase tracking-wide text-muted-soft">
                Branch · {currentUser.branch}
              </p>
            </div>
            <Link
              href="/login"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
