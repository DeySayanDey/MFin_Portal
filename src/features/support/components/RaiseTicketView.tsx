"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { getStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { readOrganizationCache } from "@/features/master/organization/services/organization-cache";
import { projectDomain } from "@/features/support/services/support-domain";
import { RaiseTicketForm } from "@/features/support/components/RaiseTicketForm";
import {
  SupportTicketFilters,
  type SupportTicketFilterValues,
} from "@/features/support/components/SupportTicketFilters";
import { SupportTicketDetail } from "@/features/support/components/SupportTicketDetail";
import { SupportTicketTable } from "@/features/support/components/SupportTicketTable";
import {
  fetchSupportTicket,
  fetchSupportTickets,
  isSupportTicketClientError,
  raiseSupportTicket,
} from "@/features/support/services/support-ticket-client";
import {
  useSupportNoticePermission,
  type SupportNotice,
} from "@/features/support/services/support-notice";
import {
  clearSupportNoticesForTicket,
  supportOpenEventName,
  takeQueuedSupportTicket,
} from "@/features/support/services/support-inbox";
import { useSupportDeskRealtime } from "@/features/support/services/use-support-realtime";
import type {
  RaiseTicketFormInput,
  SupportTicket,
  SupportTicketDetail as SupportTicketDetailData,
  SupportTicketListQuery,
  SupportTicketListResult,
} from "@/features/support/types/support-ticket.types";

const EMPTY_FILTERS: SupportTicketFilterValues = {
  search: "",
  priority: "",
  status: "",
  fromDate: "",
  toDate: "",
};

type PinnedNotice = {
  number: string;
  title: string;
  body: string;
};

const EMPTY_LIST: SupportTicketListResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  from: 0,
  to: 0,
};

let ticketListInflight: {
  key: string;
  promise: Promise<SupportTicketListResult>;
} | null = null;

function loadTicketList(key: string, query: SupportTicketListQuery) {
  if (ticketListInflight?.key === key) return ticketListInflight.promise;
  const promise = fetchSupportTickets(query).finally(() => {
    if (ticketListInflight?.promise === promise) ticketListInflight = null;
  });
  ticketListInflight = { key, promise };
  return promise;
}

