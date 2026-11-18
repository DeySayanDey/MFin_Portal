"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CircleCheck,
  CircleX,
  Clock,
  Eye,
  History,
  MousePointerClick,
  PencilLine,
  ReceiptText,
  Search,
  Send,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { useRouter } from "@/i18n/navigation";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import { settlementAccountHref } from "../fd-settlement.routes";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import {
  fetchSettlementAccounts,
  fetchSettlementRequests,
  isFdSettlementClientError,
  runSettlementAction,
} from "../services/fd-settlement-client";
import type {
  AccountStatus,
  AccountStatusFilter,
  ListResult,
  RequestStatus,
  SchemeCode,
  SettlementAccount,
  SettlementActionInput,
  SettlementRequest,
} from "../types/fd-settlement.types";
import { RejectSettlementModal, SettlementReceiptModal } from "./SettlementModals";

type TabId = "search" | "pending" | "settled";

type Filters = {
  depositType: SchemeCode | "all";
  query: string;
  branchId: string;
  status: AccountStatusFilter;
};

type FdSettlementViewProps = {
  canPickBranch: boolean;
};

const defaultFilters: Filters = {
  depositType: "all",
  query: "",
  branchId: "all",
  status: "activeMatured",
};

function requestTone(status: RequestStatus): BadgeTone {
  if (status === "settled" || status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending") return "warning";
  return "neutral";
}

function accountTone(status: AccountStatus): BadgeTone {
  if (status === "active" || status === "settled") return "success";
  if (status === "matured") return "info";
  return "neutral";
}

export function FdSettlementView({ canPickBranch }: FdSettlementViewProps) {
  const t = useTranslations("deposits.fdSettlement");
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(
    requestedTab === "pending" || requestedTab === "settled" ? requestedTab : "search",
  );
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [reloadKey, setReloadKey] = useState(0);
  const [accounts, setAccounts] = useState<ListResult<SettlementAccount>>({ items: [], meta: null });
  const [requests, setRequests] = useState<ListResult<SettlementRequest>>({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<SettlementRequest | null>(null);

  useEffect(() => {
    if (!canPickBranch) return;
    let cancelled = false;
    fetchBranchList({ page: 1, perPage: 200, isActive: 1 })
      .then((result) => {
        if (!cancelled) {
          setBranches(result.items.map((branch) => ({ value: String(branch.branchId), label: branch.branchName })));
        }
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canPickBranch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const branchId = applied.branchId === "all" ? undefined : Number(applied.branchId);
    const run =
      tab === "search"
        ? fetchSettlementAccounts({
            page,
            perPage: pageSize,
            scheme: applied.depositType === "all" ? undefined : applied.depositType,
            keyword: applied.query.trim() || undefined,
            branchId,
            status: applied.status,
          }).then((result) => {
            if (!cancelled) setAccounts(result);
          })
        : fetchSettlementRequests({ page, perPage: pageSize, view: tab, branchId }).then((result) => {
            if (!cancelled) setRequests(result);
          });
    run
      .catch((error: unknown) => {
        if (cancelled) return;
        if (tab === "search") setAccounts({ items: [], meta: null });
        else setRequests({ items: [], meta: null });
        setLoadError(isFdSettlementClientError(error) ? error.message : t("notices.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, applied, page, pageSize, reloadKey, t]);

  const money = (value: number | null) =>
    value == null
      ? t("dash")
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const dateLabel = (value: string) => {
    const parsed = parseYmd(value);
    return parsed
      ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
      : t("dash");
  };

  function openAccount(accountNumber: string, accountId: number) {
    router.push(settlementAccountHref(accountNumber, accountId));
  }

  async function act(input: SettlementActionInput, notice: string) {
    setBusyId(input.settlementId);
    setActionError(null);
    try {
      const result = await runSettlementAction(input);
      setRejectId(null);
      setSuccessMessage(notice);
      setReloadKey((key) => key + 1);
      if (input.action === "post") setReceipt(result.item);
    } catch (error) {
      setActionError(isFdSettlementClientError(error) ? error.message : t("notices.actionFailed"));
    } finally {
      setBusyId(null);
    }
  }

  const searchColumns: DataTableColumn<SettlementAccount>[] = [
    {
      id: "account",
      header: t("columns.account"),
      cell: (row) => (
        <span className="block min-w-0">
          <span className="block font-medium text-slate-900">{row.accountNumber || t("dash")}</span>
          <span className="block text-xs text-muted">{row.customerName}</span>
        </span>
      ),
    },
    { id: "scheme", header: t("columns.scheme"), cell: (row) => row.schemeName || t(`schemes.${row.scheme}`) },
    { id: "branch", header: t("columns.branch"), cell: (row) => row.branchName || t("dash") },
    { id: "maturity", header: t("columns.maturity"), cell: (row) => dateLabel(row.maturityDate) },
    {
      id: "status",
      header: t("columns.status"),
      cell: (row) => (
        <Badge tone={accountTone(row.status)} caps={false}>
          {t(`statuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      id: "action",
      header: t("columns.action"),
      cell: (row) => (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={row.status === "settled" ? Eye : MousePointerClick}
          onClick={() => openAccount(row.accountNumber, row.id)}
        >
          {row.status === "settled" ? t("actions.view") : t("actions.select")}
        </Button>
      ),
    },
  ];

  const requestColumns: DataTableColumn<SettlementRequest>[] = [
    { id: "account", header: t("columns.account"), cell: (row) => row.accountNumber || t("dash") },
    { id: "customer", header: t("columns.customer"), cell: (row) => row.customerName || t("dash") },
    { id: "type", header: t("columns.type"), cell: (row) => t(`workspace.types.${row.settlementType}`) },
    { id: "date", header: t("columns.date"), cell: (row) => dateLabel(row.settlementDate) },
    { id: "amount", header: t("columns.amount"), align: "end", cell: (row) => money(row.netPayable) },
    {
      id: "status",
      header: t("columns.requestStatus"),
      cell: (row) => (
        <Badge tone={requestTone(row.status)} caps={false}>
          {t(`requestStatuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      id: "action",
      header: t("columns.action"),
      cell: (row) => {
        const busy = busyId === row.id;
        const disabled = busyId != null && !busy;
        return (
          <div className="flex flex-wrap gap-2">
            {row.status === "pending" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  icon={CircleCheck}
                  loading={busy}
                  disabled={disabled}
                  onClick={() => void act({ action: "approve", settlementId: row.id }, t("notices.approved"))}
                >
                  {t("actions.approve")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={CircleX}
                  disabled={busyId != null}
                  onClick={() => {
                    setActionError(null);
                    setRejectId(row.id);
                  }}
                >
                  {t("actions.reject")}
                </Button>
              </>
            ) : null}
            {row.status === "approved" ? (
              <Button
                type="button"
                size="sm"
                icon={Send}
                loading={busy}
                disabled={disabled}
                onClick={() => void act({ action: "post", settlementId: row.id }, t("notices.posted"))}
              >
                {t("actions.post")}
              </Button>
            ) : null}
            {row.status === "settled" ? (
              <Button type="button" size="sm" variant="secondary" icon={ReceiptText} onClick={() => setReceipt(row)}>
                {t("actions.receipt")}
              </Button>
            ) : null}
            {row.status === "rejected" ? (
              <Button type="button" size="sm" variant="secondary" icon={PencilLine} onClick={() => openAccount(row.accountNumber, row.accountId)}>
                {t("actions.correct")}
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const tabs = useMemo(
    () => [
      { id: "search" as const, title: t("tabs.search"), description: t("tabHints.search"), icon: Search },
      { id: "pending" as const, title: t("tabs.pending"), description: t("tabHints.pending"), icon: Clock },
      { id: "settled" as const, title: t("tabs.settled"), description: t("tabHints.settled"), icon: BadgeCheck },
    ],
    [t],
  );

  const typeOptions = [
    { value: "all", label: t("filters.allTypes") },
    { value: "FD", label: t("schemes.FD") },
    { value: "MIS", label: t("schemes.MIS") },
    { value: "OTHER", label: t("schemes.OTHER") },
  ];
  const branchOptions = [{ value: "all", label: t("filters.allBranches") }, ...branches];
  const statusOptions = [
    { value: "activeMatured", label: t("filters.activeMatured") },
    { value: "active", label: t("statuses.active") },
    { value: "matured", label: t("statuses.matured") },
    { value: "closed", label: t("statuses.closed") },
    { value: "settled", label: t("statuses.settled") },
    { value: "all", label: t("filters.allStatuses") },
  ];

  function changeTab(next: TabId) {
    setTab(next);
    setPage(1);
    setActionError(null);
  }

  const pagination = (total: number) => ({
    page,
    pageSize,
    total,
    pageSizeOptions: [20, 50, 100],
    onPageChange: setPage,
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
  });
  const tableState = {
    loading,
    error: loadError != null,
    errorMessage: loadError ?? undefined,
    onRetry: () => setReloadKey((key) => key + 1),
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button type="button" variant="secondary" icon={History} onClick={() => changeTab("settled")}>
            {t("history")}
          </Button>
        }
      />

      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <SectionTabs tabs={tabs} activeId={tab} onChange={changeTab} label={t("tabsLabel")} layout="inline" />

      {tab === "search" ? (
        <>
          <FilterPanel
            onReset={() => {
              setFilters(defaultFilters);
              setApplied(defaultFilters);
              setPage(1);
            }}
          >
            <SelectField
              label={t("filters.depositType")}
              value={filters.depositType}
              options={typeOptions}
              onChange={(value) => setFilters((current) => ({ ...current, depositType: value as Filters["depositType"] }))}
            />
            <TextField
              label={t("filters.account")}
              value={filters.query}
              placeholder={t("filters.accountPlaceholder")}
              maxLength={50}
              onChange={(value) => setFilters((current) => ({ ...current, query: value }))}
            />
            {canPickBranch ? (
              <SelectField
                label={t("filters.branch")}
                value={filters.branchId}
                options={branchOptions}
                onChange={(value) => setFilters((current) => ({ ...current, branchId: value }))}
              />
            ) : null}
            <SelectField
              label={t("filters.status")}
              value={filters.status}
              options={statusOptions}
              onChange={(value) => setFilters((current) => ({ ...current, status: value as AccountStatusFilter }))}
            />
            <Button
              type="button"
              icon={Search}
              loading={loading}
              onClick={() => {
                setApplied(filters);
                setPage(1);
              }}
            >
              {t("filters.search")}
            </Button>
          </FilterPanel>
          <DataTable
            data={accounts.items}
            columns={searchColumns}
            getRowKey={(row) => String(row.id)}
            emptyTitle={t("empty.searchTitle")}
            emptyMessage={t("empty.searchMessage")}
            minWidth="880px"
            {...tableState}
            pagination={pagination(accounts.meta?.total ?? accounts.items.length)}
          />
        </>
      ) : (
        <DataTable
          data={requests.items}
          columns={requestColumns}
          getRowKey={(row) => String(row.id)}
          emptyTitle={tab === "pending" ? t("empty.pendingTitle") : t("empty.settledTitle")}
          emptyMessage={tab === "pending" ? t("empty.pendingMessage") : t("empty.settledMessage")}
          minWidth="960px"
          {...tableState}
          pagination={pagination(requests.meta?.total ?? requests.items.length)}
        />
      )}

      <RejectSettlementModal
        open={rejectId != null}
        busy={rejectId != null && busyId === rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={(reason) => {
          if (rejectId != null) void act({ action: "reject", settlementId: rejectId, reason }, t("notices.rejected"));
        }}
      />

      <SettlementReceiptModal request={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
