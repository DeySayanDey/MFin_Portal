"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Building2, ChevronDown, Eye, EyeOff, Link2, Plus, Pencil, Save, Settings, UploadCloud } from "lucide-react";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageFormSkeleton } from "@/components/shared/skeletons/PageFormSkeleton";
import { CheckboxField, FormField, SelectField, TextField } from "@/components/ui/Form";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import { emptyConfiguration, emptyMapping, type Configuration, type Mapping } from "../services/virtual-account.types";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import { fetchConfigEditDetails, listVirtualBank, saveConfiguration, saveMapping as saveMappingRequest, type Row } from "../services/virtual-bank-client";
import { showToast } from "@/components/ui/toast";
import { VirtualAccountDetails } from "./VirtualAccountDetails";
import { fetchIfscDetails, type IfscDetails } from "../services/ifsc-client";

type Tab = "configurations" | "mapping";
type TextKey = Exclude<keyof Configuration, "id" | "bankId" | "bankLabel" | "isActive" | "qrImageFile" | "qrImagePath" | "configName" | "purposeCd" | "maxAmount" | "upiId" | "hasQrImage" | "hasHexKey" | "hasHexIvKey" | "hasSecretId" | "originalText">;
const fields: { key: TextKey; label: string; max: number; secret?: boolean; wide?: boolean }[] = [
  { key: "branchCode", label: "branchCode", max: 50 },
  { key: "accountNo", label: "accountNumber", max: 50 },
  { key: "cifNo", label: "cifNumber", max: 50 },
  { key: "tenderId", label: "iblTender", max: 50 },
  { key: "makerId", label: "makerId", max: 50 },
  { key: "checkerId", label: "checkerId", max: 50 },
  { key: "clientId", label: "clientId", max: 50 },
  { key: "secretId", label: "secretId", max: 50, secret: true },
  { key: "hexKey", label: "hexKey", max: 255, secret: true, wide: true },
  { key: "hexIvKey", label: "hexIvKey", max: 255, secret: true, wide: true },
];

const textValue = (value: unknown) => value == null ? "" : String(value);
const boolValue = (value: unknown) => value === true || value === 1 || value === "1";
const configurationFromRow = (row: Row): Configuration => ({
  ...emptyConfiguration(), id: Number(row.id), bankId: textValue(row.bank_id), bankLabel: textValue(row.bank_name), configName: textValue(row.config_name), purposeCd: textValue(row.purpose_cd), maxAmount: textValue(row.max_amount),
  originalText: Object.fromEntries(["branch_code", "ifsc_code", "account_no", "cif_no", "tender_id", "maker_id", "checker_id", "client_id", "upi_id"].map((key) => [key, row[key] as string | null])),
  branchCode: textValue(row.branch_code), ifscCode: textValue(row.ifsc_code), accountNo: textValue(row.account_no), cifNo: textValue(row.cif_no), tenderId: textValue(row.tender_id), makerId: textValue(row.maker_id), checkerId: textValue(row.checker_id), clientId: textValue(row.client_id), upiId: textValue(row.upi_id), isActive: boolValue(row.is_active), hasQrImage: boolValue(row.has_qr_image), hasHexKey: boolValue(row.has_hex_key), hasHexIvKey: boolValue(row.has_hex_iv_key), hasSecretId: boolValue(row.has_secret_id),
  secretId: textValue(row.secret_id), hexKey: textValue(row.hex_key), hexIvKey: textValue(row.hex_iv_key),
});

