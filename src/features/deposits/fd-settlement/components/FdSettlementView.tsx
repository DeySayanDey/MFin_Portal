"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Clock, History, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { useRouter } from "@/i18n/navigation";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import { SAMPLE_BRANCHES, SAMPLE_DEPOSITS } from "../data/fd-settlement.sample";
import {
  getServerSettlementRequests,
  getSettlementRequests,
  patchSettlementRequest,
  subscribeSettlementRequests,
} from "../data/fd-settlement.store";
import type {
  AccountStatus,
  RequestStatus,
  SampleDeposit,
  SampleRequest,
} from "../types/fd-settlement.types";

type TabId = "search" | "pending" | "settled";

type Filters = {
  depositType: string;
  query: string;
  branchId: string;
  status: string;
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

export function FdSettlementView() {
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
  const requests = useSyncExternalStore(
    subscribeSettlementRequests,
    getSettlementRequests,
    getServerSettlementRequests,
  );
  const [successMessage, setSuccessMessage] = useToastText();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const query = applied.query.trim().toLowerCase();
    return SAMPLE_DEPOSITS.filter((row) => {
      if (applied.depositType !== "all" && row.scheme !== applied.depositType) return false;
      if (applied.branchId !== "all" && row.branchId !== applied.branchId) return false;
      if (applied.status === "activeMatured") {
        if (row.status !== "active" && row.status !== "matured") return false;
      } else if (applied.status !== "all" && row.status !== applied.status) {
        return false;
      }
      if (!query) return true;
      return [row.accountNumber, row.customerId, row.customerName].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [applied]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pendingRows = requests.filter((row) => row.status === "pending" || row.status === "approved" || row.status === "rejected");
  const settledRows = requests.filter((row) => row.status === "settled");

  function depositFor(request: SampleRequest) {
    return SAMPLE_DEPOSITS.find((row) => row.id === request.accountId) ?? null;
  }

  function selectAccount(row: SampleDeposit) {
    router.push(`/deposits/fd-settlement/${row.id}`);
  }

  const searchColumns: DataTableColumn<SampleDeposit>[] = [
      {
        id: "account",
        header: t("columns.account"),
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block font-medium text-slate-900">{row.accountNumber}</span>
            <span className="block text-xs text-muted">{row.customerName}</span>
          </span>
        ),
      },
      { id: "scheme", header: t("columns.scheme"), cell: (row) => t(`schemes.${row.scheme}`) },
      { id: "branch", header: t("columns.branch"), cell: (row) => row.branchName },
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
          <Button type="button" size="sm" variant="secondary" onClick={() => selectAccount(row)}>
            {row.status === "settled" ? t("actions.view") : t("actions.select")}
          </Button>
        ),
      },
    ];

  const requestColumns: DataTableColumn<SampleRequest>[] = [
      {
        id: "account",
        header: t("columns.account"),
        cell: (row) => depositFor(row)?.accountNumber ?? t("dash"),
      },
      {
        id: "customer",
        header: t("columns.customer"),
        cell: (row) => depositFor(row)?.customerName ?? t("dash"),
      },
      {
        id: "type",
        header: t("columns.type"),
        cell: (row) => t(`workspace.types.${row.settlementType}`),
      },
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
        cell: (row) => (
          <div className="flex flex-wrap gap-2">
            {row.status === "pending" ? (
              <>
                <Button type="button" size="sm" onClick={() => { patchSettlementRequest(row.id, "approved"); setSuccessMessage(t("notices.approved")); }}>
                  {t("actions.approve")}
                </Button>
                <Button type="button" size="sm" variant="danger" onClick={() => { setRejectId(row.id); setRejectReason(""); setRejectError(null); }}>
                  {t("actions.reject")}
                </Button>
              </>
            ) : null}
            {row.status === "approved" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  patchSettlementRequest(row.id, "settled", { receiptRef: `RCP-${row.id}` });
                  setSuccessMessage(t("notices.posted"));
                  setReceiptId(row.id);
                }}
              >
                {t("actions.post")}
              </Button>
            ) : null}
            {row.status === "settled" ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setReceiptId(row.id)}>
                {t("actions.receipt")}
              </Button>
            ) : null}
            {row.status === "rejected" ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => router.push(`/deposits/fd-settlement/${row.accountId}`)}>
                {t("actions.correct")}
              </Button>
            ) : null}
          </div>
        ),
      },
    ];

  const tabs = useMemo(
    () => [
      { id: "search" as const, title: t("tabs.search"), icon: Search },
      { id: "pending" as const, title: t("tabs.pending"), icon: Clock },
      { id: "settled" as const, title: t("tabs.settled"), icon: BadgeCheck },
    ],
    [t],
  );

  const receipt = requests.find((row) => row.id === receiptId) ?? null;
  const receiptAccount = receipt ? depositFor(receipt) : null;

  const typeOptions = [
    { value: "all", label: t("filters.allTypes") },
    { value: "FD", label: t("schemes.FD") },
    { value: "MIS", label: t("schemes.MIS") },
    { value: "OTHER", label: t("schemes.OTHER") },
  ];
  const branchOptions = [
    { value: "all", label: t("filters.allBranches") },
    ...SAMPLE_BRANCHES.map((branch) => ({ value: branch.id, label: branch.name })),
  ];
  const statusOptions = [
    { value: "activeMatured", label: t("filters.activeMatured") },
    { value: "active", label: t("statuses.active") },
    { value: "matured", label: t("statuses.matured") },
    { value: "closed", label: t("statuses.closed") },
    { value: "settled", label: t("statuses.settled") },
    { value: "all", label: t("filters.allStatuses") },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button type="button" variant="secondary" icon={History} onClick={() => setTab("settled")}>
            {t("history")}
          </Button>
        }
      />

      <PageToast message={successMessage} />

      <>
          <SectionTabs tabs={tabs} activeId={tab} onChange={(next) => { setTab(next); setPage(1); }} label={t("tabsLabel")} layout="inline" />

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
                  onChange={(value) => setFilters((current) => ({ ...current, depositType: value }))}
                />
                <TextField
                  label={t("filters.account")}
                  value={filters.query}
                  placeholder={t("filters.accountPlaceholder")}
                  onChange={(value) => setFilters((current) => ({ ...current, query: value }))}
                />
                <SelectField
                  label={t("filters.branch")}
                  value={filters.branchId}
                  options={branchOptions}
                  onChange={(value) => setFilters((current) => ({ ...current, branchId: value }))}
                />
                <SelectField
                  label={t("filters.status")}
                  value={filters.status}
                  options={statusOptions}
                  onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                />
                <Button
                  type="button"
                  icon={Search}
                  onClick={() => {
                    setApplied(filters);
                    setPage(1);
                  }}
                >
                  {t("filters.search")}
                </Button>
              </FilterPanel>
              <DataTable
                data={pageRows}
                columns={searchColumns}
                getRowKey={(row) => row.id}
                emptyTitle={t("empty.searchTitle")}
                emptyMessage={t("empty.searchMessage")}
                minWidth="880px"
                pagination={{
                  page,
                  pageSize,
                  total: filtered.length,
                  pageSizeOptions: [20, 50, 100],
                  onPageChange: setPage,
                  onPageSizeChange: (size) => {
                    setPageSize(size);
                    setPage(1);
                  },
                }}
              />
            </>
          ) : null}

          {tab === "pending" ? (
            <DataTable
              data={pendingRows}
              columns={requestColumns}
              getRowKey={(row) => row.id}
              emptyTitle={t("empty.pendingTitle")}
              emptyMessage={t("empty.pendingMessage")}
              minWidth="960px"
            />
          ) : null}

          {tab === "settled" ? (
            <DataTable
              data={settledRows}
              columns={requestColumns}
              getRowKey={(row) => row.id}
              emptyTitle={t("empty.settledTitle")}
              emptyMessage={t("empty.settledMessage")}
              minWidth="960px"
            />
          ) : null}
      </>

      <Modal
        open={rejectId != null}
        onClose={() => setRejectId(null)}
        title={t("reject.title")}
        size="sm"
        confirmOnClose={false}
        confirmOnSave={false}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRejectId(null)}>{t("actions.back")}</Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (!rejectReason.trim() || !rejectId) {
                  setRejectError(t("validation.rejectReason"));
                  return;
                }
                patchSettlementRequest(rejectId, "rejected", { rejectionReason: rejectReason.trim() });
                setRejectId(null);
                setSuccessMessage(t("notices.rejected"));
              }}
            >
              {t("actions.reject")}
            </Button>
          </>
        }
      >
        {rejectError ? <Alert tone="error" className="mb-3">{rejectError}</Alert> : null}
        <TextAreaField label={t("reject.reason")} value={rejectReason} required onChange={setRejectReason} />
      </Modal>

      <Modal
        open={receipt != null}
        onClose={() => setReceiptId(null)}
        title={t("receipt.title")}
        subtitle={t("receipt.printed")}
        size="md"
        confirmOnClose={false}
        confirmOnSave={false}
        footer={<Button type="button" variant="secondary" onClick={() => setReceiptId(null)}>{t("actions.back")}</Button>}
      >
        {receipt && receiptAccount ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted">{t("receipt.reference")}</span><span className="font-medium">{receipt.receiptRef || t("dash")}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">{t("review.account")}</span><span className="font-medium">{receiptAccount.accountNumber}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">{t("review.customer")}</span><span className="font-medium">{receiptAccount.customerName}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">{t("review.date")}</span><span className="font-medium">{dateLabel(receipt.settlementDate)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted">{t("workspace.lines.net")}</span><span className="font-semibold">{money(receipt.netPayable)}</span></div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
