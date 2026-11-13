"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Check, Eye, EyeOff, Plus, RotateCcw, Search, X } from "lucide-react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/toast";
import { usePathname, useRouter } from "@/i18n/navigation";
import { onboardingModulePages } from "@/lib/modules/module.types";
import { getStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import { fetchMembers } from "@/features/onboarding/member-registration/services/member-client";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";
import {
  changeMemberKycStatus,
  fetchMemberKyc,
  isMemberKycClientError,
  verifyMemberKyc,
} from "@/features/onboarding/member-kyc/services/member-kyc-client";
import type { MemberKycDocument } from "@/features/onboarding/member-kyc/types/member-kyc.types";
import {
  CaptureDocumentsModal,
  EditDocumentModal,
  MemberPickerModal,
} from "@/features/customer-kyc/components/CustomerKycPanels";

type TabId = "pending" | "verified" | "rejected" | "all";

function tabStatus(tab: TabId): 0 | 1 | 2 | undefined {
  if (tab === "verified") return 1;
  if (tab === "rejected") return 2;
  if (tab === "all") return undefined;
  return 0;
}

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

export function CustomerKycView() {
  const t = useTranslations("onboarding.customerKyc");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user] = useState(() => getStoredAuthUser());
  const branchBound = Boolean(user && !user.isHead && user.branchId);

  const memberId = Number(searchParams.get("member_id") || "");
  const tab = (searchParams.get("tab") as TabId) || "pending";
  const keyword = searchParams.get("keyword") ?? "";
  const branchId = branchBound ? String(user?.branchId ?? "") : (searchParams.get("branch_id") ?? "");
  const docType = searchParams.get("doc_type_cd") ?? "";
  const showInactive = searchParams.get("inactive") === "1";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("per_page") || "50");

  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [rows, setRows] = useState<MemberKycDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [types, setTypes] = useState<{ value: string; label: string; id: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [editing, setEditing] = useState<MemberKycDocument | null>(null);
  const [review, setReview] = useState<MemberKycDocument | null>(null);
  const [decision, setDecision] = useState<{ ids: number[]; status: 0 | 1 | 2 } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  function writeQuery(patch: Record<string, string | null>, resetPage = false) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => setDraftKeyword(keyword), [keyword]);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draftKeyword.trim() !== keyword) writeQuery({ keyword: draftKeyword.trim() || null }, true);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [draftKeyword]);

  useEffect(() => {
    if (branchBound) return;
    fetchBranchList({ isActive: 1, perPage: 200 })
      .then((result) => setBranches(result.items.map((branch) => ({ value: String(branch.branchId), label: branch.branchName }))))
      .catch(() => setBranches([]));
  }, [branchBound]);

  useEffect(() => {
    fetchApplOptions(33)
      .then((options) =>
        setTypes(
          options
            .filter((option) => option.optGroup === "Document Type" && option.isActive)
            .map((option) => ({ value: String(option.optCode), label: option.optDescription, id: String(option.optionId) })),
        ),
      )
      .catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    if (!Number.isFinite(memberId) || memberId <= 0) {
      setMember(null);
      return;
    }
    fetchMembers({ memberId, page: 1, perPage: 1 })
      .then((result) => setMember(result.items[0] ?? null))
      .catch(() => setMember(null));
  }, [memberId, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const shared = {
      branchId: branchId ? Number(branchId) : undefined,
      docTypeCd: docType ? Number(docType) : undefined,
      keyword: keyword || undefined,
      isActive: showInactive ? undefined : true,
    };
    const list = Number.isFinite(memberId) && memberId > 0
      ? fetchMemberKyc({ ...shared, memberId, page: 1, perPage: 200 }, controller.signal)
      : fetchMemberKyc({
          ...shared,
          verifyStatus: tabStatus(tab),
          page,
          perPage: pageSize,
        }, controller.signal);
    list
      .then((result) => {
        if (controller.signal.aborted) return;
        setRows(result.items);
        setTotal(result.meta.total);
        setLastPage(result.meta.lastPage);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRows([]);
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [memberId, tab, keyword, branchId, docType, showInactive, page, pageSize, reloadKey]);

  useEffect(() => {
    if (Number.isFinite(memberId) && memberId > 0) return;
    const shared = {
      branchId: branchId ? Number(branchId) : undefined,
      docTypeCd: docType ? Number(docType) : undefined,
      keyword: keyword || undefined,
      isActive: showInactive ? undefined : true,
      page: 1,
      perPage: 1,
    };
    Promise.all([
      fetchMemberKyc({ ...shared, verifyStatus: 0 }),
      fetchMemberKyc({ ...shared, verifyStatus: 1 }),
      fetchMemberKyc({ ...shared, verifyStatus: 2 }),
    ])
      .then(([pending, verified, rejected]) =>
        setCounts({ pending: pending.meta.total, verified: verified.meta.total, rejected: rejected.meta.total }),
      )
      .catch(() => setCounts({ pending: 0, verified: 0, rejected: 0 }));
  }, [memberId, keyword, branchId, docType, showInactive, reloadKey]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }),
    [locale],
  );
  function formatDate(value: string | null) {
    if (!value) return "—";
    const parsed = new Date(value.includes("T") || value.includes(" ") ? value.replace(" ", "T") : `${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : dateFormat.format(parsed);
  }

  function saved(message: string) {
    if (message) showToast(message, "success");
    setSelected([]);
    setReloadKey((value) => value + 1);
  }

  async function applyDecision() {
    if (!decision) return;
    if (decision.status !== 1 && !remarks.trim()) {
      setDecisionError(t("reasonRequired"));
      return;
    }
    try {
      const result = await verifyMemberKyc({
        memberKycId: decision.ids.length === 1 ? decision.ids[0] : undefined,
        memberKycIds: decision.ids.length > 1 ? decision.ids : undefined,
        verifyStatus: decision.status,
        remarks: remarks.trim() || undefined,
      });
      setDecision(null);
      setReview(null);
      saved(result.message);
    } catch (caught) {
      const message = isMemberKycClientError(caught) ? caught.message : t("requestFailed");
      setDecisionError(message);
      showToast(message, "error");
    }
  }

  const activeRows = rows.filter((row) => row.isActive);
  const inactiveRows = rows.filter((row) => !row.isActive);
  const hasPhotoId = activeRows.some((row) => row.docTypeCd === 1 || row.docTypeCd === 2);
  const locked = member?.statusCd === 4 || member?.statusCd === 5;
  const ownId = user ? String(user.userId) : "";

  function canVerify(row: MemberKycDocument) {
    return row.isActive && row.verifyStatus === 0 && !row.isExpired && String(row.createdBy ?? "") !== ownId;
  }

  if (Number.isFinite(memberId) && memberId > 0) {
    return (
      <ModulePageShell
        page={onboardingModulePages.customerKyc}
        actions={
          <Button type="button" icon={Plus} disabled={locked} tooltip={locked ? t("memberLocked") : undefined} onClick={() => setCaptureOpen(true)}>
            {t("capture")}
          </Button>
        }
      >
        <button type="button" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-700" onClick={() => writeQuery({ member_id: null })}>
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
        {loading && !member ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}
            </div>
          </div>
        ) : (
          <>
            <header className="mb-4 rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{member?.memberName ?? t("member")}</h2>
                  <p className="text-sm text-muted">{member?.refCode} · {member?.branchName}</p>
                </div>
                <Badge tone={member?.statusCd === 1 ? "success" : "neutral"}>{member?.statusDesc ?? ""}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {t("summary", {
                  verified: activeRows.filter((row) => row.verifyStatus === 1).length,
                  pending: activeRows.filter((row) => row.verifyStatus === 0).length,
                  rejected: activeRows.filter((row) => row.verifyStatus === 2).length,
                })}
              </p>
              {!hasPhotoId && !locked ? <p className="mt-2 text-sm text-amber-800">{t("photoIdHint")}</p> : null}
            </header>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {activeRows.map((row) => (
                  <DocumentCard
                    key={row.memberKycId}
                    row={row}
                    revealed={revealed === row.memberKycId}
                    onReveal={() => setRevealed(revealed === row.memberKycId ? null : row.memberKycId)}
                    formatDate={formatDate}
                    canVerify={canVerify(row)}
                    onReview={() => setReview(row)}
                    onEdit={() => setEditing(row)}
                    onDecision={(status) => { setDecision({ ids: [row.memberKycId], status }); setRemarks(""); setDecisionError(""); }}
                    onToggle={() => void changeMemberKycStatus({ memberKycId: row.memberKycId, isActive: !row.isActive }).then((result) => saved(result.message)).catch((caught) => showToast(isMemberKycClientError(caught) ? caught.message : t("requestFailed"), "error"))}
                  />
                ))}
              </div>
            )}
            {inactiveRows.length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">{t("inactiveCount", { count: inactiveRows.length })}</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inactiveRows.map((row) => (
                    <DocumentCard
                      key={row.memberKycId}
                      row={row}
                      revealed={revealed === row.memberKycId}
                      onReveal={() => setRevealed(revealed === row.memberKycId ? null : row.memberKycId)}
                      formatDate={formatDate}
                      canVerify={false}
                      onReview={() => setReview(row)}
                      onEdit={() => setEditing(row)}
                      onDecision={(status) => { setDecision({ ids: [row.memberKycId], status }); setRemarks(""); setDecisionError(""); }}
                      onToggle={() => void changeMemberKycStatus({ memberKycId: row.memberKycId, isActive: !row.isActive }).then((result) => saved(result.message)).catch((caught) => showToast(isMemberKycClientError(caught) ? caught.message : t("requestFailed"), "error"))}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </>
        )}
        <CaptureDocumentsModal open={captureOpen} member={member} existing={rows} types={types} onClose={() => setCaptureOpen(false)} onSaved={saved} />
        <EditDocumentModal document={editing} member={member} types={types} onClose={() => setEditing(null)} onSaved={saved} />
        {review ? (
          <ReviewDialog row={review} formatDate={formatDate} onClose={() => setReview(null)} onDecision={(status) => { setDecision({ ids: [review.memberKycId], status }); setRemarks(""); setDecisionError(""); }} />
        ) : null}
        <ConfirmDialog
          open={decision != null}
          onClose={() => setDecision(null)}
          variant={decision?.status === 2 ? "danger" : decision?.status === 1 ? "success" : "warning"}
          title={decision?.status === 1 ? t("verify") : decision?.status === 2 ? t("reject") : t("reopen")}
          description={decision?.status === 0 ? t("reopenHint") : decision?.status === 1 ? t("verifyHint") : t("reasonHint")}
          confirmLabel={t("save")}
          onConfirm={applyDecision}
        >
          {decision && decision.status !== 1 ? (
            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t("reason")}</span>
              <textarea autoComplete="off" value={remarks} maxLength={200} onChange={(event) => setRemarks(event.target.value)} placeholder={t("reasonPlaceholder")} className="input min-h-20 w-full" />
              {decisionError ? <span className="mt-1 block text-danger">{decisionError}</span> : null}
            </label>
          ) : null}
        </ConfirmDialog>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell page={onboardingModulePages.customerKyc}>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {(["pending", "verified", "rejected", "all"] as TabId[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setSelected([]); writeQuery({ tab: item === "pending" ? null : item }, true); }}
            className={`rounded-2xl border px-3 py-3 text-start text-sm ${tab === item ? "border-brand bg-brand text-white" : "border-border bg-white"}`}
          >
            <span className="block font-medium">{t(`tabs.${item}`)}</span>
            <span className="text-lg font-semibold">{item === "all" ? "—" : counts[item]}</span>
          </button>
        ))}
      </div>
      <DataTable
        toolbar={
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input autoComplete="off" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("search")} className="input w-full ps-9" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
              {branchBound ? null : (
                <div className="lg:w-48">
                  <Select aria-label={t("branch")} placeholder={t("allBranches")} clearable value={branchId} onChange={(value) => writeQuery({ branch_id: value || null }, true)} options={branches} />
                </div>
              )}
              <div className="lg:w-48">
                <Select aria-label={t("documentType")} placeholder={t("allTypes")} clearable value={docType} onChange={(value) => writeQuery({ doc_type_cd: value || null }, true)} options={types} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <label className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-slate-700">
                <input autoComplete="off" type="checkbox" checked={showInactive} onChange={(event) => writeQuery({ inactive: event.target.checked ? "1" : null }, true)} />
                {t("showInactive")}
              </label>
              <Button type="button" icon={Plus} className="shrink-0" onClick={() => setPickerOpen(true)}>{t("capture")}</Button>
            </div>
          </div>
        }
        data={rows}
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        emptyTitle={tab === "pending" ? t("emptyPending") : t("emptyFiltered")}
        emptyMessage={t("emptyHint")}
        emptyAction={<Button type="button" variant="secondary" onClick={() => writeQuery({ keyword: null, branch_id: null, doc_type_cd: null, inactive: null, tab: null }, true)}>{t("clearFilters")}</Button>}
        getRowKey={(row) => String(row.memberKycId)}
        getRowClassName={(row) => (row.isActive ? undefined : "opacity-60")}
        minWidth="960px"
        pagination={{ page, pageSize, total, totalPages: lastPage, onPageChange: (next) => writeQuery({ page: String(next) }), onPageSizeChange: (size) => writeQuery({ per_page: String(size), page: null }, true) }}
        selection={tab === "pending" ? { getRowKey: (row) => String(row.memberKycId), selectedKeys: selected, onSelectionChange: setSelected } : undefined}
        columns={[
          {
            id: "member",
            header: t("member"),
            cell: (row) => (
              <button type="button" className="text-start" onClick={() => writeQuery({ member_id: String(row.memberId) })}>
                <span className="block font-medium text-slate-900">{row.memberName}</span>
                <span className="block font-mono text-xs text-muted">{row.refCode}</span>
                <span className="block text-xs text-muted">{row.branchName}</span>
              </button>
            ),
          },
          {
            id: "document",
            header: t("document"),
            cell: (row) => (
              <div>
                <div className="font-medium">{row.docTypeDesc}</div>
                <div className="text-xs text-muted">{row.photoPath ? t("frontReady") : t("frontMissing")} · {row.backPhotoPath ? t("backReady") : t("backMissing")}</div>
              </div>
            ),
          },
          {
            id: "number",
            header: t("number"),
            cell: (row) => (
              <span className="inline-flex items-center gap-1 font-mono">
                {revealed === row.memberKycId ? row.kycNo : row.kycNoMasked || row.kycNo}
                <Button type="button" size="sm" variant="ghost" icon={revealed === row.memberKycId ? EyeOff : Eye} aria-label={revealed === row.memberKycId ? t("hideNumber") : t("showNumber")} onClick={() => setRevealed(revealed === row.memberKycId ? null : row.memberKycId)} />
              </span>
            ),
          },
          {
            id: "validity",
            header: t("validity"),
            cell: (row) => {
              const soon = daysUntil(row.expiryDate);
              return (
                <div>
                  <div>{t("expires")} {formatDate(row.expiryDate)}</div>
                  {row.isExpired ? <Badge tone="danger">{t("expired")}</Badge> : null}
                  {!row.isExpired && soon != null && soon >= 0 && soon <= 60 ? <Badge tone="amber">{t("expiresSoon")}</Badge> : null}
                </div>
              );
            },
          },
          { id: "added", header: t("added"), cell: (row) => <span>{formatDate(row.createdAt)}<span className="block text-xs text-muted">{row.createdByName}</span></span> },
          {
            id: "status",
            header: t("status"),
            cell: (row) => (
              <Badge tone={!row.isActive ? "neutral" : row.verifyStatus === 1 ? "success" : row.verifyStatus === 2 ? "danger" : "amber"}>
                {!row.isActive ? t("inactive") : row.verifyStatus === 1 ? t("verified") : row.verifyStatus === 2 ? t("rejected") : t("pending")}
              </Badge>
            ),
          },
        ]}
        rowActions={{
          header: t("actions"),
          render: (row) => (
            <div className="flex justify-end gap-1">
              <Button type="button" size="sm" variant="secondary" onClick={() => setReview(row)}>{t("review")}</Button>
              {canVerify(row) ? <Button type="button" size="sm" variant="success" icon={Check} aria-label={t("verify")} onClick={() => { setDecision({ ids: [row.memberKycId], status: 1 }); setRemarks(""); setDecisionError(""); }} /> : null}
              {row.isActive && row.verifyStatus === 0 ? <Button type="button" size="sm" variant="danger" icon={X} aria-label={t("reject")} onClick={() => { setDecision({ ids: [row.memberKycId], status: 2 }); setRemarks(""); setDecisionError(""); }} /> : null}
            </div>
          ),
        }}
      />
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
          <span className="text-sm">{t("selected", { count: selected.length })}</span>
          <Button type="button" size="sm" variant="success" onClick={() => { setDecision({ ids: selected.map(Number), status: 1 }); setRemarks(""); setDecisionError(""); }}>{t("verifySelected")}</Button>
          <Button type="button" size="sm" variant="danger" icon={X} onClick={() => { setDecision({ ids: selected.map(Number), status: 2 }); setRemarks(""); setDecisionError(""); }}>{t("rejectSelected")}</Button>
        </div>
      ) : null}
      <MemberPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(picked) => { setPickerOpen(false); writeQuery({ member_id: String(picked.memberId) }); }} />
      <ConfirmDialog
        open={decision != null && review == null}
        onClose={() => setDecision(null)}
        variant={decision?.status === 2 ? "danger" : "success"}
        title={decision?.status === 2 ? t("reject") : t("verify")}
        description={decision && decision.ids.length > 1 ? t("batchHint", { count: decision.ids.length }) : t("verifyHint")}
        confirmLabel={t("save")}
        onConfirm={applyDecision}
      >
        {decision?.status === 2 ? (
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{t("reason")}</span>
            <textarea autoComplete="off" value={remarks} maxLength={200} onChange={(event) => setRemarks(event.target.value)} placeholder={t("reasonPlaceholder")} className="input min-h-20 w-full" />
            {decisionError ? <span className="mt-1 block text-danger">{decisionError}</span> : null}
          </label>
        ) : null}
      </ConfirmDialog>
      {review ? (
        <ReviewDialog
          row={review}
          formatDate={formatDate}
          onClose={() => setReview(null)}
          onDecision={(status) => { setDecision({ ids: [review.memberKycId], status }); setRemarks(""); setDecisionError(""); }}
        />
      ) : null}
    </ModulePageShell>
  );
}

function DocumentCard({
  row,
  revealed,
  onReveal,
  formatDate,
  canVerify,
  onReview,
  onEdit,
  onDecision,
  onToggle,
}: {
  row: MemberKycDocument;
  revealed: boolean;
  onReveal: () => void;
  formatDate: (value: string | null) => string;
  canVerify: boolean;
  onReview: () => void;
  onEdit: () => void;
  onDecision: (status: 0 | 1 | 2) => void;
  onToggle: () => void;
}) {
  const t = useTranslations("onboarding.customerKyc");
  const tone = !row.isActive ? "neutral" : row.verifyStatus === 1 ? "success" : row.verifyStatus === 2 ? "danger" : "amber";
  return (
    <article className={`rounded-xl border border-border bg-white p-3 text-sm ${row.isActive ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-900">{row.docTypeDesc}</h3>
        <Badge tone={tone}>{!row.isActive ? t("inactive") : row.verifyStatus === 1 ? t("verified") : row.verifyStatus === 2 ? t("rejected") : t("pending")}</Badge>
      </div>
      <p className="mt-2 font-mono">{revealed ? row.kycNo : row.kycNoMasked || row.kycNo}</p>
      <p className="mt-1 text-xs text-muted">{row.photoPath ? t("frontReady") : t("frontMissing")} · {row.backPhotoPath ? t("backReady") : t("backMissing")}</p>
      <p className="mt-1 text-xs text-muted">{formatDate(row.createdAt)} · {row.createdByName}</p>
      {row.verifyRemarks ? <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-rose-800">{row.verifyRemarks}</p> : null}
      <div className="mt-3 flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="ghost" icon={revealed ? EyeOff : Eye} onClick={onReveal}>{revealed ? t("hideNumber") : t("showNumber")}</Button>
        <Button type="button" size="sm" variant="secondary" onClick={onReview}>{t("review")}</Button>
        {row.isActive && row.verifyStatus !== 1 ? <Button type="button" size="sm" variant="secondary" onClick={onEdit}>{row.verifyStatus === 2 ? t("resubmit") : t("edit")}</Button> : null}
        {canVerify ? <Button type="button" size="sm" variant="success" icon={Check} onClick={() => onDecision(1)}>{t("verify")}</Button> : null}
        {row.isActive && row.verifyStatus !== 2 ? <Button type="button" size="sm" variant="danger" icon={X} onClick={() => onDecision(2)}>{t("reject")}</Button> : null}
        {row.isActive && row.verifyStatus !== 0 ? <Button type="button" size="sm" variant="warning" icon={RotateCcw} onClick={() => onDecision(0)}>{t("reopen")}</Button> : null}
        <Button type="button" size="sm" variant="secondary" onClick={onToggle}>{row.isActive ? t("deactivate") : t("activate")}</Button>
      </div>
    </article>
  );
}

function ReviewDialog({
  row,
  formatDate,
  onClose,
  onDecision,
}: {
  row: MemberKycDocument;
  formatDate: (value: string | null) => string;
  onClose: () => void;
  onDecision: (status: 0 | 1 | 2) => void;
}) {
  const t = useTranslations("onboarding.customerKyc");
  const [side, setSide] = useState<"front" | "back">("front");
  const path = side === "front" ? row.photoPath : row.backPhotoPath;
  const image = path && /^https?:\/\//i.test(path) ? path : "";
  return (
    <div className="fixed inset-0 z-[210] grid place-items-center bg-slate-950/50 p-4" role="presentation">
      <div role="dialog" aria-modal="true" className="grid max-h-[90dvh] w-full max-w-4xl gap-4 overflow-auto rounded-xl bg-white p-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex gap-2">
            <Button type="button" size="sm" variant={side === "front" ? "primary" : "secondary"} onClick={() => setSide("front")}>{t("front")}</Button>
            <Button type="button" size="sm" variant={side === "back" ? "primary" : "secondary"} onClick={() => setSide("back")}>{t("back")}</Button>
          </div>
          {image ? (
            <img src={image} alt={t("imageAlt", { type: row.docTypeDesc ?? "", name: row.memberName, side: t(side) })} className="max-h-80 w-full rounded-lg object-contain" />
          ) : (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{path ? path : t("noImage")}</p>
          )}
        </div>
        <div className="text-sm">
          <h2 className="text-lg font-semibold text-slate-900">{row.memberName}</h2>
          <p className="font-mono text-muted">{row.refCode}</p>
          <p className="mt-3 font-medium">{row.docTypeDesc}</p>
          <p className="font-mono">{row.kycNo}</p>
          <p className={row.isExpired ? "text-rose-700" : ""}>{t("expires")} {formatDate(row.expiryDate)}</p>
          <p className="mt-2 text-muted">{t("addedBy", { name: row.createdByName ?? "", date: formatDate(row.createdAt) })}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!row.isExpired && row.isActive && row.verifyStatus === 0 ? <Button type="button" variant="success" icon={Check} onClick={() => onDecision(1)}>{t("verify")}</Button> : null}
            {row.isActive && row.verifyStatus !== 2 ? <Button type="button" variant="danger" icon={X} onClick={() => onDecision(2)}>{t("reject")}</Button> : null}
            {row.isActive && row.verifyStatus !== 0 ? <Button type="button" variant="warning" icon={RotateCcw} onClick={() => onDecision(0)}>{t("reopen")}</Button> : null}
            <Button type="button" variant="secondary" onClick={onClose}>{t("close")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
