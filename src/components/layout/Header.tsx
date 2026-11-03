"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ChevronDown, Globe, LogOut, Menu, Settings, UserRound } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import type { AuthUser } from "@/features/auth/types/auth";
import { clearMenuClientCache } from "@/features/navigation/services/menu-client";
import { clearStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { QuickSearch } from "@/features/navigation/components/QuickSearch";
import { SupportDeskLink } from "@/features/support/components/SupportDeskLink";
import {
  SupportDeskNotifier,
  SupportNoticeBell,
} from "@/features/support/components/SupportNoticeBell";
import { clearSupportInbox } from "@/features/support/services/support-inbox";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { endpoints } from "@/lib/api/endpoints";

type HeaderProps = {
  onMenuClick: () => void;
  user: AuthUser;
};

const languages: Array<{ code: AppLocale; label: string; short: string }> = [
  { code: "en", label: "English", short: "EN" },
  { code: "bn", label: "বাংলা", short: "BN" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "or", label: "ଓଡ଼ିଆ", short: "OR" },
];

export function Header({ onMenuClick, user }: HeaderProps) {
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const tConfirm = useTranslations("confirmDialog");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const currentLang =
    languages.find((lang) => lang.code === locale) ?? languages[0]!;

  useEffect(() => {
    if (!accountOpen && !langOpen) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setLangOpen(false);
      setAccountOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen, langOpen]);

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
      clearSupportInbox();
      window.location.assign("/login");
    }
  }

  const initials = (() => {
    const source = user.shortName || user.userName || user.userCode || "?";
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  })();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="app-inset-x flex flex-col pt-[var(--content-gap)]">
        <div className="flex items-center justify-between gap-2 pb-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="shrink-0 rounded-xl border border-border bg-white p-2 text-slate-600 shadow-sm lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <Link
              href="/dashboard"
              aria-label={tAuth("brandName")}
              className="flex min-w-0 shrink items-center lg:hidden"
            >
              <BrandLogo priority className="w-28 sm:w-40" />
            </Link>

            <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
              <QuickSearch user={user} variant="field" showShortcut />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="md:hidden">
              <QuickSearch user={user} variant="icon" showShortcut={false} />
            </div>
            <SupportDeskNotifier />
            <div className="flex items-center gap-1.5">
              <SupportDeskLink />
              <SupportNoticeBell />
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>
            <div className="relative hidden lg:block" ref={langRef}>
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  setLangOpen((open) => !open);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-surface-muted sm:gap-1.5 sm:px-3"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <span className="font-semibold text-slate-800">
                  {currentLang.short}
                </span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-soft" />
              </button>

              {langOpen ? (
                <ul
                  role="listbox"
                  className="absolute top-full right-0 z-40 mt-1.5 min-w-[8.5rem] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-[var(--shadow-card)]"
                >
                  {languages.map((lang) => (
                    <li key={lang.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={locale === lang.code}
                        onClick={() => {
                          setLangOpen(false);
                          if (lang.code !== locale) {
                            router.replace(pathname, { locale: lang.code });
                            router.refresh();
                          }
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-surface-muted ${
                          locale === lang.code
                            ? "font-semibold text-brand-ink"
                            : "text-slate-600"
                        }`}
                      >
                        <span className="font-semibold">{lang.short}</span>
                        {lang.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => {
                  setLangOpen(false);
                  setAccountOpen((open) => !open);
                }}
                className="inline-flex h-9 max-w-[9.5rem] items-center gap-2 rounded-full border border-border bg-white px-2 shadow-sm transition hover:bg-surface-muted sm:max-w-none sm:px-2.5"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={t("accountMenu")}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-ink">
                  {initials}
                </span>
                <span className="hidden truncate text-xs font-semibold text-slate-800 sm:inline">
                  {user.shortName || user.userName}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-muted-soft transition-transform ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {accountOpen ? (
                <div
                  role="menu"
                  aria-label={t("accountMenu")}
                  className="absolute top-full right-0 z-40 mt-1.5 max-h-[min(70vh,28rem)] min-w-[11rem] overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-[var(--shadow-card)] md:min-w-[11rem]"
                >
                  <div className="lg:hidden">
                    <ThemeToggle variant="menu" />
                    <SupportDeskLink variant="menu" />
                    <div className="my-1 border-t border-border" />
                    <p className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
                      <Globe className="h-3.5 w-3.5" aria-hidden />
                      {tAuth("language")}
                    </p>
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        role="menuitemradio"
                        aria-checked={locale === lang.code}
                        onClick={() => {
                          setAccountOpen(false);
                          if (lang.code !== locale) {
                            router.replace(pathname, { locale: lang.code });
                            router.refresh();
                          }
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-surface-muted ${
                          locale === lang.code
                            ? "font-semibold text-brand-ink"
                            : "text-slate-600"
                        }`}
                      >
                        <span className="w-6 shrink-0 font-semibold">
                          {lang.short}
                        </span>
                        {lang.label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-border" />
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-surface-muted"
                  >
                    <UserRound className="h-3.5 w-3.5 text-muted-soft" />
                    {t("profile")}
                  </Link>
                  <Link
                    href="/settings/language"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-surface-muted"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-soft" />
                    {t("settings")}
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("logout")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

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
    </header>
  );
}
