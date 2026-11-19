"use client";

import { useEffect, useState } from "react";
import { Check, FileDown, Pencil, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { deleteDrafts, downloadDrafts, fetchDrafts, finalizeDrafts } from "./services/opening-deposit-client";
import type { OpeningDraft } from "./services/opening-deposit.schemas";

export function OpeningDraftTable({ type, revision, onEdit }: { type: 1 | 2 | 3 | 4 | 5; revision: number; onEdit: (row: OpeningDraft) => void }) {
  const [items, setItems] = useState<OpeningDraft[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState<{ total: number; last_page: number; opening_balance_total?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useToastText();
  const [notice, setNotice] = useToastText();
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<{ action: "delete" | "finalize"; ids: number[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setListError("");
    fetchDrafts(type, page, pageSize, undefined, `${revision}:${reload}`).then((result) => {
      if (!cancelled) { setItems(result.data); setMeta(result.meta); }
    }).catch((err: unknown) => { if (!cancelled) { setItems([]); setMeta(null); setListError(err instanceof Error ? err.message : "Could not load drafts."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [type, page, pageSize, revision, reload]);
  async function runBatch() {
    if (!pending || busy) return;
    setBusy(true); setActionError(""); setNotice("");
    try {
      if (pending.action === "delete") await deleteDrafts(pending.ids); else await finalizeDrafts(pending.ids);
      setNotice(pending.action === "delete" ? "Drafts deleted." : type === 3 ? "Share drafts finalized and subscriptions approved." : type === 4 ? "General Fund drafts finalized and accounts created." : type === 5 ? "Thrift Fund drafts finalized and accounts created." : "Drafts finalized. Positive opening balances are posted to the deposit ledger without a GL voucher.");
      setSelected([]); setPending(null); setPage(1); setReload((value) => value + 1);
    } catch (err) { setActionError(err instanceof Error ? err.message : "Could not update drafts."); setPending(null); }
    finally { setBusy(false); }
  }
  const columns: DataTableColumn<OpeningDraft>[] = [
    { id: "type", header: "Account type", cell: (row) => row.account_type || "—" },
    { id: "reference", header: "Account reference", cell: (row) => row.ref_ac_no || "—" },
    { id: "customer", header: "Customer / Group", cell: (row) => <div><p>{row.customer_name || "—"}</p><p className="text-xs text-muted">{row.customer_code || "—"}</p></div> },
    ...(type === 5 ? [{ id: "installment", header: "Monthly installment", cell: (row: OpeningDraft) => row.installment_amount ?? "—" }] : []),
    ...(type === 3 ? [{ id: "shares", header: "No. of shares", cell: (row: OpeningDraft) => row.no_of_shares ?? "—" }, { id: "faceValue", header: "Face value", cell: (row: OpeningDraft) => row.face_value ?? "—" }] : type === 4 || type === 5 ? [{ id: "rate", header: "Interest rate (p.a.)", cell: (row: OpeningDraft) => row.intt_rate != null ? `${row.intt_rate} %` : "—" }] : [{ id: "scheme", header: "Scheme", cell: (row: OpeningDraft) => row.scheme_name || "—" }]),
    { id: "date", header: "Opening date", cell: (row) => row.opening_date || "—" },
    { id: "balance", header: "Opening balance", align: "end", cell: (row) => `₹ ${row.opening_balance}` },
  ];
  return <div className="space-y-3">
    <PageToast message={notice} />
    <PageToast message={actionError} tone="error" />
    <DataTable title="Saved deposit drafts" description={`Total: ${meta?.total ?? 0} | Opening balance: ₹ ${meta?.opening_balance_total ?? "0.00"}`} data={items} columns={columns} getRowKey={(row) => String(row.opening_id)} loading={loading} error={Boolean(listError)} errorMessage={listError} onRetry={() => setReload((value) => value + 1)} emptyTitle="No saved drafts" emptyMessage="Add an opening deposit draft to begin." minHeight="0" minWidth="850px" selection={{ getRowKey: (row) => String(row.opening_id), selectedKeys: selected, onSelectionChange: setSelected }} rowActions={{ render: (row) => <div className="flex gap-1"><Button size="sm" variant="secondary" icon={Pencil} aria-label={`Edit ${row.ref_ac_no || row.opening_id}`} onClick={() => onEdit(row)} /><Button size="sm" variant="danger" icon={Trash2} aria-label={`Delete ${row.ref_ac_no || row.opening_id}`} onClick={() => setPending({ action: "delete", ids: [row.opening_id] })} /></div> }} pagination={{ page, pageSize, total: meta?.total ?? 0, totalPages: meta?.last_page, pageSizeOptions: [20, 50, 100, 200], onPageChange: (value) => { setPage(value); setSelected([]); }, onPageSizeChange: (value) => { setPageSize(value); setPage(1); setSelected([]); } }} />
    <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="danger" icon={Trash2} disabled={!selected.length || selected.length > 200 || busy} onClick={() => setPending({ action: "delete", ids: selected.map(Number) })}>Delete selected ({selected.length})</Button><div className="flex flex-wrap gap-2"><Button variant="secondary" icon={FileDown} disabled={busy} onClick={() => { setActionError(""); void downloadDrafts(type).catch((err: unknown) => setActionError(err instanceof Error ? err.message : "Could not export drafts.")); }}>Export filtered Excel</Button><Button icon={Check} disabled={!selected.length || selected.length > 200 || busy} onClick={() => setPending({ action: "finalize", ids: selected.map(Number) })}>Finalize selected ({selected.length})</Button></div></div>
    <ConfirmDialog open={pending !== null} onClose={() => { if (!busy) setPending(null); }} onConfirm={runBatch} actionType={pending?.action === "finalize" ? "approve" : "delete"} title={pending?.action === "finalize" ? (type === 3 ? "Finalize share drafts?" : type === 4 ? "Finalize General Fund drafts?" : type === 5 ? "Finalize Thrift Fund drafts?" : "Finalize deposit drafts?") : "Delete drafts?"} description={pending?.action === "finalize" ? type === 3 ? `Finalize ${pending.ids.length} selected share draft(s)? This creates approved share subscriptions that count in share holdings.` : type === 4 ? `Finalize ${pending.ids.length} selected General Fund draft(s)? This creates General Fund accounts and an approved opening transaction for each nonzero balance.` : type === 5 ? `Finalize ${pending.ids.length} selected Thrift Fund draft(s)? This creates Thrift Fund accounts and an approved opening transaction for each nonzero balance.` : `Finalize ${pending.ids.length} selected draft(s)? This creates deposit accounts and posts positive opening balances to the deposit ledger without a GL voucher.` : `Delete ${pending?.ids.length ?? 0} selected draft(s)?`} confirmLabel={pending?.action === "finalize" ? "Finalize" : "Delete"} loading={busy} />
  </div>;
}
