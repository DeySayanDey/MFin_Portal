"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BatchFormActions } from "./BatchFormActions";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { calculationTermCode, estimateMaturityAmount, initialTermEntry, type TermEntry } from "./term-deposit.form";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { OpeningDraftTable } from "./OpeningDraftTable";
import { saveDraft } from "./services/opening-deposit-client";
import { openingDateBeforeFinancialYear, openingDateToInput, termMaturityDate } from "./services/opening-date";
import type { OpeningDraft } from "./services/opening-deposit.schemas";
import { TenureSlabs } from "./TenureSlabs";
import { fetchDepositProductSchemes } from "@/features/deposits/savings/services/deposit-account-client";
import { OPT_MATURITY_INSTRUCTION, TERM_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import type { DepositProductSchemeGroup } from "@/features/deposits/savings/types/deposit-account.types";
import { fetchApplOptions, type ApplOption } from "@/features/master/appl-options";
import type { FinYear } from "@/features/master/fin-year";
import { formatDateDMY } from "@/lib/date-format";

const OPT_INTEREST_PAYOUT = 10;
const OPT_TENURE_UNIT = 7;

export function TermDepositOpening({ visible, selectedFinYear }: { visible: boolean; selectedFinYear?: FinYear }) {
  const [form, setForm] = useState<TermEntry>(initialTermEntry);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useToastText();
  const [notice, setNotice] = useToastText();
  const formRef = useRef<HTMLFormElement>(null);
  const maturityDateEdited = useRef(false);
  const maturityAmountEdited = useRef(false);
  const defaultOpeningDate = openingDateBeforeFinancialYear(selectedFinYear?.startDate);
  const balanceAsOnDate = form.asOnDate || defaultOpeningDate;
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
  const calculationUnit = calculationTermCode(
    form.tenureUnit || termOptions.find((option) => String(option.optCode) === form.tenureUnit)?.optDescription || ""
  );
  const [maturityStatus, setMaturityStatus] = useState<"loading" | "ready" | "error">("loading");
  const [maturityReload, setMaturityReload] = useState(0);

  useEffect(() => {
    if (maturityDateEdited.current) return;
    const maturity = termMaturityDate(form.date, form.tenure, calculationUnit);
    setForm((current) => current.maturity === maturity ? current : { ...current, maturity });
  }, [form.date, form.tenure, calculationUnit]);

  useEffect(() => {
    if (maturityAmountEdited.current) return;
    const complete = form.productId && form.schemeId && form.date && form.amount && Number(form.amount) > 0 && form.payout && termMaturityDate(form.date, form.tenure, calculationUnit);
    const maturityAmount = complete ? estimateMaturityAmount(form.openingBalance, form.rate, form.tenure, calculationUnit) : "";
    setForm((current) => current.maturityAmount === maturityAmount ? current : { ...current, maturityAmount });
  }, [form.productId, form.schemeId, form.date, form.amount, form.openingBalance, form.rate, form.tenure, calculationUnit, form.payout]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    Promise.all([fetchApplOptions(OPT_MATURITY_INSTRUCTION), fetchApplOptions(OPT_INTEREST_PAYOUT), fetchApplOptions(OPT_TENURE_UNIT)])
      .then(([instructions, payouts, terms]) => {
        if (!cancelled) {
          setMaturityOptions(instructions.filter((item) => item.isActive));
          setPayoutOptions(payouts.filter((item) => item.isActive));
          setTermOptions(terms.filter((item) => item.isActive));
          setMaturityStatus("ready");
        }
      })
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

  const productOptions = Array.from(
    new Map(
      groups
        .filter((group) => group.prodTypeCd > 0)
        .map((group) => [
          String(group.prodTypeCd),
          {
            value: String(group.prodTypeCd),
            label: group.prodTypeDesc,
            disabled: !groups.some((candidate) => candidate.prodTypeCd === group.prodTypeCd && candidate.schemes.some((scheme) => scheme.isActive !== false)),
          },
        ] as const)
    ).values()
  );

  const schemeOptions = Array.from(
    new Map(
      groups
        .filter((group) => String(group.prodTypeCd) === form.productId)
        .flatMap((group) =>
          group.schemes
            .filter((scheme) => scheme.isActive !== false)
            .map((scheme) => [
              String(scheme.schemeId),
              {
                value: String(scheme.schemeId),
                label: scheme.schemeCode ? `${scheme.schemeCode} · ${scheme.schemeName}` : scheme.schemeName,
              },
            ] as const)
        )
    ).values()
  );

  const set = (key: keyof TermEntry, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const clear = () => {
    maturityDateEdited.current = false;
    maturityAmountEdited.current = false;
    setForm({
      ...initialTermEntry,
      date: defaultOpeningDate,
      asOnDate: defaultOpeningDate,
      member: "",
      name: "",
      account: "",
      amount: "",
      openingBalance: "",
      rate: "",
      tenure: "",
      tenureUnit: "",
      slabId: "",
      maturity: "",
      maturityAmount: "",
      paidUpTo: "",
      remarks: "",
    });
    setError("");
    setNotice("");
  };

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (!form.account.trim()) {
      setError("Account reference number is required.");
      return;
    }
    if (form.account.trim().length > 15) {
      setError("Account reference number must be 15 characters or fewer.");
      return;
    }
    if (!form.customerId) {
      setError("Select an active member.");
      return;
    }
    if (catalogStatus !== "ready" || !form.productId || !form.schemeId) {
      setError("Select an active deposit product and scheme.");
      return;
    }
    const productValid = productOptions.some((product) => product.value === form.productId && !product.disabled);
    const schemeValid = schemeOptions.some((scheme) => scheme.value === form.schemeId);
    if (!productValid || !schemeValid) {
      setError("Selected product or scheme is unavailable.");
      return;
    }
    if (!defaultOpeningDate) {
      setError("The active financial year is unavailable. Reload the page and try again.");
      return;
    }
    if (!balanceAsOnDate || balanceAsOnDate > defaultOpeningDate || balanceAsOnDate > todayYmd) {
      setError("The balance as-on date must be before the active financial year and no later than today.");
      return;
    }
    if (!form.date) {
      setError("Opening date is required.");
      return;
    }
    if (form.date > balanceAsOnDate) {
      setError(`Opening date must be on or before ${formatDateDMY(balanceAsOnDate)}.`);
      return;
    }

    const validNumber = (value: string) => /^\d+(?:\.\d+)?$/.test(value.trim());
    const validMoney = (value: string) => /^\d{1,8}(?:\.\d{1,2})?$/.test(value.trim());

    if (!validNumber(form.amount) || Number(form.amount) <= 0) {
      setError("Installment / Deposit amount must be a positive number.");
      return;
    }
    if (!validMoney(form.openingBalance) || Number(form.openingBalance) < 0) {
      setError("Opening balance must be between 0 and 99,999,999.99.");
      return;
    }
    if (!/^\d+$/.test(form.tenure) || Number(form.tenure) <= 0) {
      setError("Enter a positive tenure.");
      return;
    }
    const unitCd = Number(form.tenureUnit);
    if (!termOptions.some((option) => option.optCode === unitCd)) {
      setError("Select a valid tenure unit.");
      return;
    }
    const termLimits: Record<number, number> = { 1: 120, 2: 17, 3: 120, 4: 50 };
    if (!termLimits[unitCd] || Number(form.tenure) > termLimits[unitCd]) {
      const unitLabel = termOptions.find((o) => o.optCode === unitCd)?.optDescription || "units";
      setError(`Tenure cannot exceed ${termLimits[unitCd]} ${unitLabel}.`);
      return;
    }
    if (Number(form.productId) === 2 && (unitCd === 1 || unitCd === 2)) {
      setError("Recurring Deposit (RD) tenure must be in months or years.");
      return;
    }
    const validRate = (v: string) => /^\d{1,3}(?:\.\d{1,2})?$/.test(v.trim()) && Number(v) <= 100;
    if (!validRate(form.rate)) {
      setError("Interest rate must be between 0 and 100 with at most 2 decimal places.");
      return;
    }
    if (!form.payout || !payoutOptions.some((option) => String(option.optCode) === form.payout)) {
      setError("Select an interest payout frequency.");
      return;
    }
    if (!form.maturity || form.maturity <= form.date) {
      setError("Maturity date must be later than the opening date.");
      return;
    }
    if (!validMoney(form.maturityAmount) || Number(form.maturityAmount) <= 0) {
      setError("Maturity amount must be a positive number.");
      return;
    }
    if (form.paidUpTo) {
      if (form.paidUpTo < form.date) {
        setError("Interest paid up to date cannot be before the opening date.");
        return;
      }
      if (form.paidUpTo > form.maturity) {
        setError("Interest paid up to date cannot be after the maturity date.");
        return;
      }
      if (form.paidUpTo > todayYmd) {
        setError("Interest paid up to date cannot be in the future.");
        return;
      }
    }
    if (form.maturityInstruction && !maturityOptions.some((option) => String(option.optCode) === form.maturityInstruction)) {
      setError("Select a valid maturity instruction.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveDraft({
        ...(form.id ? { opening_id: Number(form.id) } : {}),
        deposit_type_cd: 2,
        cust_type_cd: 2,
        customer_id: form.customerId,
        scheme_id: Number(form.schemeId),
        prod_type_cd: Number(form.productId),
        op_mode_cd: 1,
        ref_ac_no: form.account.trim(),
        opening_date: form.date,
        as_on_date: balanceAsOnDate,
        opening_balance: form.openingBalance.trim(),
        tenure: Number(form.tenure),
        term_cd: unitCd,
        installment_amount: form.amount.trim(),
        intt_rate: form.rate.trim(),
        intt_payout_cd: Number(form.payout),
        matu_ins_cd: form.maturityInstruction ? Number(form.maturityInstruction) : null,
        maturity_date: form.maturity,
        maturity_amt: form.maturityAmount.trim(),
        paid_upto: form.paidUpTo || null,
        remarks: form.remarks.trim() || null,
      });
      const updated = Boolean(form.id);
      clear();
      setNotice(updated ? "Term deposit draft updated." : "Term deposit draft added to the batch.");
      setRevision((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save draft.");
    } finally {
      setSaving(false);
    }
  };

  function edit(row: OpeningDraft) {
    maturityDateEdited.current = true;
    maturityAmountEdited.current = true;
    const inputDate = openingDateToInput(row.opening_date);
    setForm({
      ...initialTermEntry,
      id: String(row.opening_id),
      customerId: row.customer_id ?? null,
      member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""),
      name: row.customer_name || "",
      account: row.ref_ac_no || "",
      productId: row.prod_type_cd == null ? "" : String(row.prod_type_cd),
      product: row.prod_type_desc || "",
      schemeId: row.scheme_id == null ? "" : String(row.scheme_id),
      scheme: row.scheme_name || "",
      date: inputDate,
      asOnDate: openingDateToInput(row.as_on_date),
      openingBalance: row.opening_balance,
      amount: row.installment_amount || "",
      rate: row.intt_rate || "",
      tenure: row.tenure == null ? "" : String(row.tenure),
      tenureUnit: row.term_cd == null ? "" : String(row.term_cd),
      payout: row.intt_payout_cd == null ? "" : String(row.intt_payout_cd),
      maturityInstruction: row.matu_ins_cd == null ? "" : String(row.matu_ins_cd),
      maturity: openingDateToInput(row.maturity_date),
      maturityAmount: row.maturity_amt || "",
      paidUpTo: openingDateToInput(row.paid_upto),
      remarks: row.remarks || "",
    });
    setError("");
    setNotice("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div hidden={!visible} className="space-y-5">
      <Card title="Account Opening Details (Term Deposit)">
        <form ref={formRef} onSubmit={(event) => void save(event)} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-3">
            <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="term-basic">
              <h3 id="term-basic" className="text-sm font-semibold text-foreground">Basic Details</h3>
              <OpeningCustomerField
                label="Customer no."
                type={2}
                value={form.member}
                onSelect={(item) =>
                  setForm((current) => ({
                    ...current,
                    customerId: item.customer_id,
                    member: item.customer_code || `#${item.customer_id}`,
                    name: item.customer_name,
                  }))
                }
              />
              <TextField label="Customer name" value={form.name} readOnly />
              <TextField
                label="Account reference number"
                value={form.account}
                onChange={(v) => set("account", v)}
                maxLength={15}
                hint="Legacy account reference, maximum 15 characters."
                required
              />
              <SelectField
                label="Deposit product"
                value={form.productId ?? ""}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    productId: value,
                    product: productOptions.find((product) => product.value === value)?.label ?? "",
                    schemeId: "",
                    scheme: "",
                    tenureUnit: "",
                    tenureUnitLabel: "",
                    slabId: "",
                    rate: "",
                    tenure: "",
                    maturity: "",
                    maturityAmount: "",
                  }))
                }
                options={productOptions}
                placeholder={catalogStatus === "ready" ? "Select deposit product" : "Loading products..."}
                emptyMessage="No term deposit products available"
                hint={productOptions.some((product) => product.disabled) ? "Products without an active scheme are unavailable." : undefined}
                disabled={catalogStatus !== "ready"}
                searchable
                required
              />
              <SelectField
                label="Scheme"
                value={form.schemeId ?? ""}
                onChange={(value) => {
                  const selectedScheme = groups
                    .find((group) => String(group.prodTypeCd) === form.productId)
                    ?.schemes.find((scheme) => String(scheme.schemeId) === value);
                  setForm((current) => ({
                    ...current,
                    schemeId: value,
                    scheme: selectedScheme?.schemeName || "",
                    tenureUnit: "",
                    tenureUnitLabel: "",
                    slabId: "",
                    rate: selectedScheme?.roiPercent != null ? String(selectedScheme.roiPercent) : "",
                    payout: selectedScheme?.inttPayoutCd != null ? String(selectedScheme.inttPayoutCd) : current.payout,
                    tenure: "",
                    maturity: "",
                    maturityAmount: "",
                  }));
                }}
                options={schemeOptions}
                placeholder={form.productId ? "Select scheme" : "Select a product first"}
                emptyMessage="No schemes available for this product"
                disabled={catalogStatus !== "ready" || !form.productId}
                searchable
                required
              />
              {catalogStatus === "error" && (
                <p role="alert" className="text-sm text-rose-600">
                  Could not load deposit products and schemes.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setCatalogStatus("loading");
                      setReload((current) => current + 1);
                    }}
                  >
                    Try again
                  </button>
                </p>
              )}
              <DateField
                label="Opening date"
                value={form.date}
                onChange={(v) => set("date", v)}
                max={balanceAsOnDate || defaultOpeningDate || undefined}
                disabled={!defaultOpeningDate}
                hint={balanceAsOnDate ? `On or before ${formatDateDMY(balanceAsOnDate)}` : undefined}
                required
              />
            </section>
            <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="term-deposit">
              <h3 id="term-deposit" className="text-sm font-semibold text-foreground">Deposit Details</h3>
              <TextField label="Installment / Deposit amount" value={form.amount} onChange={(v) => set("amount", v)} inputMode="decimal" required />
              <TextField label="Opening balance" value={form.openingBalance} onChange={(v) => set("openingBalance", v)} inputMode="decimal" required />
              <DateField
                label="Balance as on date"
                value={balanceAsOnDate}
                onChange={(v) => set("asOnDate", v)}
                min={form.date || undefined}
                max={defaultOpeningDate && defaultOpeningDate < todayYmd ? defaultOpeningDate : todayYmd}
                disabled={!defaultOpeningDate}
                hint={defaultOpeningDate ? `On or before ${formatDateDMY(defaultOpeningDate)}` : undefined}
                required
              />
              {form.asOnDate && defaultOpeningDate && form.asOnDate !== defaultOpeningDate ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => set("asOnDate", defaultOpeningDate)}>
                  Reset to {formatDateDMY(defaultOpeningDate)}
                </Button>
              ) : null}
              <TenureSlabs
                key={form.schemeId || "none"}
                schemeId={form.schemeId}
                prodTypeCd={form.productId ? Number(form.productId) : undefined}
                value={form.tenure}
                unit={form.tenureUnit}
                unitCatalog={termOptions}
                slabId={form.slabId}
                onChange={(v) => set("tenure", v)}
                onUnitChange={(unit, label) =>
                  setForm((current) => ({
                    ...current,
                    tenureUnit: unit,
                    tenureUnitLabel: label,
                    slabId: "",
                    rate: current.slabId ? "" : current.rate,
                  }))
                }
                onSlabSelect={(slab) =>
                  setForm((current) => ({
                    ...current,
                    tenureUnit: String(slab.termCd),
                    tenureUnitLabel: slab.termDesc || `Term ${slab.termCd}`,
                    slabId: String(slab.id),
                    rate: String(slab.roi),
                  }))
                }
              />
              <TextField label="Interest rate (p.a.) %" value={form.rate} onChange={(v) => set("rate", v)} inputMode="decimal" required />
              <SelectField
                label="Interest payout"
                value={form.payout}
                onChange={(v) => set("payout", v)}
                options={payoutOptions.map((option) => ({ value: String(option.optCode), label: option.optDescription }))}
                placeholder={maturityStatus === "loading" ? "Loading interest payout options..." : "Select interest payout"}
                disabled={maturityStatus !== "ready"}
                required
              />
            </section>
            <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="term-maturity">
              <h3 id="term-maturity" className="text-sm font-semibold text-foreground">Maturity Details</h3>
              <DateField
                label="Maturity date"
                value={form.maturity}
                onChange={(v) => {
                  maturityDateEdited.current = true;
                  set("maturity", v);
                }}
                min={form.date || undefined}
                required
              />
              <TextField
                label="Maturity amount"
                value={form.maturityAmount}
                onChange={(v) => {
                  maturityAmountEdited.current = true;
                  set("maturityAmount", v);
                }}
                inputMode="decimal"
                required
                hint="Estimated using simple interest on the opening balance. You can enter the amount from the existing record."
              />
              <DateField
                label="Interest paid up to"
                value={form.paidUpTo}
                onChange={(v) => set("paidUpTo", v)}
                min={form.date || undefined}
                max={form.maturity && form.maturity < todayYmd ? form.maturity : todayYmd}
                hint="For MIS with already-due installments; on or after opening date and no later than maturity or today."
              />
              <SelectField
                label="Maturity instruction"
                value={form.maturityInstruction}
                onChange={(v) => set("maturityInstruction", v)}
                options={maturityOptions.map((option) => ({ value: String(option.optCode), label: option.optDescription }))}
                placeholder={maturityStatus === "loading" ? "Loading maturity instructions..." : "Select maturity instruction"}
                emptyMessage="No maturity instructions available"
                disabled={maturityStatus !== "ready"}
              />
              {form.maturityInstruction === "4" && (
                <p className="text-xs text-muted">
                  Finalization requires exactly one active savings account for this customer and branch.
                </p>
              )}
              {maturityStatus === "error" && (
                <p role="alert" className="text-sm text-rose-600">
                  Could not load payout and maturity options.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setMaturityStatus("loading");
                      setMaturityReload((current) => current + 1);
                    }}
                  >
                    Try again
                  </button>
                </p>
              )}
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
