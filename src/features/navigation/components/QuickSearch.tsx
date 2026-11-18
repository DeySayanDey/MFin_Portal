"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { CornerDownLeft, Search, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AuthUser } from "@/features/auth/types/auth";
import {
  fetchMenuClient,
  getStoredMenuForUser,
} from "@/features/navigation/services/menu-client";
import { toMenuLang } from "@/features/navigation/utils/menu-lang";
import {
  buildQuickSearchCatalog,
  filterQuickSearchItems,
  type QuickSearchItem,
} from "@/features/navigation/utils/build-quick-search-items";

type QuickSearchProps = {
  user: AuthUser;
  className?: string;
  showShortcut?: boolean;
  /** `icon` shows a search button and opens the field in a panel. */
  variant?: "field" | "icon";
};

export function QuickSearch({
  user,
  className = "",
  showShortcut = true,
  variant = "field",
}: QuickSearchProps) {
  const t = useTranslations("navigation.quickSearch");
  const locale = useLocale();
  const menuLang = toMenuLang(locale);
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelFrame, setPanelFrame] = useState<{
    top: number;
    left: number;
    width: number;
    padLeft: number;
    padRight: number;
  } | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [catalog, setCatalog] = useState<QuickSearchItem[]>(() =>
    buildQuickSearchCatalog(null),
  );
  const [shortcutLabel, setShortcutLabel] = useState(t("shortcutWin"));

  const results = useMemo(() => {
    if (variant === "icon" && !query.trim()) return [];
    return filterQuickSearchItems(catalog, query);
  }, [catalog, query, variant]);

  const showPanel = open;

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(
      navigator.platform || navigator.userAgent,
    );
    setShortcutLabel(isMac ? t("shortcutMac") : t("shortcutWin"));
  }, [t]);

  useEffect(() => {
    const cached = getStoredMenuForUser(user.userId, user.orgId, menuLang);
    if (cached && cached.length > 0) {
      setCatalog(buildQuickSearchCatalog(cached));
    }

    let cancelled = false;
    void fetchMenuClient({
      userId: user.userId,
      orgId: user.orgId,
      roleId: user.roleId,
      lang: menuLang,
    }).then((result) => {
      if (cancelled || !result.ok) return;
      setCatalog(buildQuickSearchCatalog(result.items));
    });

    return () => {
      cancelled = true;
    };
  }, [user.userId, user.orgId, user.roleId, menuLang]);

  const clearAndClose = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(false);
    inputRef.current?.blur();
  }, []);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        !event.altKey;
      if (!isShortcut) return;
      const wide = window.matchMedia("(min-width: 768px)").matches;
      if (variant === "field" && !wide) return;
      if (variant === "icon" && wide) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [variant]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node)) return;
      if (
        root.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open || variant !== "icon" || !panelFrame) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, variant, panelFrame]);

  useLayoutEffect(() => {
    if (!open || variant !== "icon") return;

    function place() {
      const header = rootRef.current?.closest("header");
      const rect = header?.getBoundingClientRect();
      const inner = header?.firstElementChild;
      const box = inner?.getBoundingClientRect() ?? rect;
      const innerStyle = inner ? getComputedStyle(inner) : null;
      const padLeft = innerStyle ? Number.parseFloat(innerStyle.paddingLeft) || 0 : 12;
      const padRight = innerStyle ? Number.parseFloat(innerStyle.paddingRight) || 0 : 12;
      setPanelFrame({
        top: rect?.bottom ?? 64,
        left: box?.left ?? 0,
        width: box?.width ?? window.innerWidth,
        padLeft,
        padRight,
      });
    }

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, variant]);

  useEffect(() => {
    if (!showPanel) return;
    const root = listScrollRef.current;
    if (!root) return;
    const option = root.querySelector<HTMLElement>("[data-quick-active='true']");
    if (!option) return;
    const rootRect = root.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();
    if (optionRect.top < rootRect.top) {
      root.scrollTop -= rootRect.top - optionRect.top;
    } else if (optionRect.bottom > rootRect.bottom) {
      root.scrollTop += optionRect.bottom - rootRect.bottom;
    }
  }, [activeIndex, showPanel, results]);

  function navigateTo(item: QuickSearchItem) {
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.blur();
    if (item.href === pathname) return;
    router.push(item.href);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) {
        setQuery("");
        setActiveIndex(0);
        return;
      }
      clearAndClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((index) =>
        results.length === 0 ? 0 : Math.min(index + 1, results.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) setOpen(true);
      const selected = results[activeIndex];
      if (selected) navigateTo(selected);
    }
  }

  const searchField = (
    <label className="relative block w-full">
      <span className="sr-only">{t("title")}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
      <input autoComplete="off"
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        placeholder={t("placeholder")}
        className={`w-full rounded-2xl border border-border bg-surface-muted py-2.5 ps-10 text-sm text-slate-800 outline-none transition placeholder:text-muted-soft focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10 [&::-webkit-search-cancel-button]:hidden ${
          showShortcut ? "pe-10 lg:pe-24" : "pe-10"
        }`}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && results[activeIndex]
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
        spellCheck={false}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setActiveIndex(0);
            inputRef.current?.focus();
          }}
          className={`absolute top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 ${
            showShortcut ? "end-2.5 lg:end-16" : "end-2.5"
          }`}
          aria-label={t("close")}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}
      {showShortcut ? (
        <kbd className="pointer-events-none absolute top-1/2 end-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-soft lg:inline">
          {shortcutLabel}
        </kbd>
      ) : null}
    </label>
  );

  const resultsPanel = showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t("results")}
          className={
            variant === "icon"
              ? "mt-2 overflow-hidden"
              : "absolute inset-x-0 top-full z-50 mt-1.5 w-full max-w-full overflow-hidden rounded-2xl border border-border bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)]"
          }
        >
          <div
            ref={listScrollRef}
            className="max-h-[min(55vh,20rem)] overflow-y-auto overscroll-contain px-1.5 py-1.5 scrollbar-thin"
          >
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                {query.trim() ? t("noResults") : t("empty")}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {results.map((item, index) => {
                  const active = index === activeIndex;
                  return (
                    <li key={item.id}>
                      <button
                        id={`${listId}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-quick-active={active ? "true" : undefined}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseDown={(event) => {
                          // Prevent input blur before click navigates.
                          event.preventDefault();
                        }}
                        onClick={() => navigateTo(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          active ? "bg-brand-soft" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              active ? "text-brand-ink" : "text-slate-900"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] leading-4 text-slate-500">
                            {item.group}
                            <span className="text-slate-300"> · </span>
                            <span className="font-mono text-slate-400">
                              {item.href}
                            </span>
                          </span>
                        </span>
                        {active ? (
                          <CornerDownLeft
                            className="h-3.5 w-3.5 shrink-0 text-brand-ink/70"
                            strokeWidth={2}
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {results.length > 0 ? (
            <div className="border-t border-slate-100 bg-slate-50/90 px-3 py-2 text-center text-[11px] text-slate-500">
              {t("hintFooter")}
            </div>
          ) : null}
        </div>
  ) : null;

  if (variant === "icon") {
    return (
      <div ref={rootRef} className={`relative shrink-0 ${className}`.trim()}>
        <button
          type="button"
          onClick={() => {
            if (open) {
              clearAndClose();
              return;
            }
            setOpen(true);
            setActiveIndex(0);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-slate-600 shadow-sm transition hover:bg-surface-muted"
          aria-label={t("open")}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
        >
          <Search className="h-4 w-4" />
        </button>
        {open && panelFrame
          ? createPortal(
              <>
                <button
                  type="button"
                  aria-label={t("close")}
                  className="fixed inset-x-0 bottom-0 z-40 bg-slate-900/20"
                  style={{ top: panelFrame.top }}
                  onClick={clearAndClose}
                />
                <div
                  ref={panelRef}
                  style={{
                    top: panelFrame.top,
                    left: panelFrame.left,
                    width: panelFrame.width,
                    paddingLeft: panelFrame.padLeft,
                    paddingRight: panelFrame.padRight,
                  }}
                  className="fixed z-50 border-b border-border bg-surface pt-3 pb-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]"
                >
                  {searchField}
                  {resultsPanel}
                </div>
              </>,
              document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`.trim()}>
      {searchField}
      {resultsPanel}
    </div>
  );
}