export function VirtualAccountConfigForm({ canEdit }: { canEdit: boolean }) {
  const t = useTranslations("virtualAccountConfig");
  const common = useTranslations("common");
  const [tab, setTab] = useState<Tab>("configurations");
  const [configsExpanded, setConfigsExpanded] = useState(true);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [config, setConfig] = useState<Configuration>(emptyConfiguration);
  const [originalConfig, setOriginalConfig] = useState<Configuration | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const editRequest = useRef(0);
  const [viewConfig, setViewConfig] = useState<Configuration | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchState, setBranchState] = useState<"loading" | "ready" | "error">("loading");
  const [branchReload, setBranchReload] = useState(0);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrError, setQrError] = useState("");
  const [ifscResult, setIfscResult] = useState<{ code: string; status: "loading" | "found" | "notFound" | "error"; data?: IfscDetails } | null>(null);
  const [ifscRetry, setIfscRetry] = useState(0);
  const [banks, setBanks] = useState<{ value: string; label: string }[]>([]);
  const [purposes, setPurposes] = useState<{ value: string; label: string; disabled?: boolean }[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [removeQr, setRemoveQr] = useState(false);
  const [savedQrPreview, setSavedQrPreview] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError("");
    Promise.all([listVirtualBank("banks"), listVirtualBank("configs"), listVirtualBank("mappings"), fetchApplOptions(53, true)])
      .then(([bankRows, configRows, mappingRows, options]) => {
        if (cancelled) return;
        setBanks(bankRows.map((row) => ({ value: textValue(row.bank_id), label: textValue(row.bank_name) })));
        setPurposes(options.map((option) => ({ value: String(option.optCode), label: option.optDescription, disabled: !option.isActive })));
        setConfigs(configRows.map(configurationFromRow));
        setMappings(mappingRows.map((row: Row) => ({ id: Number(row.id), virtualId: textValue(row.virtual_id), orgBranchId: textValue(row.org_branch_id), isActive: boolValue(row.is_active), configLabel: textValue(row.config_name), branchLabel: [textValue(row.branch_code), textValue(row.branch_name)].filter(Boolean).join(" · ") })));
        setLoading(false);
      }).catch((err: unknown) => { if (!cancelled) { setLoadError(err instanceof Error ? err.message : t("loadFailure")); setLoading(false); } });
    return () => { cancelled = true; };
  }, [reload, t]);

  useEffect(() => {
    setSavedQrPreview(null);
    if (!config.id || !config.hasQrImage || removeQr || config.qrImageFile) { setQrLoading(false); return; }
    const controller = new AbortController();
    let url: string | null = null;
    setQrLoading(true);
    fetch(`/api/master/virtual-ac-config/qr?id=${config.id}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("QR unavailable"); return response.blob(); })
      .then((blob) => { if (!controller.signal.aborted) { url = URL.createObjectURL(blob); setSavedQrPreview(url); } })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setQrLoading(false); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [config.id, config.hasQrImage, config.qrImageFile, removeQr]);

  useEffect(() => {
    const code = config.ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIfscResult({ code, status: "loading" });
      fetchIfscDetails(code, controller.signal)
        .then((data) => { if (!controller.signal.aborted) setIfscResult({ code, status: data ? "found" : "notFound", data: data ?? undefined }); })
        .catch(() => { if (!controller.signal.aborted) setIfscResult({ code, status: "error" }); });
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [config.ifscCode, ifscRetry]);

  useEffect(() => {
    if (!config?.qrImageFile) { setQrPreview(null); return; }
    const url = URL.createObjectURL(config.qrImageFile);
    setQrPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [config?.qrImageFile]);

  useEffect(() => {
    if (tab !== "mapping") return;
    let cancelled = false;
    async function loadBranches() {
      setBranchState("loading");
      try {
        const items: Branch[] = [];
        let page = 1;
        while (true) {
          const result = await fetchBranchList({ page, perPage: 200, isActive: 1 });
          items.push(...result.items);
          if (!result.meta?.hasMore) break;
          if (result.items.length === 0) throw new Error("Incomplete branch list");
          page += 1;
        }
        if (!cancelled) { setBranches(items); setBranchState("ready"); }
      } catch {
        if (!cancelled) { setBranches([]); setBranchState("error"); }
      }
    }
    void loadBranches();
    return () => { cancelled = true; };
  }, [tab, branchReload]);

  const bankName = (id: string) => banks.find((item) => item.value === id)?.label || configs.find((item) => item.bankId === id)?.bankLabel || id;
  const branchName = (id: string) => {
    const branch = branches.find((item) => String(item.branchId) === id);
    return branch ? `${branch.branchCode} · ${branch.branchName}` : `#${id}`;
  };
  const configName = (id: string) => {
    const item = configs.find((row) => String(row.id) === id);
    return item ? `${item.configName || `#${item.id}`} · ${bankName(item.bankId)}` : `#${id}`;
  };
  const status = (active: boolean) => <Badge tone={active ? "success" : "neutral"}>{t(active ? "active" : "inactive")}</Badge>;
  const mappingColumns: DataTableColumn<Mapping>[] = [
    { id: "config", header: t("virtualAccount"), cell: (row) => row.configLabel || configName(row.virtualId) },
    { id: "branch", header: t("orgBranch"), cell: (row) => row.branchLabel || branchName(row.orgBranchId) },
    { id: "status", header: t("status"), cell: (row) => status(row.isActive) },
  ];

  async function openEdit(id: number) {
    const requestId = ++editRequest.current;
    setVisibleSecrets({}); setConfigsExpanded(false);
    setConfig(emptyConfiguration()); setOriginalConfig(null); setEditingId(id);
    setError(""); setQrError(""); setRemoveQr(false);
    try {
      const row = await fetchConfigEditDetails(id);
      if (requestId !== editRequest.current) return;
      const details = configurationFromRow(row);
      setOriginalConfig(details); setConfig({ ...details });
    } catch (err) {
      if (requestId === editRequest.current) showToast(err instanceof Error ? err.message : t("loadFailure"), "error");
    } finally {
      if (requestId === editRequest.current) setEditingId(null);
    }
  }

  async function saveConfig(event: FormEvent) {
    event.preventDefault();
    if (!canEdit || saving || loading || editingId !== null || loadError || qrError) return;
    if (!config.bankId || !config.configName.trim() || !config.purposeCd) { setError(t("basicRequired")); return; }
    if (!banks.some((bank) => bank.value === config.bankId)) { setError(t("bankRequired")); return; }
    if (config.maxAmount && !/^\d{1,16}(?:\.\d{1,2})?$/.test(config.maxAmount)) { setError(t("amountInvalid")); return; }
    if ([config.hexKey, config.hexIvKey].some((value) => value && !/^(?:[0-9a-fA-F]{2})+$/.test(value))) { setError(t("hexInvalid")); return; }
    const original = originalConfig;
    if (config.id && !original) { setError(t("loadFailure")); return; }
    const nullable = (value: string) => value.trim() || null;
    const originalOrChanged = (key: string, value: string, previous: string | undefined) => original && value === previous ? original.originalText[key] : nullable(value);
    const body: Record<string, unknown> = {
      ...(config.id ? { id: config.id } : {}), bank_id: Number(config.bankId), is_active: config.isActive,
      branch_code: originalOrChanged("branch_code", config.branchCode, original?.branchCode), ifsc_code: originalOrChanged("ifsc_code", config.ifscCode, original?.ifscCode), account_no: originalOrChanged("account_no", config.accountNo, original?.accountNo), cif_no: originalOrChanged("cif_no", config.cifNo, original?.cifNo), tender_id: originalOrChanged("tender_id", config.tenderId, original?.tenderId), maker_id: originalOrChanged("maker_id", config.makerId, original?.makerId), checker_id: originalOrChanged("checker_id", config.checkerId, original?.checkerId), client_id: originalOrChanged("client_id", config.clientId, original?.clientId), upi_id: originalOrChanged("upi_id", config.upiId, original?.upiId),
    };
    if (!original || config.configName !== original.configName) body.config_name = nullable(config.configName);
    if (!original || config.purposeCd !== original.purposeCd) body.purpose_cd = config.purposeCd === "" ? null : Number(config.purposeCd);
    if (!original || config.maxAmount !== original.maxAmount) { if (config.maxAmount) body.max_amount = config.maxAmount; else if (original) body.max_amount = null; }
    for (const [formKey, apiKey] of [["hexKey", "hex_key"], ["hexIvKey", "hex_iv_key"], ["secretId", "secret_id"]] as const) {
      if (!original || config[formKey] !== original[formKey]) {
        if (config[formKey]) body[apiKey] = config[formKey];
        else if (original && original[formKey]) body[apiKey] = null;
      }
    }
    if (removeQr) body.remove_qr = true;
    if (config.qrImageFile && [body.branch_code, body.ifsc_code, body.account_no, body.cif_no, body.tender_id, body.maker_id, body.checker_id, body.client_id, body.upi_id].some((value) => value === null || value === "")) { setError(t("qrNullableConflict")); return; }
    if (config.qrImageFile && [body.hex_key, body.hex_iv_key, body.secret_id, body.max_amount, body.config_name, body.purpose_cd].some((value) => value === null)) { setError(t("saveSeparately")); return; }
    setSaving(true); setError("");
    try {
      await saveConfiguration(body, config.qrImageFile);
      setConfig(emptyConfiguration()); setOriginalConfig(null); setVisibleSecrets({}); setRemoveQr(false); setQrError("");
      setReload((value) => value + 1); showToast(t("saveSuccess"), "success");
    } catch (err) { showToast(err instanceof Error ? err.message : t("loadFailure"), "error"); }
    finally { setSaving(false); }
  }
  async function saveMapping(event: FormEvent) {
    event.preventDefault();
    if (!mapping) return;
    if (!mapping.virtualId || !mapping.orgBranchId) { setError(t("mappingRequired")); return; }
    const existing = mappings.find((row) => row.id === mapping.id);
    const allowExistingInactive = !mapping.isActive && existing?.orgBranchId === mapping.orgBranchId;
    if (branchState !== "ready" || (!allowExistingInactive && !branches.some((branch) => String(branch.branchId) === mapping.orgBranchId))) { setError(t("branchInvalid")); return; }
    if (mappings.some((row) => row.id !== mapping.id && row.virtualId === mapping.virtualId && row.orgBranchId === mapping.orgBranchId)) { setError(t("duplicateMapping")); return; }
    if (!canEdit || saving || loading || loadError) return;
    setSaving(true);
    try {
      await saveMappingRequest({ ...(mapping.id ? { id: mapping.id } : {}), virtual_id: Number(mapping.virtualId), org_branch_id: Number(mapping.orgBranchId), is_active: mapping.isActive });
      setMapping(null); setError(""); setReload((value) => value + 1); showToast(t("mappingSaved"), "success");
    } catch (err) { showToast(err instanceof Error ? err.message : t("loadFailure"), "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {!canEdit && <Alert>{t("readOnlyNotice")}</Alert>}
      {loadError && <div className="flex items-center gap-2"><Alert tone="error">{loadError}</Alert><Button variant="secondary" size="sm" onClick={() => setReload((value) => value + 1)}>{common("retry")}</Button></div>}
      <SectionTabs<Tab> label={t("title")} activeId={tab} onChange={(next) => { editRequest.current++; setEditingId(null); setOriginalConfig(null); setVisibleSecrets({}); setConfig(emptyConfiguration()); setTab(next); setError(""); }} tabs={[
        { id: "configurations", title: t("configurations"), description: t("configurationsHint"), icon: Building2 },
        { id: "mapping", title: t("mapping"), description: t("mappingHint"), icon: Link2 },
      ]} />
      {loading && tab === "configurations" ? <div role="status" aria-busy="true" aria-label={common("loading")} className="space-y-4"><Card><div className="space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-3.5 w-64 max-w-full" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-32 w-full" rounded="xl" />)}</div></div></Card><PageFormSkeleton fields={10} showChecks={false} /></div> : tab === "configurations" ? <>
        {configs.length > 0 && <Card title={t("configurations")} description={t("configurationsHint")} trailing={<Button variant="ghost" size="sm" icon={ChevronDown} aria-expanded={configsExpanded} aria-controls="virtual-configurations-list" onClick={() => setConfigsExpanded((value) => !value)} className={configsExpanded ? "[&>svg]:rotate-180" : undefined}>{t(configsExpanded ? "collapseConfigurations" : "expandConfigurations")}</Button>}>
          <div id="virtual-configurations-list" className={configsExpanded ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "hidden"}>{configs.map((row) => <article key={row.id} className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{row.configName || bankName(row.bankId)}</p><p className="mt-1 text-xs text-muted">{bankName(row.bankId)} · {t("virtualId")} {row.id}</p></div>{status(row.isActive)}</div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3"><Button variant="ghost" size="sm" icon={Eye} onClick={() => setViewConfig(row)}>{t("view")}</Button>{canEdit && <Button variant="ghost" size="sm" icon={Pencil} disabled={saving || editingId !== null} onClick={() => void openEdit(row.id)}>{t("edit")}</Button>}</div>
          </article>)}</div>
        </Card>}
        {viewConfig && <VirtualAccountDetails record={viewConfig} bankName={bankName(viewConfig.bankId)} purposeName={purposes.find((item) => item.value === viewConfig.purposeCd)?.label ?? viewConfig.purposeCd} onClose={() => setViewConfig(null)} />}
        {editingId !== null && <PageFormSkeleton fields={10} showChecks={false} />}
        {canEdit && editingId === null && <Card title={t(config.id ? "editConfiguration" : "addConfiguration")} description={t("configurationsHint")}>
        <form id="virtual-config-form" onSubmit={saveConfig} autoComplete="off" className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <fieldset disabled={saving} className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-stretch">
            <Card className="overflow-hidden p-0 shadow-none sm:p-0">
            <h3 className="flex items-center gap-2 border-b border-border bg-brand-soft px-4 py-3 text-sm font-semibold text-brand"><Building2 className="h-4 w-4" />{t("basicInformation")}</h3>
            <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={t("configName")} value={config.configName} onChange={(value) => setConfig({ ...config, configName: value })} maxLength={50} required />
              <SelectField label={t("bank")} value={config.bankId} onChange={(value) => setConfig({ ...config, bankId: value })} options={[...(!banks.some((bank) => bank.value === config.bankId) && config.bankId ? [{ value: config.bankId, label: `${config.bankId} (${t("inactive")})`, disabled: true }] : []), ...banks]} required />
              <SelectField label={t("purpose")} value={config.purposeCd} onChange={(value) => setConfig({ ...config, purposeCd: value })} options={purposes} required />
              <TextField label={t("maxAmount")} value={config.maxAmount} onChange={(value) => setConfig({ ...config, maxAmount: value })} inputMode="decimal" />
              <TextField label={t("upiId")} value={config.upiId} onChange={(value) => setConfig({ ...config, upiId: value })} maxLength={50} className="sm:col-span-2" />
            </div>
            <div className="mt-4 space-y-4">
            <FormField label={t("qrUpload")} hint={t("qrHint")} error={qrError}>
              <div className="grid gap-4 rounded-xl border border-dashed border-border-strong bg-surface-muted/40 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(160px,220px)] sm:items-center">
              <div className="min-w-0 space-y-3 text-center sm:text-start">
              <p className="break-all text-sm font-medium text-slate-700">{config.qrImageFile?.name ?? (config.hasQrImage && !removeQr ? t("qrExisting") : t("noQr"))}</p>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand-soft/40 focus-within:ring-2 focus-within:ring-brand/40">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              <span>{config.qrImageFile || (config.hasQrImage && !removeQr) ? t("qrReplace") : t("qrChoose")}</span>
              <input key={config.qrImageFile?.name ?? "empty"} type="file" accept="image/png,image/jpeg,image/webp" aria-label={t("qrUpload")} aria-invalid={Boolean(qrError)} className="sr-only" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
                  setQrError(t("qrInvalid"));
                  event.target.value = "";
                  return;
                }
                setQrError("");
                setRemoveQr(false); setConfig({ ...config, qrImageFile: file, qrImagePath: "" });
              }} />
              </label>
              {(config.qrImageFile || (config.hasQrImage && !removeQr)) && <Button size="sm" variant="secondary" onClick={() => { setConfig({ ...config, qrImageFile: null, qrImagePath: "" }); setRemoveQr(config.hasQrImage); setQrError(""); }}>{t("qrRemove")}</Button>}
              {removeQr && <Button size="sm" variant="secondary" onClick={() => setRemoveQr(false)}>{t("qrKeep")}</Button>}
              </div>
              </div>
              <div className="mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                {qrLoading ? <Skeleton className="h-full w-full" rounded="md" /> : qrPreview || savedQrPreview ? <img src={qrPreview || savedQrPreview || ""} alt={t("qrPreview")} className="h-full w-full object-contain p-2" /> : <UploadCloud className="h-10 w-10 text-muted" aria-hidden="true" />}
              </div>
              </div>
            </FormField>
            <div className="flex items-center gap-3"><span className="text-sm font-semibold text-slate-700">{t("status")}</span><Switch label={t("status")} checked={config.isActive} onChange={(value) => setConfig({ ...config, isActive: value })} /><span className="text-sm text-slate-700">{t(config.isActive ? "active" : "inactive")}</span></div>
            </div>
            </div>
            </Card>
            <Card className="overflow-hidden p-0 shadow-none sm:p-0">
              <h3 className="flex items-center gap-2 border-b border-border bg-brand-soft px-4 py-3 text-sm font-semibold text-brand"><Settings className="h-4 w-4" />{t("integrationDetails")}</h3>
              <div className="space-y-4 p-4">
                <div className="grid items-start gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 sm:grid-cols-2 sm:gap-4">
                  <TextField label={t("ifsCode")} value={config.ifscCode} onChange={(value) => setConfig({ ...config, ifscCode: value.toUpperCase() })} maxLength={11} autoComplete="off" />
                  <div className="min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-5" aria-live="polite">
                    {ifscResult?.code === config.ifscCode && ifscResult.status === "loading" ? <div role="status" aria-label={t("ifscLoading")} className="space-y-2 py-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-full" /></div> : ifscResult?.code === config.ifscCode && ifscResult.status === "found" && ifscResult.data ? <dl><div className="flex gap-1"><dt className="shrink-0 font-semibold text-slate-700">{t("ifscBranch")}:</dt><dd className="min-w-0 break-words text-slate-800">{ifscResult.data.branch}</dd></div><div className="flex gap-1"><dt className="shrink-0 font-semibold text-slate-700">{t("ifscAddress")}:</dt><dd className="min-w-0 truncate text-muted" title={ifscResult.data.address}>{ifscResult.data.address}</dd></div></dl> : <p className="text-muted">{ifscResult?.code === config.ifscCode && ifscResult.status === "notFound" ? t("ifscNotFound") : ifscResult?.code === config.ifscCode && ifscResult.status === "error" ? t("ifscError") : t("ifscHint")}</p>}
                    {ifscResult?.code === config.ifscCode && ifscResult.status === "error" && <Button size="sm" variant="secondary" className="mt-2" onClick={() => setIfscRetry((value) => value + 1)}>{common("retry")}</Button>}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
                  <TextField label={t(field.label)} value={config[field.key]} onChange={(value) => setConfig({ ...config, [field.key]: value })} maxLength={field.max} type={field.secret && !visibleSecrets[field.key] ? "password" : "text"} autoComplete={field.secret ? "new-password" : "off"} trailing={field.secret ? <Button variant="ghost" size="sm" icon={visibleSecrets[field.key] ? EyeOff : Eye} aria-label={t(visibleSecrets[field.key] ? "hideValue" : "showValue", { field: t(field.label) })} aria-pressed={Boolean(visibleSecrets[field.key])} onClick={() => setVisibleSecrets((current) => ({ ...current, [field.key]: !current[field.key] }))} /> : undefined} />
                </div>)}
                </div>
              </div>
            </Card>
            </fieldset>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {config.id !== 0 && <Button variant="secondary" disabled={saving} onClick={() => { setConfig(emptyConfiguration()); setOriginalConfig(null); setVisibleSecrets({}); setError(""); setQrError(""); setRemoveQr(false); }}>{common("cancel")}</Button>}
              <Button type="submit" icon={Save} loading={saving} disabled={loading || Boolean(loadError)}>{t("save")}</Button>
            </div>
          </form>
        </Card>}
      </> : <>
        <DataTable data={mappings} columns={mappingColumns} loading={loading} getRowKey={(row) => String(row.id)} title={t("mapping")} description={t("mappingHint")} emptyTitle={t("noMappings")} emptyMessage={t("noMappingsHint")} actions={canEdit ? <Button icon={Plus} disabled={loading || Boolean(loadError)} onClick={() => { setMapping(emptyMapping()); setError(""); }}>{t("addMapping")}</Button> : undefined} rowActions={canEdit ? { render: (row) => <Button variant="ghost" size="sm" icon={Pencil} disabled={Boolean(loadError)} onClick={() => { setMapping({ ...row }); setError(""); }}>{t("edit")}</Button> } : undefined} />
        {mapping && <Modal open onClose={() => { if (!saving) { setMapping(null); setError(""); } }} title={t(mapping.id ? "editMapping" : "addMapping")} subtitle={t("mappingHint")} size="md" footer={<><Button variant="secondary" disabled={saving} onClick={() => { setMapping(null); setError(""); }}>{common("cancel")}</Button><Button type="submit" form="virtual-mapping-form" icon={Save} loading={saving}>{t("saveMapping")}</Button></>}>
          <form id="virtual-mapping-form" onSubmit={saveMapping} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField label={t("virtualAccount")} value={mapping.virtualId} onChange={(value) => setMapping({ ...mapping, virtualId: value })} options={configs.filter((row) => row.isActive || String(row.id) === mapping.virtualId).map((row) => ({ value: String(row.id), label: `${configName(String(row.id))}${row.isActive ? "" : ` (${t("inactive")})`}`}))} required />
              <SelectField label={t("orgBranch")} value={mapping.orgBranchId} onChange={(value) => setMapping({ ...mapping, orgBranchId: value })} options={[...(!branches.some((branch) => String(branch.branchId) === mapping.orgBranchId) && mapping.orgBranchId ? [{ value: mapping.orgBranchId, label: mapping.branchLabel || `#${mapping.orgBranchId}` }] : []), ...branches.map((branch) => ({ value: String(branch.branchId), label: `${branch.branchCode} · ${branch.branchName}` }))]} disabled={branchState !== "ready"} placeholder={branchState === "loading" ? t("branchesLoading") : undefined} required />
            </div>
            {branchState === "error" && <div className="flex flex-wrap items-center gap-2"><Alert tone="error">{t("branchesError")}</Alert><Button size="sm" variant="secondary" onClick={() => setBranchReload((value) => value + 1)}>{common("retry")}</Button></div>}
            {branchState === "ready" && branches.length === 0 && <Alert tone="info">{t("branchesEmpty")}</Alert>}
            <CheckboxField label={t("active")} checked={mapping.isActive} onChange={(value) => setMapping({ ...mapping, isActive: value })} />
          </form>
        </Modal>}
      </>}
    </div>
  );
}
