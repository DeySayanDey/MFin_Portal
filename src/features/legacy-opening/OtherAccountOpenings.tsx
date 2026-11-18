"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { FileDown, Pencil, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { Select } from "@/components/ui/Select";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { fetchApplOptions, type ApplOption } from "@/features/master/appl-options";
import { fetchLoanSchemeSetups, type LoanSchemeSetup } from "@/features/master/loan-schemes";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { BatchFormActions } from "./BatchFormActions";
import { deleteLoanDrafts, downloadLoanDrafts, fetchLoans, saveLoanDraft } from "./services/opening-loan-client";
import { loanInputSchema, type LoanDraft } from "./services/opening-loan.schemas";
import { openingDateToInput } from "./services/opening-date";

type Form = { id: string; customerId: number | null; member: string; name: string; schemeId: string; account: string; applicationNo: string; sanction: string; disbursement: string; rate: string; repayType: string; schedule: string; tenure: string; unit: string; emi: string; disbDate: string; principal: string; interest: string; paidUpTo: string; remarks: string };
const empty: Form = { id: "", customerId: null, member: "", name: "", schemeId: "", account: "", applicationNo: "", sanction: "", disbursement: "", rate: "", repayType: "", schedule: "", tenure: "", unit: "", emi: "", disbDate: "", principal: "", interest: "", paidUpTo: "", remarks: "" };
function Group({ title, children }: { title: string; children: ReactNode }) { return <section className="space-y-4 rounded-xl border border-border p-4"><h3 className="text-sm font-semibold text-foreground">{title}</h3>{children}</section>; }
const optional = (s: string) => s.trim() || null;
const code = (s: string) => s ? Number(s) : null;

