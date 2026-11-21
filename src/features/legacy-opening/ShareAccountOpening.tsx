"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { DateField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { BatchFormActions } from "./BatchFormActions";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { OpeningDraftTable } from "./OpeningDraftTable";
import { initialShareEntry, shareAmountPaise, type ShareEntry } from "./share.form";
import { saveDraft } from "./services/opening-deposit-client";
import { openingDateBeforeFinancialYear, openingDateToInput } from "./services/opening-date";
import type { OpeningDraft } from "./services/opening-deposit.schemas";
import type { FinYear } from "@/features/master/fin-year";
import { formatDateDMY } from "@/lib/date-format";

export function ShareAccountOpening({ visible, selectedFinYear }: { visible: boolean; selectedFinYear?: FinYear }) {
  const [form, setForm] = useState<ShareEntry>(initialShareEntry);
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
  const set = (key: keyof ShareEntry, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const clear = () => {
    setForm({ ...initialShareEntry, date: defaultOpeningDate });
    setError(""); setNotice("");
  };
  const amountPaise = shareAmountPaise(form.shares, form.faceValue.trim());

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.customerId || form.account.trim().length > 15 || !form.date) {
      setError("Select a customer and enter a valid opening date. Account reference must be at most 15 characters."); return;
    }
    if (!defaultOpeningDate) {
      setError("The active financial year is unavailable. Reload the page and try again.");
      return;
    }
    if (form.date > defaultOpeningDate) {
      setError(`Opening date must be on or before ${formatDateDMY(defaultOpeningDate)}.`);
      return;
    }
    if (amountPaise == null) {
      setError("Enter 1 to 99,999,999 shares and a positive face value up to 999,999.99. The share amount cannot exceed 99,999,999.99."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      await saveDraft({ ...(form.id ? { opening_id: Number(form.id) } : {}), deposit_type_cd: 3, cust_type_cd: 2, customer_id: form.customerId, op_mode_cd: 1, ref_ac_no: form.account.trim() || null, opening_date: form.date, no_of_shares: Number(form.shares), face_value: form.faceValue.trim(), remarks: form.remarks.trim() || null });
      const updated = Boolean(form.id); clear(); setNotice(updated ? "Draft updated." : "Draft added to the batch."); setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save Share draft."); }
    finally { setSaving(false); }
  };

  const edit = (row: OpeningDraft) => {
    const inputDate = openingDateToInput(row.opening_date);
    setForm({ id: String(row.opening_id), customerId: row.customer_id ?? null, member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""), name: row.customer_name || "", account: row.ref_ac_no || "", finYearId: selectedFinYear ? String(selectedFinYear.yearId) : "", date: inputDate, shares: row.no_of_shares == null ? "" : String(row.no_of_shares), faceValue: row.face_value ?? "", remarks: row.remarks || "" });
    setError(""); setNotice(""); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div hidden={!visible} className="space-y-5">
    <Card title="Account Opening Details (Share Account)">
      <form ref={formRef} onSubmit={(event) => void save(event)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="share-basic">
            <h3 id="share-basic" className="text-sm font-semibold text-foreground">Basic Details</h3>
            <OpeningCustomerField label="Customer no." type={2} value={form.member} onSelect={(customer) => setForm((current) => ({ ...current, customerId: customer.customer_id, member: customer.customer_code || `#${customer.customer_id}`, name: customer.customer_name }))} />
            <TextField label="Customer name" value={form.name} readOnly required />
            <TextField label="Account reference number" value={form.account} onChange={(v) => set("account", v)} maxLength={15} hint="Maximum 15 characters." />
            <DateField label="Opening date" value={form.date} onChange={(v) => set("date", v)} max={defaultOpeningDate || undefined} disabled={!defaultOpeningDate} hint={defaultOpeningDate ? `On or before ${formatDateDMY(defaultOpeningDate)}` : undefined} required />
            <TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} maxLength={100} />
          </section>
          <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="share-details">
            <h3 id="share-details" className="text-sm font-semibold text-foreground">Share Details</h3>
            <TextField label="No. of shares" value={form.shares} onChange={(v) => set("shares", v)} inputMode="numeric" maxLength={8} required />
            <TextField label="Face value (₹)" value={form.faceValue} onChange={(v) => set("faceValue", v)} inputMode="decimal" required />
            <TextField label="Share amount" value={amountPaise == null ? "" : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountPaise / 100)} readOnly />
            <TextField label="Balance as on date" value={defaultOpeningDate ? formatDateDMY(defaultOpeningDate) : ""} readOnly />
          </section>
        </div>
        <PageToast message={error} tone="error" /><PageToast message={notice} />
        <BatchFormActions editing={Boolean(form.id)} clear={clear} busy={saving} />
      </form>
    </Card>
    {visible && <OpeningDraftTable type={3} revision={revision} onEdit={edit} />}
  </div>;
}
