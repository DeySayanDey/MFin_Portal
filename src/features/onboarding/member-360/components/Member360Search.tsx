"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { controlClass } from "@/components/ui/Input";
import {
  fetchMembers,
  isMemberClientError,
} from "@/features/onboarding/member-registration/services/member-client";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";

const MIN_CHARS = 2;
const RESULT_LIMIT = 8;
const DEBOUNCE_MS = 300;

type Member360SearchProps = {
  onSelect: (member: Member) => void;
};

export function Member360Search({ onSelect }: Member360SearchProps) {
  const t = useTranslations("onboarding.member360");
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = keyword.trim();
  const ready = term.length >= MIN_CHARS;

  useEffect(() => {
    if (!ready) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetchMembers({ keyword: term, page: 1, perPage: RESULT_LIMIT }, { replace: true })
        .then((result) => {
          if (cancelled) return;
          setItems(result.items);
          setActive(0);
        })
        .catch((reason: unknown) => {
          if (cancelled || (reason instanceof DOMException && reason.name === "AbortError")) return;
          setItems([]);
          setError(isMemberClientError(reason) ? reason.message : t("search.failed"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, t, term]);

  function choose(member: Member) {
    onSelect(member);
    setOpen(false);
    setKeyword("");
    setItems([]);
    inputRef.current?.blur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const member = items[active];
      if (member) choose(member);
    }
  }

  const showPanel = open && ready;

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        {t("search.label")}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3.5 my-auto h-4.5 w-4.5 text-muted"
          aria-hidden
        />
        <input autoComplete="off"
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && items[active] ? `${listId}-${items[active].memberId}` : undefined}
          value={keyword}
          placeholder={t("search.placeholder")}
          onChange={(event) => {
            setKeyword(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          className={`${controlClass} h-12 rounded-2xl ps-11 pe-11 [&::-webkit-search-cancel-button]:hidden`}
        />
        {loading ? (
          <Loader2 className="absolute inset-y-0 end-3.5 my-auto h-4 w-4 animate-spin text-muted" aria-hidden />
        ) : keyword ? (
          <button
            type="button"
            className="absolute inset-y-0 end-2.5 my-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label={t("search.clear")}
            onClick={() => {
              setKeyword("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {!ready ? <p className="mt-1.5 text-xs text-muted">{t("search.hint", { count: MIN_CHARS })}</p> : null}

      {showPanel ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
          {error ? (
            <p className="px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : !loading && items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">{t("search.noResults", { keyword: term })}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={t("search.label")} className="max-h-80 overflow-y-auto py-1">
              {items.map((member, index) => (
                <li
                  key={member.memberId}
                  id={`${listId}-${member.memberId}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(member)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${
                    index === active ? "bg-brand-soft/60" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{member.memberName}</span>
                    <span className="block truncate text-xs text-muted">
                      {t("search.resultMeta", {
                        code: String(member.memberCode ?? ""),
                        mobile: member.mobileNo || t("dash"),
                        branch: member.branchName || t("dash"),
                      })}
                    </span>
                  </span>
                  <Badge tone={member.statusCd === 1 ? "success" : "neutral"} caps={false}>
                    {member.statusDesc || t("dash")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