export function LoanAccountOpening({ visible }: { visible: boolean }) {
  const [form, setForm] = useState<Form>(empty);
  const [schemes, setSchemes] = useState<LoanSchemeSetup[]>([]);
  const [types, setTypes] = useState<ApplOption[]>([]);
  const [schedules, setSchedules] = useState<ApplOption[]>([]);
  const [units, setUnits] = useState<ApplOption[]>([]);
  const [optionStatus, setOptionStatus] = useState<"loading" | "ready" | "error">("loading");
  const [optionReload, setOptionReload] = useState(0);
  const [rows, setRows] = useState<LoanDraft[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState<{ total: number; last_page: number; total_outstanding?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<number[] | null>(null);
  const [error, setError] = useToastText();
  const [notice, setNotice] = useToastText();
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    async function load() {
      try {
        const [repay, schedule, term] = await Promise.all([fetchApplOptions(18), fetchApplOptions(22), fetchApplOptions(7)]);
        const all: LoanSchemeSetup[] = []; let current = 1;
        while (true) {
          const result = await fetchLoanSchemeSetups({ page: current, perPage: 200, isActive: 1 });
          all.push(...result.items.filter((item) => item.isActive));
          if (!result.meta && result.items.length === 200) throw new Error("Loan scheme pagination is unavailable.");
          if (!result.meta || current >= result.meta.lastPage || result.items.length === 0) break;
          current += 1;
        }
        if (!cancelled) { setSchemes(all); setTypes(repay.filter((v) => v.isActive)); setSchedules(schedule.filter((v) => v.isActive)); setUnits(term.filter((v) => v.isActive)); setOptionStatus("ready"); }
      } catch { if (!cancelled) setOptionStatus("error"); }
    }
    void load(); return () => { cancelled = true; };
  }, [visible, optionReload]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false; setLoading(true); setListError("");
    fetchLoans(page, pageSize).then((result) => { if (!cancelled) { setRows(result.data); setMeta(result.meta); } }).catch((err: unknown) => { if (!cancelled) { setRows([]); setMeta(null); setListError(err instanceof Error ? err.message : "Could not load loan drafts."); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, page, pageSize, reload]);
  const set = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function save(event: FormEvent) {
    event.preventDefault(); setError("");
    if (optionStatus !== "ready" || !schemes.some((v) => String(v.id) === form.schemeId) || !types.some((v) => String(v.optCode) === form.repayType) || (form.schedule && !schedules.some((v) => String(v.optCode) === form.schedule)) || (form.unit && !units.some((v) => String(v.optCode) === form.unit))) { setError("Select an active loan scheme and valid loan options."); return; }
    const input = loanInputSchema.safeParse({ ...(form.id ? { opening_id: Number(form.id) } : {}), scheme_id: Number(form.schemeId), customer_id: form.customerId, application_no: optional(form.applicationNo), ref_ac_no: form.account, sanc_amount: form.sanction, disb_date: optional(form.disbDate), loan_amount: form.disbursement, intt_rate: form.rate, repay_type_cd: Number(form.repayType), repay_schedule_cd: code(form.schedule), loan_duration: code(form.tenure), duration_cd: code(form.unit), emi_amount: optional(form.emi), opening_balance_prn: optional(form.principal), opening_balance_intt: optional(form.interest), intt_paid_upto: optional(form.paidUpTo), remarks: optional(form.remarks) });
    if (!input.success) { setError(input.error.issues[0]?.message || "Complete the loan details."); return; }
    setBusy(true);
    try { await saveLoanDraft(input.data); setNotice(form.id ? "Loan draft updated." : "Loan draft added."); setForm(empty); setSelected([]); setPage(1); setReload((v) => v + 1); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save loan draft."); }
    finally { setBusy(false); }
  }
  function edit(row: LoanDraft) {
    setForm({ id: String(row.opening_id), customerId: row.customer_id ?? null, member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""), name: row.customer_name || "", schemeId: row.scheme_id ? String(row.scheme_id) : "", account: row.ref_ac_no || "", applicationNo: row.application_no || "", sanction: row.sanc_amount || "", disbursement: row.loan_amount || "", rate: row.intt_rate || "", repayType: row.repay_type_cd ? String(row.repay_type_cd) : "", schedule: row.repay_schedule_cd ? String(row.repay_schedule_cd) : "", tenure: row.loan_duration ? String(row.loan_duration) : "", unit: row.duration_cd ? String(row.duration_cd) : "", emi: row.emi_amount || "", disbDate: openingDateToInput(row.disb_date), principal: row.opening_balance_prn || "", interest: row.opening_balance_intt || "", paidUpTo: openingDateToInput(row.intt_paid_upto), remarks: row.remarks || "" });
    setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove() {
    if (!pending || busy) return; setBusy(true); setError("");
    try { await deleteLoanDrafts(pending); setNotice("Loan drafts deleted."); setSelected([]); setPending(null); setPage(1); setReload((v) => v + 1); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete loan drafts."); setPending(null); }
    finally { setBusy(false); }
  }
  const columns: DataTableColumn<LoanDraft>[] = [
    { id: "account", header: "Account reference", cell: (r) => r.ref_ac_no || "—" },
    { id: "customer", header: "Customer", cell: (r) => <div><p>{r.customer_name || "—"}</p><p className="text-xs text-muted">{r.customer_code || "—"}</p></div> },
    { id: "scheme", header: "Loan scheme", cell: (r) => r.scheme_name || "—" },
    { id: "sanction", header: "Sanction amount", align: "end", cell: (r) => r.sanc_amount ?? "—" },
    { id: "principal", header: "Principal", align: "end", cell: (r) => r.opening_balance_prn ?? "—" },
    { id: "interest", header: "Interest", align: "end", cell: (r) => r.opening_balance_intt ?? "—" },
  ];
  return <div hidden={!visible} className="space-y-5">
    <Card title="Account Opening Details (Loan Account)"><form onSubmit={(event) => void save(event)} className="space-y-5"><div className="grid gap-4 xl:grid-cols-3">
      <Group title="Basic Details"><OpeningCustomerField label="Customer no." type={2} value={form.member} onSelect={(v) => setForm((current) => ({ ...current, customerId: v.customer_id, member: v.customer_code || `#${v.customer_id}`, name: v.customer_name }))} /><TextField label="Customer name" value={form.name} readOnly /><TextField label="Account reference number" value={form.account} onChange={(v) => set("account", v)} maxLength={25} required /><TextField label="Application number" value={form.applicationNo} onChange={(v) => set("applicationNo", v)} maxLength={255} /><SelectField label="Loan scheme" value={form.schemeId} onChange={(v) => set("schemeId", v)} options={schemes.map((v) => ({ value: String(v.id), label: v.schemeCode ? `${v.schemeCode} · ${v.schemeName}` : v.schemeName }))} placeholder="Select loan scheme" disabled={optionStatus !== "ready"} required /><DateField label="Disbursement date" value={form.disbDate} onChange={(v) => set("disbDate", v)} /></Group>
      <Group title="Loan Details"><TextField label="Sanction amount" value={form.sanction} onChange={(v) => set("sanction", v)} inputMode="decimal" required /><TextField label="Disbursement amount" value={form.disbursement} onChange={(v) => set("disbursement", v)} inputMode="decimal" required /><TextField label="Rate of interest (ROI) %" value={form.rate} onChange={(v) => set("rate", v)} inputMode="decimal" required /><SelectField label="Repayment type" value={form.repayType} onChange={(v) => set("repayType", v)} options={types.map((v) => ({ value: String(v.optCode), label: v.optDescription }))} placeholder="Select repayment type" disabled={optionStatus !== "ready"} required /><SelectField label="Repayment schedule" value={form.schedule} onChange={(v) => set("schedule", v)} options={schedules.map((v) => ({ value: String(v.optCode), label: v.optDescription }))} placeholder="Select repayment schedule" disabled={optionStatus !== "ready"} /><TextField label="Tenure" value={form.tenure} onChange={(v) => set("tenure", v)} inputMode="numeric" inputClassName="pe-32" trailing={<Select aria-label="Tenure unit" value={form.unit} onChange={(v) => set("unit", v)} options={units.map((v) => ({ value: String(v.optCode), label: v.optDescription }))} placeholder="Unit" disabled={optionStatus !== "ready"} searchable={false} clearable={false} size="sm" className="w-28 border-s border-border ps-1 [&_button[aria-haspopup=listbox]]:border-0 [&_button[aria-haspopup=listbox]]:shadow-none" />} /><TextField label="EMI amount" value={form.emi} onChange={(v) => set("emi", v)} inputMode="decimal" /></Group>
      <Group title="Outstanding at Opening"><TextField label="Principal" value={form.principal} onChange={(v) => set("principal", v)} inputMode="decimal" /><TextField label="Interest" value={form.interest} onChange={(v) => set("interest", v)} inputMode="decimal" /><DateField label="Interest paid up to" value={form.paidUpTo} onChange={(v) => set("paidUpTo", v)} /><TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} maxLength={100} /></Group>
    </div>{optionStatus === "error" && <p role="alert" className="text-sm text-rose-600">Could not load loan schemes and options. <button type="button" className="underline" onClick={() => { setOptionStatus("loading"); setOptionReload((v) => v + 1); }}>Try again</button></p>}<PageToast message={error} tone="error" /><PageToast message={notice} /><BatchFormActions editing={Boolean(form.id)} clear={() => { setForm(empty); setError(""); }} busy={busy} /></form></Card>
    <DataTable title="Saved loan drafts" description={`Total: ${meta?.total ?? 0} | Total outstanding: ₹ ${meta?.total_outstanding ?? "0.00"}`} data={rows} columns={columns} getRowKey={(r) => String(r.opening_id)} loading={loading} error={Boolean(listError)} errorMessage={listError} onRetry={() => setReload((v) => v + 1)} emptyTitle="No loan drafts" emptyMessage="Add a loan draft to begin." minHeight="0" minWidth="850px" selection={{ getRowKey: (r) => String(r.opening_id), selectedKeys: selected, onSelectionChange: setSelected }} rowActions={{ render: (r) => <div className="flex gap-1"><Button size="sm" variant="secondary" icon={Pencil} aria-label={`Edit ${r.ref_ac_no || r.opening_id}`} onClick={() => edit(r)} /><Button size="sm" variant="danger" icon={Trash2} aria-label={`Delete ${r.ref_ac_no || r.opening_id}`} onClick={() => setPending([r.opening_id])} /></div> }} pagination={{ page, pageSize, total: meta?.total ?? 0, totalPages: meta?.last_page, pageSizeOptions: [20, 50, 100, 200], onPageChange: (v) => { setPage(v); setSelected([]); }, onPageSizeChange: (v) => { setPageSize(v); setPage(1); setSelected([]); } }} />
    <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="danger" icon={Trash2} disabled={!selected.length || selected.length > 200 || busy} onClick={() => setPending(selected.map(Number))}>Delete selected ({selected.length})</Button><Button variant="secondary" icon={FileDown} disabled={busy} onClick={() => { setError(""); void downloadLoanDrafts(selected.map(Number)).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not export loan drafts.")); }}>{selected.length ? "Export selected CSV" : "Export CSV"}</Button></div>
    <p className="text-sm text-muted">Finalization is not yet available for loan drafts.</p>
    <ConfirmDialog open={pending !== null} onClose={() => { if (!busy) setPending(null); }} onConfirm={remove} actionType="delete" title="Delete loan drafts?" description={`Delete ${pending?.length ?? 0} selected loan draft(s)?`} confirmLabel="Delete" loading={busy} />
  </div>;
}
