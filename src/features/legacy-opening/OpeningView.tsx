"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BadgeIndianRupee, Banknote, Coins, HandHeart, Users } from "lucide-react";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { LoadingState } from "@/components/shared/LoadingState";
import { BatchFormActions } from "./BatchFormActions";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { DateField, SelectField, TextField } from "@/components/ui/Form";
import { initialEntry, type BatchEntry } from "./regular-deposit.form";
import { TermDepositOpening } from "./TermDepositOpening";
import { ShareAccountOpening } from "./ShareAccountOpening";
import { GeneralFundOpening } from "./GeneralFundOpening";
import { LoanAccountOpening } from "./OtherAccountOpenings";
import { ThriftFundOpening } from "./ThriftFundOpening";
import { OpeningCustomerField } from "./OpeningCustomerField";
import { OpeningDraftTable } from "./OpeningDraftTable";
import { saveDraft } from "./services/opening-deposit-client";
import { openingDateToInput } from "./services/opening-date";
import type { OpeningDraft } from "./services/opening-deposit.schemas";
import { custTypeForProduct } from "@/features/deposits/savings/deposit-account.rules";
import { fetchDepositProductSchemes } from "@/features/deposits/savings/services/deposit-account-client";
import { CUST_TYPE_GROUP, CUST_TYPE_INDIVIDUAL, OP_MODE_SINGLE, OPT_CUST_TYPE, OPT_OP_MODE, SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { fetchApplOptions, type ApplOption } from "@/features/master/appl-options";
import { FinancialYearField } from "./FinancialYearField";
import type { FinYear } from "@/features/master/fin-year";
import { formatDateDMY } from "@/lib/date-format";

const tabs = [
  { id: "deposit", title: "Deposit A/c", icon: Coins },
  { id: "share", title: "Share A/c", icon: Users },
  { id: "gf", title: "GF A/c", icon: HandHeart },
  { id: "tf", title: "TF A/c", icon: Banknote },
  { id: "loan", title: "Loan A/c", icon: BadgeIndianRupee },
] as const;
type Tab = (typeof tabs)[number]["id"];
const TAB_STORAGE_KEY = "mfin.opening.active-tab";
function rememberTab(value: string) {
  try { window.sessionStorage.setItem(TAB_STORAGE_KEY, value); } catch { /* Storage may be unavailable. */ }
}
const FIN_YEAR_STORAGE_KEY = "mfin.opening.fin-year";
function rememberFinYear(value: string) {
  try { window.sessionStorage.setItem(FIN_YEAR_STORAGE_KEY, value); } catch { /* Storage may be unavailable. */ }
}
function getSavedFinYear(): string {
  try { return window.sessionStorage.getItem(FIN_YEAR_STORAGE_KEY) || ""; } catch { return ""; }
}
const products: Record<Tab, { type: string; scheme: string }> = {
  deposit: { type: "SB", scheme: "" },
  share: { type: "SHARE", scheme: "" },
  gf: { type: "GF", scheme: "" },
  tf: { type: "TF", scheme: "" },
  loan: { type: "LOAN", scheme: "" },
};

export function OpeningView() {
  const [tab, setTab] = useState<Tab>("deposit");
  const [form, setForm] = useState<BatchEntry>(initialEntry);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useToastText();
  const [notice, setNotice] = useToastText();
  const formRef = useRef<HTMLFormElement>(null);
  const [schemes, setSchemes] = useState<{ value: string; label: string; product: number }[]>([]);
  const [schemeStatus, setSchemeStatus] = useState<"loading" | "ready" | "error">("loading");
  const [schemeReload, setSchemeReload] = useState(0);
  const [customerTypes, setCustomerTypes] = useState<ApplOption[]>([]);
  const [operationModes, setOperationModes] = useState<ApplOption[]>([]);
  const [optionsStatus, setOptionsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [optionsReload, setOptionsReload] = useState(0);
  const [tabRestored, setTabRestored] = useState(false);
  const [finYearId, setFinYearId] = useState<string>("");
  const [finYears, setFinYears] = useState<FinYear[]>([]);
  const selectedFinYear = finYears.find((y) => String(y.yearId) === finYearId);

  const handleYearsLoaded = (loadedYears: FinYear[]) => {
    setFinYears(loadedYears);
    const saved = getSavedFinYear();
    const matched = loadedYears.find((y) => String(y.yearId) === saved);
    const active = loadedYears.find((y) => y.isActive) ?? loadedYears[0];
    const initial = matched ?? active;
    if (initial && !finYearId) {
      setFinYearId(String(initial.yearId));
    }
  };

  const handleGlobalFinYearChange = (yearId: string, year?: FinYear) => {
    setFinYearId(yearId);
    rememberFinYear(yearId);
    if (year && form.date && (form.date < year.startDate || form.date > year.endDate)) {
      setForm((current) => ({ ...current, date: "" }));
    }
  };
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchApplOptions(OPT_CUST_TYPE), fetchApplOptions(OPT_OP_MODE)])
      .then(([types, modes]) => {
        if (cancelled) return;
        setCustomerTypes(types.filter((option) => option.isActive && (option.optCode === CUST_TYPE_GROUP || option.optCode === CUST_TYPE_INDIVIDUAL)));
        setOperationModes(modes.filter((option) => option.isActive));
        setOptionsStatus("ready");
      })
      .catch(() => { if (!cancelled) setOptionsStatus("error"); });
    return () => { cancelled = true; };
  }, [optionsReload]);
  useEffect(() => {
    let cancelled = false;
    fetchDepositProductSchemes(SAVINGS_DEPOSIT_TYPE)
      .then((groups) => {
        if (cancelled) return;
        setSchemes(groups.flatMap((group) => group.schemes.filter((scheme) => scheme.isActive !== false).map((scheme) => ({
          value: String(scheme.schemeId),
          label: scheme.schemeCode ? `${scheme.schemeCode} · ${scheme.schemeName}` : scheme.schemeName,
          product: group.prodTypeCd,
        }))));
        setSchemeStatus("ready");
      })
      .catch(() => { if (!cancelled) setSchemeStatus("error"); });
    return () => { cancelled = true; };
  }, [schemeReload]);
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TAB_STORAGE_KEY);
      if (saved === "deposit-fd") {
        setTab("deposit");
        setForm((current) => ({ ...current, type: "FD", scheme: "" }));
      } else if (saved && tabs.some((item) => item.id === saved)) {
        setTab(saved as Tab);
      }
    } catch { /* Fall back to the default tab if storage is unavailable. */ }
    setTabRestored(true);
  }, []);
  const set = (key: keyof BatchEntry, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const duplicateJointMember = form.customerType === String(CUST_TYPE_INDIVIDUAL) && form.customerId != null && form.customerId === form.jointId;
  const clear = () => {
    setForm({
      ...initialEntry,
      ...products[tab],
      schemeId: "",
      id: "",
      account: "",
      member: "",
      name: "",
      jointMember: "",
      jointName: "",
      balance: "",
      amount: "",
      installment: "",
      remarks: "",
    });
    setError("");
    setNotice("");
  };
  const changeTab = (next: Tab) => { setTab(next); rememberTab(next === "deposit" && form.type === "FD" ? "deposit-fd" : next); };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (form.account.trim().length > 15) { setError("Account reference number must be 15 characters or fewer."); return; }
    const selectedScheme = schemes.find((scheme) => scheme.value === form.schemeId && (custTypeForProduct(scheme.product) == null || custTypeForProduct(scheme.product) === Number(form.customerType)));
    if (form.operationMode !== String(OP_MODE_SINGLE) && duplicateJointMember) {
      setError("The joint member must be different from the primary customer."); return;
    }
    if (optionsStatus !== "ready" || schemeStatus !== "ready" || !customerTypes.some((option) => String(option.optCode) === form.customerType) || !operationModes.some((option) => String(option.optCode) === form.operationMode) || !form.customerId || !form.account.trim() || !selectedScheme || !form.date || !/^\d{1,8}(?:\.\d{1,2})?$/.test(form.balance.trim()) || (["2", "3"].includes(form.operationMode) && !form.jointId)) {
      setError("Complete the required fields with a valid opening balance."); return;
    }
    if (selectedFinYear && form.date && (form.date < selectedFinYear.startDate || form.date > selectedFinYear.endDate)) {
      setError(`Opening date must fall within the selected financial year (${selectedFinYear.yearName}: ${formatDateDMY(selectedFinYear.startDate)} – ${formatDateDMY(selectedFinYear.endDate)}).`);
      return;
    }
    if (form.operationMode === "4") { setError("This mode needs two joint holders, but opening drafts support only one."); return; }
    setSaving(true); setError("");
    try {
      await saveDraft({ ...(form.id ? { opening_id: Number(form.id) } : {}), deposit_type_cd: 1, cust_type_cd: form.customerType === "1" ? 1 : 2, customer_id: form.customerId, scheme_id: Number(form.schemeId), prod_type_cd: selectedScheme.product > 0 ? selectedScheme.product : null, op_mode_cd: Number(form.operationMode), cust_id_joint1: form.operationMode === String(OP_MODE_SINGLE) ? null : form.jointId, ref_ac_no: form.account.trim(), opening_date: form.date, opening_balance: form.balance.trim(), remarks: form.remarks.trim() || null });
      const updated = Boolean(form.id); clear(); setNotice(updated ? "Draft updated." : "Draft added to the batch."); setRevision((value) => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save draft."); }
    finally { setSaving(false); }
  };
  const edit = (row: OpeningDraft) => {
    setForm({ ...initialEntry, id: String(row.opening_id), customerType: row.cust_type_cd === 1 ? "1" : "2", customerId: row.customer_id ?? null, customerBranchId: row.branch_id ?? null, member: row.customer_code || (row.customer_id ? `#${row.customer_id}` : ""), name: row.customer_name || "", account: row.ref_ac_no || "", operationMode: row.op_mode_cd == null ? "" : String(row.op_mode_cd), jointId: row.cust_id_joint1 ?? null, jointMember: row.cust_id_joint1 ? `#${row.cust_id_joint1}` : "", schemeId: row.scheme_id == null ? "" : String(row.scheme_id), scheme: row.scheme_name || "", date: openingDateToInput(row.opening_date), balance: row.opening_balance, remarks: row.remarks || "" });
    setError(""); setNotice(""); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  if (!tabRestored) return <LoadingState />;
  return (
    <div className="space-y-5">
      <Card>
        <div>
          <SectionTabs tabs={tabs} activeId={tab} onChange={changeTab} label="Account type" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {tab === "deposit" && <fieldset className="flex flex-wrap gap-5 text-sm text-foreground">
              <legend className="sr-only">Deposit type</legend>
              {[{ type: "SB", label: "Regular Deposit (SB)" }, { type: "FD", label: "Term Deposit (DD/RD/FD/MIS)" }].map((option) => <label key={option.type} className="flex cursor-pointer items-center gap-2"><input type="radio" name="depositType" checked={tab === "deposit" && form.type === option.type} onChange={() => { setTab("deposit"); setForm((current) => ({ ...current, type: option.type })); rememberTab(option.type === "FD" ? "deposit-fd" : "deposit"); }} />{option.label}</label>)}
            </fieldset>}
            <div className="w-full sm:ml-auto sm:w-64 sm:shrink-0">
              <FinancialYearField
                value={finYearId}
                onChange={handleGlobalFinYearChange}
                onYearsLoaded={handleYearsLoaded}
                label="Financial year"
                hideLabel
                hint=""
                required
              />
            </div>
          </div>
        </div>
      </Card>
      <TermDepositOpening visible={tab === "deposit" && form.type === "FD"} selectedFinYear={selectedFinYear} />
      <ShareAccountOpening visible={tab === "share"} selectedFinYear={selectedFinYear} />
      <GeneralFundOpening visible={tab === "gf"} selectedFinYear={selectedFinYear} />
      <ThriftFundOpening visible={tab === "tf"} selectedFinYear={selectedFinYear} />
      <LoanAccountOpening visible={tab === "loan"} />
      <div className="space-y-5" hidden={tab !== "deposit" || form.type === "FD"}>
      <Card title="Account Opening Details">
        <form ref={formRef} onSubmit={(event) => void save(event)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <fieldset disabled={optionsStatus !== "ready"}>
            <legend className="mb-2 text-xs font-semibold text-slate-600">Customer type <span className="text-rose-500">*</span></legend>
            <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
              {optionsStatus === "ready" && customerTypes.map((option) => <label key={option.optCode} className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-brand ${form.customerType === String(option.optCode) ? "bg-cyan-700 text-white shadow-xs" : "text-slate-800 hover:bg-surface-muted"}`}><input className="sr-only" type="radio" name="opening-customer-type" checked={form.customerType === String(option.optCode)} onChange={() => setForm((current) => ({ ...current, customerType: option.optCode === CUST_TYPE_GROUP ? "1" : "2", customerId: null, customerBranchId: null, member: "", name: "", operationMode: "", jointId: null, jointMember: "", jointName: "", schemeId: "", scheme: "" }))} />{option.optDescription}</label>)}
              {optionsStatus === "loading" && <div role="status" aria-label="Loading customer types" className="flex gap-1"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-24" /></div>}
              {optionsStatus === "ready" && customerTypes.length === 0 && <span className="px-3 py-2 text-sm text-muted">No customer types available.</span>}
            </div>
          </fieldset>
            <OpeningCustomerField label={form.customerType === "1" ? "Group no." : "Customer no."} type={form.customerType === "1" ? 1 : 2} value={form.member} onSelect={(item) => setForm((current) => ({ ...current, customerId: item.customer_id, customerBranchId: item.branch_id ?? null, member: item.customer_code || `#${item.customer_id}`, name: item.customer_name, jointId: null, jointMember: "", jointName: "" }))} />
            <TextField label={form.customerType === "1" ? "Group name" : "Customer name"} value={form.name} readOnly />
            <TextField label="Account reference number" value={form.account} onChange={(v) => set("account", v)} maxLength={15} hint="Maximum 15 characters." required />
            <SelectField label="Operation mode" value={form.operationMode} onChange={(value) => setForm((current) => ({ ...current, operationMode: value, jointId: null, jointMember: "", jointName: "" }))} options={operationModes.map((option) => ({ value: String(option.optCode), label: option.optDescription, disabled: option.optCode === 4 }))} hint="The mode requiring two joint holders is unavailable for opening drafts." placeholder={optionsStatus === "loading" ? "Loading operation modes..." : "Select operation mode"} emptyMessage="No operation modes available" disabled={optionsStatus !== "ready"} required />
            {form.operationMode && form.operationMode !== String(OP_MODE_SINGLE) ? <><div><OpeningCustomerField label="Joint member code" type={2} branchId={form.customerBranchId ?? undefined} disabled={!form.customerId} required={["2", "3"].includes(form.operationMode)} value={form.jointMember} onSelect={(item) => { setError(""); setForm((current) => ({ ...current, jointId: item.customer_id, jointMember: item.customer_code || `#${item.customer_id}`, jointName: item.customer_name })); }} />{form.jointId && <button type="button" className="mt-1 text-xs text-muted underline" onClick={() => setForm((current) => ({ ...current, jointId: null, jointMember: "", jointName: "" }))}>Clear joint member</button>}</div><TextField label="Joint member name" value={form.jointName} readOnly />{duplicateJointMember && <p role="alert" className="text-sm text-rose-600">Choose a different person from the primary customer.</p>}</> : null}
            <SelectField label="Scheme / Product" value={form.schemeId ?? ""} onChange={(value) => setForm((current) => ({ ...current, schemeId: value, scheme: schemes.find((scheme) => scheme.value === value)?.label ?? "" }))} options={schemes.filter((scheme) => { const required = custTypeForProduct(scheme.product); return required == null || required === Number(form.customerType); })} placeholder={schemeStatus === "loading" ? "Loading schemes..." : "Select scheme / product"} emptyMessage="No schemes available" disabled={schemeStatus !== "ready"} searchable required />
            <DateField label="Opening date" value={form.date} onChange={(v) => set("date", v)} min={selectedFinYear?.startDate} max={selectedFinYear?.endDate} hint={selectedFinYear ? `Range: ${formatDateDMY(selectedFinYear.startDate)} – ${formatDateDMY(selectedFinYear.endDate)}` : undefined} required />
            <TextField label="Opening balance" value={form.balance} onChange={(v) => set("balance", v)} inputMode="decimal" required />
            <TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} maxLength={100} />
          </div>
          {optionsStatus === "error" && <p role="alert" className="text-sm text-rose-600">Could not load customer types and operation modes. <button type="button" className="underline" onClick={() => { setOptionsStatus("loading"); setOptionsReload((current) => current + 1); }}>Try again</button></p>}
          {schemeStatus === "error" && <p role="alert" className="text-sm text-rose-600">Could not load schemes. <button type="button" className="underline" onClick={() => { setSchemeStatus("loading"); setSchemeReload((current) => current + 1); }}>Try again</button></p>}
          <PageToast message={error} tone="error" />
          <PageToast message={notice} />
          <BatchFormActions editing={Boolean(form.id)} clear={clear} busy={saving} />
        </form>
      </Card>
      <OpeningDraftTable type={1} revision={revision} onEdit={edit} />
      </div>
    </div>
  );
}
