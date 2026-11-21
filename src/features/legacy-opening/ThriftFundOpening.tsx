"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { DateField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { BatchFormActions } from "./BatchFormActions";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { OpeningDraftTable } from "./OpeningDraftTable";
import { initialThriftEntry, type ThriftEntry } from "./other-accounts.form";
import { saveDraft } from "./services/opening-deposit-client";
import { openingDateBeforeFinancialYear, openingDateToInput } from "./services/opening-date";
import type { OpeningDraft } from "./services/opening-deposit.schemas";
import type { FinYear } from "@/features/master/fin-year";
import { formatDateDMY } from "@/lib/date-format";

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
const moneyPattern = /^\d{1,8}(?:\.\d{1,2})?$/;
const ratePattern = /^\d{1,3}(?:\.\d{1,2})?$/;

export function ThriftFundOpening({ visible, selectedFinYear }: { visible: boolean; selectedFinYear?: FinYear }) {
  const [form, setForm] = useState<ThriftEntry>(initialThriftEntry);
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
  const set = (key: keyof ThriftEntry, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const clear = () => {
    setForm({ ...initialThriftEntry, date: defaultOpeningDate });
    setError(""); setNotice("");
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.customerId || form.account.trim().length > 15 || !form.date || form.date > todayLocal()) {
      setError("Select a customer and enter a valid opening date that is not in the future. Account reference must be at most 15 characters."); return;
    }
    if (!defaultOpeningDate) {
      setError("The active financial year is unavailable. Reload the page and try again.");
      return;
    }
    if (form.date > defaultOpeningDate) {
      setError(`Opening date must be on or before ${formatDateDMY(defaultOpeningDate)}.`);
      return;
    }
    if (!moneyPattern.test(form.installment.trim()) || Number(form.installment) <= 0 || !moneyPattern.test(form.balance.trim())) {
      setError("Enter a positive monthly installment and a valid opening balance, each with up to two decimal places."); return;
    }
    if (!ratePattern.test(form.rate.trim()) || Number(form.rate) > 100) {
      setError("Interest rate must be between 0 and 100 with up to two decimal places."); return;
    }
    if (form.last && (form.last < form.date || form.last > todayLocal())) {
      setError("Last installment paid up to must be on or after the opening date and no later than today."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      await saveDraft({ ...(form.id ? { opening_id: Number(form.id) } : {}), deposit_type_cd: 5, cust_type_cd: 2, customer_id: form.customerId, op_mode_cd: 1, ref_ac_no: form.account.trim() || null, opening_date: form.date, installment_amount: form.installment.trim(), intt_rate: form.rate.trim(), paid_upto: form.last || null, opening_balance: form.balance.trim(), remarks: form.remarks.trim() || null });
      const updated = Boolean(form.id); clear(); setNotice(updated ? "Draft updated." : "Draft added to the batch."); setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save Thrift Fund draft."); }
    finally { setSaving(false); }
  };

  const edit = (row: OpeningDraft) => {
    const inputDate = openingDateToInput(row.opening_date);
    setForm({ id: String(row.opening_id), customerId: row.customer_id ?? null, member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""), name: row.customer_name || "", account: row.ref_ac_no || "", finYearId: selectedFinYear ? String(selectedFinYear.yearId) : "", date: inputDate, installment: row.installment_amount ?? "", rate: row.intt_rate ?? "", last: openingDateToInput(row.paid_upto), balance: row.opening_balance, remarks: row.remarks || "" });
    setError(""); setNotice(""); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div hidden={!visible} className="space-y-5">
    <Card title="Account Opening Details (Thrift Fund - TF)">
      <form ref={formRef} onSubmit={(event) => void save(event)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="tf-basic">
            <h3 id="tf-basic" className="text-sm font-semibold text-foreground">Basic Details</h3>
            <OpeningCustomerField label="Customer no." type={2} value={form.member} onSelect={(customer) => setForm((current) => ({ ...current, customerId: customer.customer_id, member: customer.customer_code || `#${customer.customer_id}`, name: customer.customer_name }))} />
            <TextField label="Customer name" value={form.name} readOnly required />
            <TextField label="Account reference number" value={form.account} onChange={(v) => set("account", v)} maxLength={15} hint="Maximum 15 characters." />
            <DateField label="Opening date" value={form.date} onChange={(v) => set("date", v)} max={defaultOpeningDate || undefined} disabled={!defaultOpeningDate} hint={defaultOpeningDate ? `On or before ${formatDateDMY(defaultOpeningDate)}` : undefined} required />
            <TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} maxLength={100} />
          </section>
          <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="tf-details">
            <h3 id="tf-details" className="text-sm font-semibold text-foreground">TF Details</h3>
            <TextField label="Monthly installment" value={form.installment} onChange={(v) => set("installment", v)} inputMode="decimal" required />
            <TextField label="Interest rate (p.a.) %" value={form.rate} onChange={(v) => set("rate", v)} inputMode="decimal" required />
            <DateField label="Last installment paid up to" value={form.last} onChange={(v) => set("last", v)} min={form.date || undefined} max={todayLocal()} />
            <TextField label="Opening balance" value={form.balance} onChange={(v) => set("balance", v)} inputMode="decimal" required />
            <TextField label="Balance as on date" value={defaultOpeningDate ? formatDateDMY(defaultOpeningDate) : ""} readOnly />
          </section>
        </div>
        <PageToast message={error} tone="error" /><PageToast message={notice} />
        <BatchFormActions editing={Boolean(form.id)} clear={clear} busy={saving} />
      </form>
    </Card>
    {visible && <OpeningDraftTable type={5} revision={revision} onEdit={edit} />}
  </div>;
}
