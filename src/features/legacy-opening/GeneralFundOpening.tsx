"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { DateField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { BatchFormActions } from "./BatchFormActions";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { OpeningDraftTable } from "./OpeningDraftTable";
import { initialGeneralFundEntry, type GeneralFundEntry } from "./general-fund.form";
import { saveDraft } from "./services/opening-deposit-client";
import { openingDateBeforeFinancialYear, openingDateToInput } from "./services/opening-date";
import type { OpeningDraft } from "./services/opening-deposit.schemas";
import type { FinYear } from "@/features/master/fin-year";
import { formatDateDMY } from "@/lib/date-format";

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function GeneralFundOpening({ visible, selectedFinYear }: { visible: boolean; selectedFinYear?: FinYear }) {
  const [form, setForm] = useState<GeneralFundEntry>(initialGeneralFundEntry);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useToastText();
  const [notice, setNotice] = useToastText();
  const formRef = useRef<HTMLFormElement>(null);
  const defaultOpeningDate = openingDateBeforeFinancialYear(selectedFinYear?.startDate);
  const defaultDateApplied = useRef(false);
  useEffect(() => {
    if (!defaultOpeningDate || defaultDateApplied.current) return;
    defaultDateApplied.current = true;
    setForm((current) => current.date || current.id ? current : { ...current, date: defaultOpeningDate });
  }, [defaultOpeningDate]);
  const set = (key: keyof GeneralFundEntry, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const clear = () => {
    setForm({ ...initialGeneralFundEntry, date: defaultOpeningDate });
    setError(""); setNotice("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.customerId || !form.account.trim() || form.account.trim().length > 15 || !form.date || !/^\d{1,8}(?:\.\d{1,2})?$/.test(form.balance.trim())) {
      setError("Select a customer and enter a valid reference, opening date and balance."); return;
    }
    if (selectedFinYear && form.date && (form.date < defaultOpeningDate || form.date > selectedFinYear.endDate)) {
      setError(`Opening date must be between ${formatDateDMY(defaultOpeningDate)} and ${formatDateDMY(selectedFinYear.endDate)}.`);
      return;
    }
    if (form.rate.trim() && (!/^\d{1,3}(?:\.\d{1,2})?$/.test(form.rate.trim()) || Number(form.rate) > 100)) {
      setError("Interest rate must be between 0 and 100 with up to two decimal places."); return;
    }
    if (form.interestPaidUntil && (form.interestPaidUntil < form.date || form.interestPaidUntil > todayLocal())) {
      setError("Last interest paid up to must be on or after the opening date and no later than today."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      await saveDraft({ ...(form.id ? { opening_id: Number(form.id) } : {}), deposit_type_cd: 4, cust_type_cd: 2, customer_id: form.customerId, op_mode_cd: 1, ref_ac_no: form.account.trim(), opening_date: form.date, opening_balance: form.balance.trim(), intt_rate: form.rate.trim() || null, paid_upto: form.interestPaidUntil || null, remarks: form.remarks.trim() || null });
      const updated = Boolean(form.id); clear(); setNotice(updated ? "Draft updated." : "Draft added to the batch."); setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save General Fund draft."); }
    finally { setSaving(false); }
  };

  const edit = (row: OpeningDraft) => {
    const inputDate = openingDateToInput(row.opening_date);
    setForm({ id: String(row.opening_id), customerId: row.customer_id ?? null, member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""), name: row.customer_name || "", account: row.ref_ac_no || "", finYearId: selectedFinYear ? String(selectedFinYear.yearId) : "", date: inputDate, balance: row.opening_balance, rate: row.intt_rate ?? "", interestPaidUntil: openingDateToInput(row.paid_upto), remarks: row.remarks || "" });
    setError(""); setNotice(""); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div hidden={!visible} className="space-y-5">
    <Card title="Account Opening Details (General Fund - GF)">
      <form ref={formRef} onSubmit={(event) => void save(event)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="gf-basic">
            <h3 id="gf-basic" className="text-sm font-semibold text-foreground">Basic Details</h3>
            <OpeningCustomerField label="Customer no." type={2} value={form.member} onSelect={(customer) => setForm((current) => ({ ...current, customerId: customer.customer_id, member: customer.customer_code || `#${customer.customer_id}`, name: customer.customer_name }))} />
            <TextField label="Customer name" value={form.name} readOnly required />
            <TextField label="Account reference number" value={form.account} onChange={(v) => set("account", v)} maxLength={15} hint="Maximum 15 characters." required />
            <DateField label="Opening date" value={form.date} onChange={(v) => set("date", v)} min={defaultOpeningDate || undefined} max={selectedFinYear?.endDate} hint={selectedFinYear ? `Range: ${formatDateDMY(defaultOpeningDate)} – ${formatDateDMY(selectedFinYear.endDate)}` : undefined} required />
            <TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} maxLength={100} />
          </section>
          <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="gf-details">
            <h3 id="gf-details" className="text-sm font-semibold text-foreground">GF Details</h3>
            <TextField label="Opening balance" value={form.balance} onChange={(v) => set("balance", v)} inputMode="decimal" required />
            <TextField label="Interest rate (p.a.) %" value={form.rate} onChange={(v) => set("rate", v)} inputMode="decimal" />
            <DateField label="Last interest paid up to" value={form.interestPaidUntil} onChange={(v) => set("interestPaidUntil", v)} min={form.date || undefined} max={todayLocal()} />
          </section>
        </div>
        <PageToast message={error} tone="error" /><PageToast message={notice} />
        <BatchFormActions editing={Boolean(form.id)} clear={clear} busy={saving} />
      </form>
    </Card>
    {visible && <OpeningDraftTable type={4} revision={revision} onEdit={edit} />}
  </div>;
}
