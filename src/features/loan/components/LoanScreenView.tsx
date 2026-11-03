"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Save } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import {
  listLoanScreen,
  loanModulePage,
  loanScreens,
  type LoanRecord,
  type LoanScreenId,
} from "@/features/loan/loan-screen.data";

type LoanScreenViewProps = {
  screen: LoanScreenId;
};

export function LoanScreenView({ screen }: LoanScreenViewProps) {
  const config = loanScreens[screen];
  const t = useTranslations(`loanModule.screens.${screen}`);
  const tCommon = useTranslations("loanModule");
  const format = useFormatter();
  const [source, setSource] = useState<LoanRecord[]>(config.rows);
  const [rows, setRows] = useState<LoanRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<LoanRecord | null>(null);
  const [editing, setEditing] = useState<LoanRecord | "new" | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [formError, setFormError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();
  const pageMeta = useMemo(
    () => loanModulePage(config.href, `loanModule.screens.${screen}`),
    [config.href, screen],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listLoanScreen(screen, { page, perPage: pageSize, search: applied }, source);
      setRows(result.items);
      setTotal(result.total);
    } catch {
      setLoadError(tCommon("loadError"));
    } finally {
      setLoading(false);
    }
  }, [applied, page, pageSize, screen, source, tCommon]);

  useEffect(() => {
    if (search === applied) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setApplied(search);
      setSuccessMessage(null);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [applied, search, setSuccessMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (value: string | number | null | undefined) => {
    if (value == null || value === "") return tCommon("dash");
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return format.number(amount, { style: "currency", currency: "INR" });
  };

  const text = (value: string | number | null | undefined) =>
    value == null || value === "" ? tCommon("dash") : String(value);

  function display(record: LoanRecord, key: string, kind: string) {
    const value = record.values[key];
    if (kind === "money") return money(value);
    if (kind === "status") {
      return (
        <Badge tone={record.statusTone ?? "neutral"} caps>
          {text(value)}
        </Badge>
      );
    }
    return text(value);
  }

  const columns = useMemo<DataTableColumn<LoanRecord>[]>(
    () =>
      config.columns.map((column) => ({
        id: column.key,
        header: t(`columns.${column.key}`),
        align: column.kind === "money" ? "end" : "start",
        cell: (record) => display(record, column.key, column.kind),
      })),
    [config.columns, format, t, tCommon],
  );

  function openCreate() {
    const next: Record<string, string> = {};
    for (const column of config.columns) next[column.key] = "";
    setDraft(next);
    setEditing("new");
    setDirty(false);
    setFormError(null);
    setConfirmDiscard(false);
  }

  function openEdit(record: LoanRecord) {
    const next: Record<string, string> = {};
    for (const column of config.columns) {
      const value = record.values[column.key];
      next[column.key] = value == null ? "" : String(value);
    }
    setDraft(next);
    setEditing(record);
    setDirty(false);
    setFormError(null);
    setConfirmDiscard(false);
  }

  function requestClose() {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    setEditing(null);
  }

  function save() {
    const first = config.columns[0];
    if (!first || !draft[first.key]?.trim()) {
      setFormError(tCommon("required"));
      return;
    }
    const values: Record<string, string | number | null> = {};
    for (const column of config.columns) {
      const raw = draft[column.key]?.trim() ?? "";
      if (column.kind === "money") {
        values[column.key] = raw === "" ? null : Number(raw);
      } else {
        values[column.key] = raw;
      }
    }
    if (editing && editing !== "new") {
      setSource((current) =>
        current.map((record) =>
          record.id === editing.id ? { ...record, values } : record,
        ),
      );
      setSuccessMessage(tCommon("saved"));
    } else {
      setSource((current) => [{ id: `local-${Date.now()}`, values }, ...current]);
      setPage(1);
      setSuccessMessage(tCommon("created"));
    }
    setDirty(false);
    setEditing(null);
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />
      <FilterPanel
        onReset={() => {
          setSearch("");
          setApplied("");
          setPage(1);
          setSuccessMessage(null);
        }}
      >
        <div className="min-w-[12rem] sm:max-w-[18rem]">
          <TextField
            label={tCommon("search")}
            value={search}
            placeholder={tCommon("searchPlaceholder")}
            onChange={setSearch}
          />
        </div>
      </FilterPanel>
      <DataTable
        title={t("title")}
        description={t("description")}
        actions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {tCommon("add")}
          </Button>
        }
        data={rows}
        columns={columns}
        getRowKey={(record) => record.id}
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle={tCommon("emptyTitle")}
        emptyMessage={tCommon("emptyMessage")}
        minWidth="880px"
        pagination={{
          page,
          pageSize,
          total,
          pageSizeOptions: [20, 50, 100],
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        rowActions={{
          header: tCommon("actions"),
          render: (record) => (
            <div className="inline-flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={Eye}
                tooltip={tCommon("view")}
                onClick={() => setViewing(record)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={Pencil}
                tooltip={tCommon("edit")}
                onClick={() => openEdit(record)}
              />
            </div>
          ),
        }}
      />

      <Modal open={viewing != null} size="lg" title={t("title")} onClose={() => setViewing(null)}>
        {viewing ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {config.columns.map((column) => (
              <div key={column.key} className="rounded-xl border border-border bg-background p-3">
                <dt className="text-muted">{t(`columns.${column.key}`)}</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {display(viewing, column.key, column.kind)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={editing != null}
        size="lg"
        title={editing === "new" ? tCommon("add") : tCommon("edit")}
        onClose={requestClose}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={requestClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="button" icon={Save} onClick={save}>
              {tCommon("save")}
            </Button>
          </div>
        }
      >
        {confirmDiscard ? (
          <Alert tone="warning" className="mb-4">
            {tCommon("unsaved")}
            <span className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="danger" onClick={() => setEditing(null)}>
                {tCommon("discard")}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmDiscard(false)}>
                {tCommon("keepEditing")}
              </Button>
            </span>
          </Alert>
        ) : null}
        <PageToast message={formError} tone="error" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 *:min-w-0">
          {config.columns.map((column) => (
            <TextField
              key={column.key}
              label={t(`columns.${column.key}`)}
              value={draft[column.key] ?? ""}
              required={column.key === config.columns[0]?.key}
              restrict={column.kind === "money" ? "decimal" : undefined}
              onChange={(value) => {
                setDraft((current) => ({ ...current, [column.key]: value }));
                setDirty(true);
                setFormError(null);
              }}
            />
          ))}
        </div>
      </Modal>
    </ModulePageShell>
  );
}