export function RaiseTicketView() {
  const t = useTranslations("support.raiseTicket");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const [filters, setFilters] = useState<SupportTicketFilterValues>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<SupportTicketFilterValues>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [list, setList] = useState<SupportTicketListResult>(EMPTY_LIST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [messageReloadKey, setMessageReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<SupportTicketDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pinned, setPinned] = useState<PinnedNotice[]>([]);
  const listItemsRef = useRef<SupportTicket[]>([]);
  const openNumberRef = useRef<string | null>(null);
  listItemsRef.current = list.items;
  openNumberRef.current = detailOpen ? detailTicket?.number ?? null : null;
  useSupportNoticePermission();
  const routerRef = useRef(router);
  const tErrorsRef = useRef(tErrors);
  routerRef.current = router;
  tErrorsRef.current = tErrors;

  const listQuery: SupportTicketListQuery = {
    search: appliedFilters.search.trim() || undefined,
    priority: appliedFilters.priority || undefined,
    status: appliedFilters.status || undefined,
    fromDate: appliedFilters.fromDate || undefined,
    toDate: appliedFilters.toDate || undefined,
    page,
    pageSize,
  };
  const listKey = `${reloadKey}:${JSON.stringify(listQuery)}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setErrorMessage(undefined);

    void loadTicketList(listKey, listQuery)
      .then((result) => {
        if (!active) return;
        setList(result);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (isSupportTicketClientError(loadError) && loadError.status === 401) {
          routerRef.current.replace("/login");
          return;
        }
        setList(EMPTY_LIST);
        setError(true);
        setErrorMessage(
          isSupportTicketClientError(loadError)
            ? loadError.message
            : tErrorsRef.current("generic"),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [listKey]);

  function supportErrorText(value: unknown): string {
    if (!isSupportTicketClientError(value)) return tErrors("generic");
    return value.message;
  }

  function openForm() {
    setFormError(null);
    setFormSession((value) => value + 1);
    setFormOpen(true);
  }

  async function handleSubmit(input: RaiseTicketFormInput) {
    const user = getStoredAuthUser();
    const organization = readOrganizationCache()?.organization;
    const customerPhone = (user?.userPhone || user?.userMob || "")
      .trim()
      .slice(0, 30);
    const customerName = organization?.orgDispNm?.trim().slice(0, 150) || "Customer";
    const domain = projectDomain(window.location.host);
    if (!customerPhone) {
      setFormError(t("errors.organization"));
      return;
    }
    if (!domain) {
      setFormError(t("errors.domain"));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await raiseSupportTicket({
        ...input,
        customerPhone,
        customerName,
        domain,
      });
      setFormOpen(false);
      setSuccessMessage(t("success"));
      setPage(1);
      setReloadKey((value) => value + 1);
      setRealtimeKey((value) => value + 1);
    } catch (submitError) {
      if (isSupportTicketClientError(submitError) && submitError.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(supportErrorText(submitError));
    } finally {
      setSaving(false);
    }
  }

  function clearFresh(number: string) {
    setPinned((current) => {
      if (!current.some((item) => item.number === number)) return current;
      return current.filter((item) => item.number !== number);
    });
  }

  function showTicket(number: string, row?: SupportTicket) {
    clearFresh(number);
    clearSupportNoticesForTicket(number);
    setDetailOpen(true);
    setDetailError(null);
    setDetailLoading(true);
    setDetailTicket(
      row
        ? {
            ...row,
            description: "",
            customerName: null,
            customerPhone: null,
            screenshots: [],
          }
        : null,
    );
    void fetchSupportTicket(number)
      .then((ticket) => {
        setDetailTicket(ticket);
      })
      .catch((loadError: unknown) => {
        if (isSupportTicketClientError(loadError) && loadError.status === 401) {
          router.replace("/login");
          return;
        }
        setDetailError(supportErrorText(loadError));
      })
      .finally(() => setDetailLoading(false));
  }

  function openByNumber(number: string) {
    const row = listItemsRef.current.find((item) => item.number === number);
    showTicket(number, row);
  }

  useSupportDeskRealtime({
    sessionKey: realtimeKey,
    ticketNumber: detailOpen ? detailTicket?.number ?? null : null,
    onRefresh: (refresh) => {
      if (refresh.tickets) setReloadKey((value) => value + 1);
      const openNumber = openNumberRef.current;
      const matchesOpen = Boolean(openNumber) && (!refresh.number || refresh.number === openNumber);
      if (!matchesOpen || !openNumber) return;
      if (refresh.messages) setMessageReloadKey((value) => value + 1);
      if (refresh.ticket) {
        void fetchSupportTicket(openNumber)
          .then((ticket) => setDetailTicket(ticket))
          .catch(() => undefined);
      }
    },
    onNotice: (notice: SupportNotice) => {
      if (notice.number && notice.number === openNumberRef.current) {
        clearSupportNoticesForTicket(notice.number);
        return;
      }
      const title = notice.title || t("notice.fallbackTitle");
      if (notice.number && notice.number !== openNumberRef.current) {
        setPinned((current) =>
          [
            { number: notice.number, title, body: notice.body },
            ...current.filter((item) => item.number !== notice.number),
          ].slice(0, 5),
        );
      }
    },
  });

  useEffect(() => {
    const queued = takeQueuedSupportTicket();
    if (queued) openByNumber(queued);

    function onOpen(event: Event) {
      takeQueuedSupportTicket();
      const number = (event as CustomEvent<string>).detail;
      if (typeof number === "string" && number) openByNumber(number);
    }

    const name = supportOpenEventName();
    window.addEventListener(name, onOpen);
    return () => window.removeEventListener(name, onOpen);
  }, []);

  function openDetail(row: SupportTicket) {
    showTicket(row.number, row);
  }

  const freshNumbers = useMemo(() => new Set(pinned.map((item) => item.number)), [pinned]);
  const orderedItems = useMemo(() => {
    if (pinned.length === 0) return list.items;
    const rank = new Map(pinned.map((item, index) => [item.number, index]));
    return [...list.items].sort((left, right) => {
      const leftRank = rank.get(left.number) ?? pinned.length;
      const rightRank = rank.get(right.number) ?? pinned.length;
      return leftRank - rightRank;
    });
  }, [list.items, pinned]);

  function addButton() {
    return (
      <Button type="button" icon={Plus} onClick={openForm}>
        {t("add")}
      </Button>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />
      <SupportTicketFilters
        values={filters}
        onChange={setFilters}
        onSearch={() => {
          setPage(1);
          setAppliedFilters(filters);
          setReloadKey((value) => value + 1);
        }}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setAppliedFilters(EMPTY_FILTERS);
          setPage(1);
          setReloadKey((value) => value + 1);
        }}
      />
      {pinned.length > 0 ? (
        <section aria-label={t("notice.updates")} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">{t("notice.updates")}</h2>
          <ul className="flex flex-col gap-2">
            {pinned.map((notice) => (
              <li key={notice.number}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-brand-soft/70 px-3 py-2 text-start hover:bg-brand-soft"
                  onClick={() => openByNumber(notice.number)}
                >
                  <Badge tone="info" caps={false} className="mt-0.5 shrink-0">
                    {t("notice.new")}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{notice.title}</span>
                    {notice.body ? (
                      <span className="mt-0.5 block text-xs text-muted">{notice.body}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-foreground">{notice.number}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <SupportTicketTable
        items={orderedItems}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        freshNumbers={freshNumbers}
        onRetry={() => setReloadKey((value) => value + 1)}
        onView={openDetail}
        headerActions={addButton()}
        emptyAction={addButton()}
        pagination={{
          page: list.page || page,
          pageSize: list.pageSize || pageSize,
          total: list.total,
          pageSizeOptions: [20, 50, 100],
          onPageChange: setPage,
          onPageSizeChange: (next) => {
            setPageSize(next);
            setPage(1);
          },
        }}
      />
      <RaiseTicketForm
        key={formSession}
        open={formOpen}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
        }}
        onSubmit={handleSubmit}
      />
      <SupportTicketDetail
        open={detailOpen}
        ticket={detailTicket}
        loading={detailLoading}
        errorMessage={detailError}
        messageReloadKey={messageReloadKey}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
