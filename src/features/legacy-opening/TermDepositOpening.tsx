"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BatchFormActions } from "./BatchFormActions";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { initialTermEntry, type TermEntry } from "./term-deposit.form";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { OpeningDraftTable } from "./OpeningDraftTable";
import { saveDraft } from "./services/opening-deposit-client";
import { openingDateBeforeFinancialYear, openingDateToInput } from "./services/opening-date";
import type { OpeningDraft } from "./services/opening-deposit.schemas";
import { TenureSlabs } from "./TenureSlabs";
import { fetchDepositProductSchemes } from "@/features/deposits/savings/services/deposit-account-client";
import { OPT_MATURITY_INSTRUCTION, TERM_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import type { DepositProductSchemeGroup } from "@/features/deposits/savings/types/deposit-account.types";
import { fetchApplOptions, type ApplOption } from "@/features/master/appl-options";
import type { FinYear } from "@/features/master/fin-year";
import { formatDateDMY } from "@/lib/date-format";

const OPT_INTEREST_PAYOUT = 10;

export function TermDepositOpening({ visible, selectedFinYear }: { visible: boolean; selectedFinYear?: FinYear }) {
  const [form, setForm] = useState<TermEntry>(initialTermEntry);
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
  const [groups, setGroups] = useState<DepositProductSchemeGroup[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [reload, setReload] = useState(0);
  const [maturityOptions, setMaturityOptions] = useState<ApplOption[]>([]);
  const [payoutOptions, setPayoutOptions] = useState<ApplOption[]>([]);
  const [termOptions, setTermOptions] = useState<ApplOption[]>([]);
  const [maturityStatus, setMaturityStatus] = useState<"loading" | "ready" | "error">("loading");
  const [maturityReload, setMaturityReload] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    Promise.all([fetchApplOptions(OPT_MATURITY_INSTRUCTION), fetchApplOptions(OPT_INTEREST_PAYOUT), fetchApplOptions(7)])
      .then(([instructions, payouts, terms]) => { if (!cancelled) { setMaturityOptions(instructions.filter((item) => item.isActive)); setPayoutOptions(payouts.filter((item) => item.isActive)); setTermOptions(terms.filter((item) => item.isActive)); setMaturityStatus("ready"); } })
      .catch(() => { if (!cancelled) setMaturityStatus("error"); });
    return () => { cancelled = true; };
  }, [visible, maturityReload]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetchDepositProductSchemes(TERM_DEPOSIT_TYPE)
      .then((result) => {
        if (cancelled) return;
        setGroups(result.filter((group) => group.depositTypeCd === TERM_DEPOSIT_TYPE));
        setCatalogStatus("ready");
      })
      .catch(() => { if (!cancelled) setCatalogStatus("error"); });
    return () => { cancelled = true; };
  }, [visible, reload]);
  const productOptions = Array.from(new Map(groups.filter((group) => group.prodTypeCd > 0).map((group) => [String(group.prodTypeCd), { value: String(group.prodTypeCd), label: group.prodTypeDesc, disabled: !groups.some((candidate) => candidate.prodTypeCd === group.prodTypeCd && candidate.schemes.some((scheme) => scheme.isActive !== false)) }] as const)).values());
  const schemeOptions = Array.from(new Map(groups.filter((group) => String(group.prodTypeCd) === form.productId).flatMap((group) => group.schemes.filter((scheme) => scheme.isActive !== false).map((scheme) => [String(scheme.schemeId), { value: String(scheme.schemeId), label: scheme.schemeCode ? `${scheme.schemeCode} · ${scheme.schemeName}` : scheme.schemeName }] as const))).values());
  const set = (key: keyof TermEntry, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const clear = () => {
    setForm({ ...initialTermEntry, date: defaultOpeningDate, member: "", name: "", account: "", amount: "", openingBalance: "", rate: "", tenure: "", maturity: "", maturityAmount: "" });
    setError(""); setNotice("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (form.account.trim().length > 15) { setError("Account reference number must be 15 characters or fewer."); return; }
    const validNumber = (value: string) => /^\d+(?:\.\d+)?$/.test(value.trim());
    if (catalogStatus !== "ready" || maturityStatus !== "ready" || !form.customerId || !form.account.trim() || !productOptions.some((product) => product.value === form.productId && !product.disabled) || !schemeOptions.some((scheme) => scheme.value === form.schemeId) || !payoutOptions.some((option) => String(option.optCode) === form.payout) || (form.maturityInstruction && !maturityOptions.some((option) => String(option.optCode) === form.maturityInstruction)) || !form.date || !form.maturity || form.maturity <= form.date || !validNumber(form.amount) || Number(form.amount) <= 0 || !/^\d{1,8}(?:\.\d{1,2})?$/.test(form.openingBalance.trim()) || !validNumber(form.rate) || Number(form.rate) > 100 || !/^\d+$/.test(form.tenure) || Number(form.tenure) <= 0 || !termOptions.some((option) => String(option.optCode) === form.tenureUnit) || !validNumber(form.maturityAmount) || Number(form.maturityAmount) <= 0) {
      setError("Complete the required fields with valid amounts, tenure and dates.");
      return;
    }
    if (selectedFinYear && form.date && (form.date < defaultOpeningDate || form.date > selectedFinYear.endDate)) {
      setError(`Opening date must be between ${formatDateDMY(defaultOpeningDate)} and ${formatDateDMY(selectedFinYear.endDate)}.`);
      return;
    }
    setSaving(true); setError("");
    try {
      await saveDraft({ ...(form.id ? { opening_id: Number(form.id) } : {}), deposit_type_cd: 2, cust_type_cd: 2, customer_id: form.customerId, scheme_id: Number(form.schemeId), prod_type_cd: Number(form.productId), op_mode_cd: 1, ref_ac_no: form.account.trim(), opening_date: form.date, opening_balance: form.openingBalance.trim(), tenure: Number(form.tenure), term_cd: Number(form.tenureUnit), installment_amount: form.amount.trim(), intt_rate: form.rate.trim(), intt_payout_cd: Number(form.payout), matu_ins_cd: form.maturityInstruction ? Number(form.maturityInstruction) : null, maturity_date: form.maturity, maturity_amt: form.maturityAmount.trim(), paid_upto: form.paidUpTo || null, remarks: form.remarks.trim() || null });
      const updated = Boolean(form.id); clear(); setNotice(updated ? "Draft updated." : "Draft added to the batch."); setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save draft."); }
    finally { setSaving(false); }
  };
  function edit(row: OpeningDraft) {
    const inputDate = openingDateToInput(row.opening_date);
    setForm({ ...initialTermEntry, id: String(row.opening_id), customerId: row.customer_id ?? null, member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""), name: row.customer_name || "", account: row.ref_ac_no || "", productId: row.prod_type_cd == null ? "" : String(row.prod_type_cd), product: row.prod_type_desc || "", schemeId: row.scheme_id == null ? "" : String(row.scheme_id), scheme: row.scheme_name || "", date: inputDate, openingBalance: row.opening_balance, amount: row.installment_amount || "", rate: row.intt_rate || "", tenure: row.tenure == null ? "" : String(row.tenure), tenureUnit: row.term_cd == null ? "" : String(row.term_cd), payout: row.intt_payout_cd == null ? "" : String(row.intt_payout_cd), maturityInstruction: row.matu_ins_cd == null ? "" : String(row.matu_ins_cd), maturity: openingDateToInput(row.maturity_date), maturityAmount: row.maturity_amt || "", paidUpTo: openingDateToInput(row.paid_upto), remarks: row.remarks || "" });
    setError(""); setNotice(""); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div hidden={!visible} className="space-y-5">
      <Card title="Account Opening Details (Term Deposit)">
        <form ref={formRef} onSubmit={(event) => void save(event)} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="term-basic">
              <h3 id="term-basic" className="text-sm font-semibold text-foreground">Basic Details</h3>
              <OpeningCustomerField label="Customer no." type={2} value={form.member} onSelect={(item) => setForm((current) => ({ ...current, customerId: item.customer_id, member: item.customer_code || `#${item.customer_id}`, name: item.customer_name }))} />
              <TextField label="Customer name" value={form.name} readOnly />
              <TextField label="Account reference number" value={form.account} onChange={(v) => set("account", v)} maxLength={15} hint="Maximum 15 characters." required />
              <SelectField label="Deposit product" value={form.productId ?? ""} onChange={(value) => setForm((current) => ({ ...current, productId: value, product: productOptions.find((product) => product.value === value)?.label ?? "", schemeId: "", scheme: "", tenureUnit: "", tenureUnitLabel: "", slabId: "", rate: "" }))} options={productOptions} placeholder={catalogStatus === "ready" ? "Select deposit product" : "Loading products..."} emptyMessage="No term deposit products available" hint={productOptions.some((product) => product.disabled) ? "Products without an active scheme are unavailable." : undefined} disabled={catalogStatus !== "ready"} searchable required />
              <SelectField label="Scheme" value={form.schemeId ?? ""} onChange={(value) => setForm((current) => ({ ...current, schemeId: value, scheme: schemeOptions.find((scheme) => scheme.value === value)?.label ?? "", tenureUnit: "", tenureUnitLabel: "", slabId: "", rate: "" }))} options={schemeOptions} placeholder={form.productId ? "Select scheme" : "Select a product first"} emptyMessage="No schemes available for this product" disabled={catalogStatus !== "ready" || !form.productId} searchable required />
              {catalogStatus === "error" && <p role="alert" className="text-sm text-rose-600">Could not load deposit products and schemes. <button type="button" className="underline" onClick={() => { setCatalogStatus("loading"); setReload((current) => current + 1); }}>Try again</button></p>}
              <DateField label="Opening date" value={form.date} onChange={(v) => set("date", v)} min={defaultOpeningDate || undefined} max={selectedFinYear?.endDate} hint={selectedFinYear ? `Range: ${formatDateDMY(defaultOpeningDate)} – ${formatDateDMY(selectedFinYear.endDate)}` : undefined} required />
            </section>
            <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="term-deposit">
              <h3 id="term-deposit" className="text-sm font-semibold text-foreground">Deposit Details</h3>
              <TextField label="Installment / Deposit amount" value={form.amount} onChange={(v) => set("amount", v)} inputMode="decimal" required />
              <TextField label="Opening balance" value={form.openingBalance} onChange={(v) => set("openingBalance", v)} inputMode="decimal" required />
              <TenureSlabs key={form.schemeId || "none"} schemeId={form.schemeId} value={form.tenure} unit={form.tenureUnit} unitCatalog={termOptions} slabId={form.slabId} onChange={(v) => set("tenure", v)} onUnitChange={(unit, label) => setForm((current) => ({ ...current, tenureUnit: unit, tenureUnitLabel: label, slabId: "", rate: current.slabId ? "" : current.rate }))} onSlabSelect={(slab) => setForm((current) => ({ ...current, tenureUnit: String(slab.termCd), tenureUnitLabel: slab.termDesc || `Term ${slab.termCd}`, slabId: String(slab.id), rate: String(slab.roi) }))} />
              <TextField label="Interest rate (p.a.) %" value={form.rate} onChange={(v) => set("rate", v)} inputMode="decimal" required />
              <SelectField label="Interest payout" value={form.payout} onChange={(v) => set("payout", v)} options={payoutOptions.map((option) => ({ value: String(option.optCode), label: option.optDescription }))} placeholder={maturityStatus === "loading" ? "Loading interest payout options..." : "Select interest payout"} disabled={maturityStatus !== "ready"} required />
            </section>
            <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="term-maturity">
              <h3 id="term-maturity" className="text-sm font-semibold text-foreground">Maturity Details</h3>
              <DateField label="Maturity date" value={form.maturity} onChange={(v) => set("maturity", v)} required />
              <TextField label="Maturity amount" value={form.maturityAmount} onChange={(v) => set("maturityAmount", v)} inputMode="decimal" required hint="Enter the amount from the existing record." />
              <DateField label="Interest paid up to" value={form.paidUpTo} onChange={(v) => set("paidUpTo", v)} />
              <p className="text-xs text-muted">For MIS, enter the date through which interest was paid.</p>
              <SelectField label="Maturity instruction" value={form.maturityInstruction} onChange={(v) => set("maturityInstruction", v)} options={maturityOptions.map((option) => ({ value: String(option.optCode), label: option.optDescription }))} placeholder={maturityStatus === "loading" ? "Loading maturity instructions..." : "Select maturity instruction"} emptyMessage="No maturity instructions available" disabled={maturityStatus !== "ready"} />
              {form.maturityInstruction === "4" && <p className="text-xs text-muted">Finalization requires exactly one active savings account for this customer and branch.</p>}
              {maturityStatus === "error" && <p role="alert" className="text-sm text-rose-600">Could not load payout and maturity options. <button type="button" className="underline" onClick={() => { setMaturityStatus("loading"); setMaturityReload((current) => current + 1); }}>Try again</button></p>}
              <TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} maxLength={100} />
            </section>
          </div>
          <PageToast message={error} tone="error" />
          <PageToast message={notice} />
          <BatchFormActions editing={Boolean(form.id)} clear={clear} busy={saving} />
        </form>
      </Card>
      {visible && <OpeningDraftTable type={2} revision={revision} onEdit={edit} />}
    </div>
  );
}
