"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchStaffList, isStaffClientError, setStaffFieldStatus, fetchStaffModules, saveStaffModules, type StaffModuleOption } from "@/features/master/staff/services/staff-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type { PaginationMeta, Staff } from "@/features/master/staff/types/staff.types";

export function FieldStaffPreview({ active, branches }: { active: boolean; branches: Branch[] }) {
  const t = useTranslations("master.staff");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [fieldStaff, setFieldStaff] = useState<Staff[]>([]);
  const [available, setAvailable] = useState<Staff[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [selected, setSelected] = useState<Staff | null>(null);
  const [modules, setModules] = useState<StaffModuleOption[]>([]);
  const [moduleIds, setModuleIds] = useState<number[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [modulesSaving, setModulesSaving] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [moduleReload, setModuleReload] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [reload, setReload] = useState(0);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableError, setAvailableError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true); setLoadError(null);
    void fetchStaffList({ page, perPage: pageSize, isFieldStaff: 1 }).then((result) => {
      if (cancelled) return;
      setFieldStaff(result.items); setMeta(result.meta);
    }).catch((error: unknown) => {
      if (cancelled) return;
      if (isStaffClientError(error) && error.status === 401) { router.replace("/login"); router.refresh(); }
      else setLoadError(isStaffClientError(error) ? error.message : tErrors("generic"));
    }).finally(() => { if (!cancelled) { setLoading(false); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [active, page, pageSize, reload, router, tErrors]);

  async function loadAvailable() {
    setAvailableLoading(true); setAvailableError(null); setAvailable([]);
    try {
      const all: Staff[] = [];
      let next = 1;
      while (true) {
        const result = await fetchStaffList({ page: next, perPage: 200, isFieldStaff: 0 });
        all.push(...result.items);
        if (!result.meta?.hasMore || result.items.length === 0) break;
        next += 1;
      }
      setAvailable(all);
    } catch (error) {
      if (isStaffClientError(error) && error.status === 401) { router.replace("/login"); router.refresh(); }
      else setAvailableError(isStaffClientError(error) ? error.message : tErrors("generic"));
    } finally { setAvailableLoading(false); }
  }
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setModulesLoading(true); setModulesLoaded(false); setModulesError(null); setModules([]); setModuleIds([]);
    void fetchStaffModules(selected.staffId).then((result) => {
      if (cancelled) return;
      setModules(result.available);
      setModuleIds(result.assigned.map((module) => module.moduleId));
      setModulesLoaded(true);
    }).catch((error: unknown) => {
      if (cancelled) return;
      if (isStaffClientError(error) && error.status === 401) { router.replace("/login"); router.refresh(); }
      else setModulesError(isStaffClientError(error) ? error.message : tErrors("generic"));
    }).finally(() => { if (!cancelled) setModulesLoading(false); });
    return () => { cancelled = true; };
  }, [selected, moduleReload, router, tErrors]);
  async function saveModules() {
    if (!selected || modulesLoading || !modulesLoaded) return;
    setModulesSaving(true); setModulesError(null);
    try { await saveStaffModules(selected.staffId, moduleIds); setSelected(null); }
    catch (error) {
      if (isStaffClientError(error) && error.status === 401) { router.replace("/login"); router.refresh(); }
      else setModulesError(isStaffClientError(error) ? error.message : tErrors("generic"));
    } finally { setModulesSaving(false); }
  }
  function openAdd() { setChoice(""); setActionError(null); setAddOpen(true); void loadAvailable(); }
  async function addStaff() {
    const staff = available.find((item) => String(item.staffId) === choice);
    if (!staff) return;
    setSaving(true); setActionError(null);
    try {
      await setStaffFieldStatus(staff.staffId, true);
      setPage(1); setReload((current) => current + 1);
      setAddOpen(false);
    } catch (error) {
      if (isStaffClientError(error) && error.status === 401) { router.replace("/login"); router.refresh(); }
      else setActionError(isStaffClientError(error) ? error.message : tErrors("generic"));
    } finally { setSaving(false); }
  }
  async function removeStaff(id: number) {
    setSaving(true); setActionError(null);
    try {
      await setStaffFieldStatus(id, false);
      setPage(1); setReload((current) => current + 1);
    } catch (error) {
      if (isStaffClientError(error) && error.status === 401) { router.replace("/login"); router.refresh(); }
      else setActionError(isStaffClientError(error) ? error.message : tErrors("generic"));
    } finally { setSaving(false); }
  }
  const columns: DataTableColumn<Staff>[] = [
    { id: "code", header: t("columns.employeeCode"), cell: (row) => row.employeeCode },
    { id: "name", header: t("columns.fullName"), cell: (row) => row.fullName },
    { id: "branch", header: t("fields.branch"), cell: (row) => branches.find((branch) => branch.branchId === row.branchId)?.branchName ?? (row.branchId == null ? "—" : `#${row.branchId}`) },
    { id: "designation", header: t("columns.designation"), cell: (row) => row.designationName ?? "—" },
    { id: "mobile", header: t("columns.mobile"), cell: (row) => row.mobile ?? "—" },
  ];
  return <div className="space-y-4">
    {actionError && !addOpen && <p role="alert" className="text-sm text-rose-600">{actionError}</p>}
    <DataTable title={t("phoneAccess.fieldStaff")} description={t("phoneAccess.chooseStaff")} actions={<Button icon={Plus} onClick={openAdd} disabled={loading || !loaded || Boolean(loadError)}>{t("phoneAccess.addFieldStaff")}</Button>} loading={loading} error={Boolean(loadError)} errorTitle={t("loadErrorTitle")} errorMessage={loadError ?? undefined} onRetry={() => setReload((current) => current + 1)} data={fieldStaff} columns={columns} getRowKey={(row) => String(row.staffId)} emptyTitle={t("phoneAccess.emptyTitle")} emptyMessage={t("phoneAccess.emptyMessage")} minWidth="850px" rowActions={{ header: t("columns.actions"), render: (row) => <div className="flex items-center gap-2"><Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => { setModulesLoaded(false); setModulesLoading(true); setSelected(row); }}>{t("phoneAccess.configure")}</Button><Button size="sm" variant="danger" icon={Trash2} aria-label={`${t("phoneAccess.remove")} ${row.fullName}`} disabled={saving} onClick={() => void removeStaff(row.staffId)} /></div> }} pagination={{ page, pageSize, total: meta?.total ?? fieldStaff.length, totalPages: meta?.lastPage, pageSizeOptions: [10, 20, 50, 100], onPageChange: setPage, onPageSizeChange: (size) => { setPageSize(size); setPage(1); } }} />
    <Modal open={addOpen} onClose={() => { if (!saving) setAddOpen(false); }} title={t("phoneAccess.addFieldStaff")} size="md" footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>{t("cancel")}</Button><Button onClick={() => void addStaff()} disabled={!choice || availableLoading || saving}>{t("phoneAccess.add")}</Button></>}>
      <div className="space-y-4"><p className="text-sm text-muted">{t("fieldFlagNotice")}</p>{actionError && <p role="alert" className="text-sm text-rose-600">{actionError}</p>}{availableError && <p role="alert" className="text-sm text-rose-600">{availableError} <button type="button" className="underline" onClick={() => void loadAvailable()}>{t("phoneAccess.retry")}</button></p>}<SelectField label={t("phoneAccess.selectStaff")} value={choice} onChange={setChoice} disabled={availableLoading || Boolean(availableError)} searchable searchPlaceholder={tUi("selectSearch")} emptyMessage={tUi("selectEmpty")} placeholder={availableLoading ? t("phoneAccess.loading") : t("phoneAccess.selectStaff")} options={available.map((item) => ({ value: String(item.staffId), label: `${item.fullName} (${item.employeeCode})` }))} /></div>
    </Modal>
    <Modal open={selected !== null} onClose={() => { if (!modulesSaving) setSelected(null); }} title={t("phoneAccess.moduleTitle")} size="md" footer={<><Button variant="secondary" disabled={modulesSaving} onClick={() => setSelected(null)}>{t("cancel")}</Button><Button onClick={() => void saveModules()} loading={modulesSaving} disabled={modulesLoading || !modulesLoaded || moduleIds.length > 35}>{t("phoneAccess.saveModules")}</Button></>}>
      {selected && <div className="space-y-4"><p className="font-semibold text-slate-900">{selected.fullName} ({selected.employeeCode})</p><p className="text-sm text-muted">{t("phoneAccess.moduleNotice")}</p>{moduleIds.length > 35 && <p role="alert" className="text-sm text-rose-600">{t("phoneAccess.moduleLimit")}</p>}{modulesLoading && <div role="status" aria-label={t("loadingModules")} className="space-y-4"><Skeleton className="h-4 w-32" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-2"><Skeleton className="h-4 w-4 shrink-0" /><Skeleton className="h-4 w-36 max-w-full" /></div>)}</div></div>}{modulesError && <p role="alert" className="text-sm text-rose-600">{modulesError}{!modulesLoaded && <> <button type="button" className="underline" onClick={() => setModuleReload((value) => value + 1)}>{t("phoneAccess.retry")}</button></>}</p>}{modulesLoaded && <fieldset disabled={modulesSaving} className="grid gap-4 sm:grid-cols-2"><legend className="mb-3 text-sm font-semibold">{t("phoneAccess.availableModules")}</legend>{modules.length === 0 && <p className="text-sm text-muted">{t("phoneAccess.noModules")}</p>}{modules.map((module) => <CheckboxField key={module.moduleId} label={module.moduleName} checked={moduleIds.includes(module.moduleId)} onChange={(checked) => setModuleIds((current) => checked ? [...current, module.moduleId] : current.filter((id) => id !== module.moduleId))} />)}</fieldset>}</div>}
    </Modal>
  </div>;
}
