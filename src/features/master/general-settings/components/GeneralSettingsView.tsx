"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Search, PowerOff, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { SelectField, TextField } from "@/components/ui/Form";
import { showToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  bulkChangeGeneralSettingStatus,
  changeGeneralSettingStatus,
  fetchGeneralSettings,
  isGeneralSettingsClientError,
} from "@/features/master/general-settings/services/general-settings-client";
import type { GeneralSetting } from "@/features/master/general-settings/types/general-settings.types";

/** `GrpNo` values with a translated heading; anything else falls back to "Group {number}". */
const KNOWN_GROUPS = new Set([1, 2, 3, 4, 5, 6]);
const PREVIEW_LIMIT = 5;

type StatusFilter = "all" | "active" | "inactive";
type BulkTarget = { isActive: boolean; ids: number[] };

function SelectBox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <input autoComplete="off"
      type="checkbox"
      ref={(node) => {
        if (node) node.indeterminate = indeterminate && !checked;
      }}
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-border text-brand focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

type GeneralSettingsViewProps = {
  canEdit: boolean;
};

export function GeneralSettingsView({ canEdit }: GeneralSettingsViewProps) {
  const t = useTranslations("master.generalSettings");
  const [items, setItems] = useState<GeneralSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState<ReadonlySet<number>>(new Set());
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<BulkTarget | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchGeneralSettings(controller.signal)
      .then((rows) => {
        setItems(rows);
        setSelected(new Set());
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(isGeneralSettingsClientError(err) ? err.message : t("loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey, t]);

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!term) return true;
      return item.purpose.toLowerCase().includes(term) || item.code.toLowerCase().includes(term);
    });
  }, [items, search, statusFilter]);

  const groups = useMemo(() => {
    const byGroup = new Map<number, GeneralSetting[]>();
    for (const item of visible) {
      const list = byGroup.get(item.groupNo) ?? [];
      list.push(item);
      byGroup.set(item.groupNo, list);
    }
    return [...byGroup.entries()].sort(([a], [b]) => a - b);
  }, [visible]);

  const selectedItems = useMemo(
    () => visible.filter((item) => selected.has(item.id)),
    [visible, selected],
  );
  const allVisibleSelected = visible.length > 0 && selectedItems.length === visible.length;

  const updateSearch = (value: string) => {
    setSearch(value);
    setSelected(new Set());
  };

  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setSelected(new Set());
  };

  const setSelection = (ids: number[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const toggle = useCallback(
    async (setting: GeneralSetting, next: boolean) => {
      setPending((prev) => new Set(prev).add(setting.id));
      setItems((prev) => prev.map((item) => (item.id === setting.id ? { ...item, isActive: next } : item)));
      try {
        const result = await changeGeneralSettingStatus({ id: setting.id, isActive: next });
        if (result.item) {
          const saved = result.item;
          setItems((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        }
        showToast(
          next
            ? t("activated", { purpose: setting.purpose })
            : t("deactivated", { purpose: setting.purpose }),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((item) => (item.id === setting.id ? { ...item, isActive: setting.isActive } : item)),
        );
        showToast(isGeneralSettingsClientError(err) ? err.message : t("updateError"), "error");
      } finally {
        setPending((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(setting.id);
          return nextSet;
        });
      }
    },
    [t],
  );

  const requestBulk = (isActive: boolean) => {
    const ids = selectedItems.filter((item) => item.isActive !== isActive).map((item) => item.id);
    if (ids.length === 0) {
      showToast(
        isActive ? t("bulk.alreadyActive") : t("bulk.alreadyInactive"),
        "info",
      );
      return;
    }
    setBulkTarget({ isActive, ids });
  };

  const runBulk = async () => {
    if (!bulkTarget) return;
    const { ids, isActive } = bulkTarget;
    setBulkBusy(true);
    try {
      const result = await bulkChangeGeneralSettingStatus({ ids, isActive });
      const saved = new Map(result.items.map((item) => [item.id, item]));
      setItems((prev) =>
        prev.map((item) => saved.get(item.id) ?? (ids.includes(item.id) ? { ...item, isActive } : item)),
      );
      setSelected(new Set());
      showToast(
        isActive
          ? t("bulk.activatedCount", { count: ids.length })
          : t("bulk.deactivatedCount", { count: ids.length }),
      );
    } catch (err) {
      showToast(isGeneralSettingsClientError(err) ? err.message : t("updateError"), "error");
    } finally {
      setBulkBusy(false);
      setBulkTarget(null);
    }
  };

  const bulkPreview = useMemo(() => {
    if (!bulkTarget) return [];
    const ids = new Set(bulkTarget.ids);
    return items.filter((item) => ids.has(item.id));
  }, [bulkTarget, items]);

  const statusOptions = [
    { value: "all", label: t("filters.all") },
    { value: "active", label: t("filters.active") },
    { value: "inactive", label: t("filters.inactive") },
  ];

  const showContent = !loading && !error && items.length > 0 && groups.length > 0;

  return (
    <Card
      title={t("title")}
      description={t("description")}
      trailing={
        !loading && !error && items.length > 0 ? (
          <Badge tone="info">{t("summary", { active: activeCount, total: items.length })}</Badge>
        ) : null
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        {!canEdit ? <Alert tone="info">{t("readOnly")}</Alert> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <TextField
            label={t("filters.search")}
            value={search}
            onChange={updateSearch}
            placeholder={t("filters.searchPlaceholder")}
            type="search"
            trailing={<Search className="h-4 w-4 text-muted" aria-hidden="true" />}
          />
          <SelectField
            label={t("filters.status")}
            value={statusFilter}
            searchable={false}
            options={statusOptions}
            onChange={(value) => updateStatusFilter((value || "all") as StatusFilter)}
          />
        </div>

        {canEdit && showContent ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/60 px-4 py-2.5"
            role="toolbar"
            aria-label={t("bulk.toolbar")}
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <SelectBox
                checked={allVisibleSelected}
                indeterminate={selectedItems.length > 0}
                disabled={bulkBusy}
                label={t("bulk.selectAll")}
                onChange={(on) => setSelection(visible.map((item) => item.id), on)}
              />
              <span aria-live="polite">
                {selectedItems.length > 0
                  ? t("bulk.selected", { count: selectedItems.length })
                  : t("bulk.selectAll")}
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="success"
                icon={CheckCircle2}
                disabled={selectedItems.length === 0 || bulkBusy}
                onClick={() => requestBulk(true)}
              >
                {t("bulk.activate")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="warning"
                icon={PowerOff}
                disabled={selectedItems.length === 0 || bulkBusy}
                onClick={() => requestBulk(false)}
              >
                {t("bulk.deactivate")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={X}
                disabled={selectedItems.length === 0 || bulkBusy}
                onClick={() => setSelected(new Set())}
              >
                {t("bulk.clear")}
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label={t("loading")}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title={t("loadErrorTitle")}
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : items.length === 0 ? (
          <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} />
        ) : groups.length === 0 ? (
          <EmptyState title={t("noMatchTitle")} message={t("noMatchMessage")} />
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map(([groupNo, settings]) => {
              const groupTitle = KNOWN_GROUPS.has(groupNo)
                ? t(`groups.${groupNo}`)
                : t("groupFallback", { number: groupNo });
              const groupSelected = settings.filter((s) => selected.has(s.id)).length;
              return (
                <section
                  key={groupNo}
                  aria-labelledby={`general-settings-group-${groupNo}`}
                  className="rounded-xl border border-border"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted/60 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {canEdit ? (
                        <SelectBox
                          checked={groupSelected === settings.length}
                          indeterminate={groupSelected > 0}
                          disabled={bulkBusy}
                          label={t("bulk.selectGroup", { group: groupTitle })}
                          onChange={(on) => setSelection(settings.map((s) => s.id), on)}
                        />
                      ) : null}
                      <h3
                        id={`general-settings-group-${groupNo}`}
                        className="text-sm font-semibold text-slate-900"
                      >
                        {groupTitle}
                      </h3>
                    </div>
                    <span className="text-xs text-muted">
                      {t("groupSummary", {
                        active: settings.filter((s) => s.isActive).length,
                        total: settings.length,
                      })}
                    </span>
                  </header>
                  <ul className="divide-y divide-border">
                    {settings.map((setting) => {
                      const busy = pending.has(setting.id) || (bulkBusy && Boolean(bulkTarget?.ids.includes(setting.id)));
                      const isSelected = selected.has(setting.id);
                      return (
                        <li
                          key={setting.id}
                          className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                            isSelected ? "bg-brand/5" : ""
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {canEdit ? (
                              <span className="pt-0.5">
                                <SelectBox
                                  checked={isSelected}
                                  disabled={bulkBusy}
                                  label={t("bulk.selectRow", { purpose: setting.purpose })}
                                  onChange={(on) => setSelection([setting.id], on)}
                                />
                              </span>
                            ) : null}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">{setting.purpose}</p>
                              <p className="mt-0.5 font-mono text-xs text-muted">{setting.code}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 ps-7 sm:ps-0">
                            <Badge tone={setting.isActive ? "success" : "neutral"}>
                              {setting.isActive ? t("status.active") : t("status.inactive")}
                            </Badge>
                            <Switch
                              checked={setting.isActive}
                              busy={busy}
                              disabled={!canEdit || bulkBusy}
                              label={t("toggleLabel", { purpose: setting.purpose })}
                              onChange={(next) => void toggle(setting, next)}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={bulkTarget != null}
        onClose={() => {
          if (!bulkBusy) setBulkTarget(null);
        }}
        onConfirm={runBulk}
        loading={bulkBusy}
        actionType={bulkTarget?.isActive ? "activate" : "deactivate"}
        title={
          bulkTarget?.isActive
            ? t("bulk.activateTitle", { count: bulkTarget.ids.length })
            : t("bulk.deactivateTitle", { count: bulkTarget?.ids.length ?? 0 })
        }
        description={bulkTarget?.isActive ? t("bulk.activateDescription") : t("bulk.deactivateDescription")}
        confirmLabel={bulkTarget?.isActive ? t("bulk.activate") : t("bulk.deactivate")}
      >
        <ul className="space-y-1.5 rounded-xl border border-border bg-surface-muted/70 p-3 text-sm text-slate-700">
          {bulkPreview.slice(0, PREVIEW_LIMIT).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">{item.purpose}</span>
              <span className="shrink-0 font-mono text-xs text-muted">{item.code}</span>
            </li>
          ))}
          {bulkPreview.length > PREVIEW_LIMIT ? (
            <li className="text-xs text-muted">
              {t("bulk.andMore", { count: bulkPreview.length - PREVIEW_LIMIT })}
            </li>
          ) : null}
        </ul>
      </ConfirmDialog>
    </Card>
  );
}
