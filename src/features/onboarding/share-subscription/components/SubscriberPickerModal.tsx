"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchMembers } from "@/features/onboarding/member-registration/services/member-client";
import { fetchGroups } from "@/features/onboarding/group-management/services/group-client";
import { CUST_TYPE_GROUP } from "../share-subscription.constants";
import { isShareSubscriptionClientError } from "../services/share-subscription-client";

export type Subscriber = {
  id: number;
  code: string;
  name: string;
  branchName: string;
  detail: string;
};

type SubscriberPickerModalProps = {
  open: boolean;
  custTypeCd: number;
  selectedId: number | null;
  onClose: () => void;
  onSelect: (subscriber: Subscriber) => void;
};

const PAGE_SIZE = 20;

async function searchSubscribers(custTypeCd: number, keyword: string, page: number) {
  const term = keyword.trim() || undefined;
  if (custTypeCd === CUST_TYPE_GROUP) {
    const result = await fetchGroups({ keyword: term, statusCd: 1, perPage: PAGE_SIZE, page });
    return {
      total: result.meta.total,
      items: result.items.map<Subscriber>((group) => ({
        id: group.groupId,
        code: group.refCode || String(group.groupCode),
        name: group.groupName,
        branchName: group.branchName,
        detail: [group.groupTypeDesc, group.centerName].filter(Boolean).join(" · "),
      })),
    };
  }
  const result = await fetchMembers({ keyword: term, statusCd: 1, perPage: PAGE_SIZE, page });
  return {
    total: result.meta.total,
    items: result.items.map<Subscriber>((member) => ({
      id: member.memberId,
      code: member.refCode || String(member.memberCode),
      name: member.memberName,
      branchName: member.branchName,
      detail: [member.groupName, member.mobileNo].filter(Boolean).join(" · "),
    })),
  };
}

export function SubscriberPickerModal({
  open,
  custTypeCd,
  selectedId,
  onClose,
  onSelect,
}: SubscriberPickerModalProps) {
  const t = useTranslations("onboarding.shareSubscription");
  const isGroup = custTypeCd === CUST_TYPE_GROUP;

  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState({ keyword: "", page: 1 });
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (keyword: string, page: number, signal: { cancelled: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchSubscribers(custTypeCd, keyword, page);
        if (signal.cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      } catch (err) {
        if (signal.cancelled) return;
        setItems([]);
        setTotal(0);
        setError(isShareSubscriptionClientError(err) ? err.message : t("picker.loadError"));
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    },
    [custTypeCd, t],
  );

  useEffect(() => {
    if (!open) return;
    setDraft("");
    setQuery({ keyword: "", page: 1 });
  }, [open, custTypeCd]);

  useEffect(() => {
    if (!open) return;
    const signal = { cancelled: false };
    void load(query.keyword, query.page, signal);
    return () => {
      signal.cancelled = true;
    };
  }, [open, query, load]);

  function submitSearch(event?: FormEvent) {
    event?.preventDefault();
    setQuery({ keyword: draft.trim(), page: 1 });
  }

  const from = total === 0 ? 0 : (query.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, (query.page - 1) * PAGE_SIZE + items.length);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Modal
      open={open}
      onClose={onClose}
      confirmOnClose={false}
      confirmOnSave={false}
      title={isGroup ? t("picker.titleGroup") : t("picker.titleMember")}
      subtitle={t("picker.subtitle")}
      size="lg"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("picker.close")}
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        <form autoComplete="off" className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={submitSearch}>
          <div className="min-w-0 flex-1">
            <TextField
              label={t("picker.filter")}
              value={draft}
              onChange={setDraft}
              placeholder={isGroup ? t("form.searchPlaceholderGroup") : t("form.searchPlaceholderMember")}
              autoFocus
            />
          </div>
          <Button type="submit" icon={Search} loading={loading} className="w-full sm:w-auto">
            {t("form.searchButton")}
          </Button>
        </form>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {loading && items.length === 0 ? (
          <div className="space-y-2" aria-label={t("picker.loading")}>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !error && items.length === 0 ? (
          <EmptyState
            className="rounded-xl border border-dashed border-border"
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
            title={t("picker.empty")}
            message={t("picker.emptyHint")}
          />
        ) : items.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-surface-muted text-start text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.code")}</th>
                  <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.name")}</th>
                  <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.branch")}</th>
                  <th scope="col" className="px-3 py-2 text-start">{t("picker.columns.detail")}</th>
                  <th scope="col" className="px-3 py-2 text-end">{t("picker.columns.action")}</th>
                </tr>
              </thead>
              <tbody className={loading ? "opacity-60" : undefined}>
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <tr key={item.id} className="border-t border-border hover:bg-surface-muted/60">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-700">{item.code}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                      <td className="px-3 py-2 text-slate-700">{item.branchName || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted">{item.detail || "—"}</td>
                      <td className="px-3 py-2 text-end">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "success" : "primary"}
                          icon={Check}
                          onClick={() => onSelect(item)}
                        >
                          {isSelected ? t("picker.selected") : t("picker.select")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{t("picker.showing", { from, to, total })}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={ChevronLeft}
                disabled={loading || query.page <= 1}
                onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
              >
                {t("picker.previous")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={ChevronRight}
                disabled={loading || query.page >= lastPage}
                onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
              >
                {t("picker.next")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
