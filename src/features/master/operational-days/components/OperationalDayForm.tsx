"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { fetchOperationalDayList } from "@/features/master/operational-days/services/operational-days-client";
import {
  CheckboxField,
  SelectField,
  TextField,
} from "@/components/ui/Form";
import {
  operationalDayCreateInputSchema,
  operationalDayUpdateInputSchema,
} from "@/features/master/operational-days/schemas/operational-days.schema";
import type {
  OperationalDay,
  OperationalDayCreateInput,
  OperationalDayUpdateInput,
} from "@/features/master/operational-days/types/operational-days.types";

type Option = { value: string; label: string };

type OperationalDayFormProps = {
  open: boolean;
  mode: "create" | "edit";
  day: OperationalDay | null;
  branchOptions: Option[];
  dayOptions: Option[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (inputs: OperationalDayCreateInput[]) => Promise<number[]>;
  onUpdate: (inputs: OperationalDayUpdateInput[]) => Promise<number[]>;
};

type FormState = {
  branchId: string;
  dayOfWeek: string;
  isOperational: boolean;
  isHalfDay: boolean;
  openTime: string;
  closeTime: string;
  isActive: boolean;
};

function toFormState(
  day: OperationalDay | null,
  defaultBranchId: string,
): FormState {
  if (!day) {
    return {
      branchId: defaultBranchId,
      dayOfWeek: "1",
      isOperational: true,
      isHalfDay: false,
      openTime: "09:00",
      closeTime: "18:00",
      isActive: true,
    };
  }
  return {
    branchId: String(day.branchId),
    dayOfWeek: String(day.dayOfWeek),
    isOperational: day.isOperational,
    isHalfDay: day.isHalfDay,
    openTime: day.openTime ?? "",
    closeTime: day.closeTime ?? "",
    isActive: day.isActive,
  };
}

export function OperationalDayForm({
  open,
  mode,
  day,
  branchOptions,
  dayOptions,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: OperationalDayFormProps) {
  const t = useTranslations("master.operationalDays");
  const formKey = mode === "edit" ? `edit-${day?.recId ?? 0}` : "create";
  const defaultBranchId = branchOptions[0]?.value ?? "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="operational-day-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <OperationalDayFormBody
        key={formKey}
        mode={mode}
        open={open}
        day={day}
        branchOptions={branchOptions}
        dayOptions={dayOptions}
        defaultBranchId={defaultBranchId}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function OperationalDayFormBody({
  mode,
  open,
  day,
  branchOptions,
  dayOptions,
  defaultBranchId,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  open: boolean;
  day: OperationalDay | null;
  branchOptions: Option[];
  dayOptions: Option[];
  defaultBranchId: string;
  errorMessage?: string | null;
  onCreate: (inputs: OperationalDayCreateInput[]) => Promise<number[]>;
  onUpdate: (inputs: OperationalDayUpdateInput[]) => Promise<number[]>;
}) {
  const t = useTranslations("master.operationalDays");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() =>
    toFormState(day, defaultBranchId),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [existingDays, setExistingDays] = useState<OperationalDay[]>([]);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingError, setExistingError] = useState(false);
  const [loadedBranch, setLoadedBranch] = useState("");
  const [existingReload, setExistingReload] = useState(0);

  useEffect(() => {
    if (!open || !form.branchId) return;
    let cancelled = false;
    async function loadExistingDays() {
      setExistingLoading(true);
      setExistingError(false);
      setLoadedBranch("");
      setExistingDays([]);
      try {
        const result = await fetchOperationalDayList({ branchId: Number(form.branchId), page: 1, perPage: 200 });
        if (result.meta && result.meta.hasMore) throw new Error("Incomplete operational days list");
        if (!result.meta && result.items.length === 200) throw new Error("Missing operational days pagination");
        if (!cancelled) {
          setExistingDays(result.items);
          setLoadedBranch(form.branchId);
          if (mode === "edit" && day) {
            setSelectedDays(result.items.filter((item) =>
              (item.openTime ?? "").slice(0, 5) === (day.openTime ?? "").slice(0, 5) &&
              (item.closeTime ?? "").slice(0, 5) === (day.closeTime ?? "").slice(0, 5) &&
              item.isOperational === day.isOperational && item.isHalfDay === day.isHalfDay && item.isActive === day.isActive,
            ).map((item) => String(item.dayOfWeek)));
          }
        }
      } catch {
        if (!cancelled) setExistingError(true);
      } finally {
        if (!cancelled) setExistingLoading(false);
      }
    }
    void loadExistingDays();
    return () => { cancelled = true; };
  }, [open, mode, form.branchId, existingReload, day]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function normalizeTime(value: string): string {
    const trimmed = value.trim();
    if (/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(trimmed)) {
      return trimmed.slice(0, 5);
    }
    return trimmed;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (existingLoading || existingError || loadedBranch !== form.branchId) return;
    setFieldErrors({});

    const branchId = Number(form.branchId);
    const dayOfWeek = Number(form.dayOfWeek);
    const openTime = normalizeTime(form.openTime);
    const closeTime = normalizeTime(form.closeTime);
    const base = {
      branchId: Number.isFinite(branchId) ? branchId : 0,
      dayOfWeek: Number.isFinite(dayOfWeek) ? dayOfWeek : 0,
      isOperational: form.isOperational,
      isHalfDay: form.isHalfDay,
      openTime: openTime || null,
      closeTime: closeTime || null,
      isActive: form.isActive,
    };

    if (mode === "edit" && day) {
      const targets = existingDays.filter((item) => selectedDays.includes(String(item.dayOfWeek)));
      const payload: OperationalDayUpdateInput = {
        ...base,
        dayOfWeek: targets[0]?.dayOfWeek ?? 0,
        recId: targets[0]?.recId ?? day.recId,
      };
      const parsed = operationalDayUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          branchId: flat.branchId?.[0] ?? "",
          dayOfWeek: flat.dayOfWeek?.[0] ?? "",
          openTime: flat.openTime?.[0] ?? "",
          closeTime: flat.closeTime?.[0] ?? "",
        });
        return;
      }
      const failed = await onUpdate(targets.map((item) => ({
        ...parsed.data,
        recId: item.recId,
        dayOfWeek: item.dayOfWeek,
      })));
      if (failed.length) setSelectedDays(failed.map(String));
      return;
    }

    const newDays = selectedDays.filter((value) => !existingDays.some((item) => String(item.dayOfWeek) === value));
    const parsed = operationalDayCreateInputSchema.safeParse({
      ...base,
      dayOfWeek: newDays.length ? Number(newDays[0]) : 0,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        branchId: flat.branchId?.[0] ?? "",
        dayOfWeek: flat.dayOfWeek?.[0] ?? "",
        openTime: flat.openTime?.[0] ?? "",
        closeTime: flat.closeTime?.[0] ?? "",
      });
      return;
    }
    const failed = await onCreate(newDays.map((value) => ({
      ...parsed.data,
      dayOfWeek: Number(value),
    })));
    if (failed.length) {
      setSelectedDays(failed.map(String));
      setExistingReload((value) => value + 1);
    }
  }

  return (
    <form autoComplete="off"
      id="operational-day-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />
      {errorMessage ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <SelectField
        label={t("fields.branch")}
        value={form.branchId}
        required
        disabled={mode === "edit"}
        searchable
        placeholder={t("fields.branchPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.branchId || undefined}
        onChange={(branchId) => {
          updateField("branchId", branchId);
          if (mode === "create") setSelectedDays([]);
        }}
        options={branchOptions}
      />

      {(
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-600">{t("fields.dayOfWeek")} <span className="text-rose-500">*</span></legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {dayOptions.map((option) => {
              const existing = existingDays.find((item) => String(item.dayOfWeek) === option.value);
              const matches = existing &&
                normalizeTime(existing.openTime ?? "") === normalizeTime(form.openTime) &&
                normalizeTime(existing.closeTime ?? "") === normalizeTime(form.closeTime) &&
                existing.isOperational === form.isOperational &&
                existing.isHalfDay === form.isHalfDay &&
                existing.isActive === form.isActive;
              return <Checkbox
                key={option.value}
                label={mode === "create" && existing ? `${option.label} (${t("alreadyConfigured")})` : option.label}
                checked={mode === "edit" ? selectedDays.includes(option.value) : existing ? Boolean(matches) : selectedDays.includes(option.value)}
                disabled={(mode === "edit" ? !existing : Boolean(existing)) || existingLoading || existingError}
                onChange={(checked) => {
                  setSelectedDays((current) => checked
                    ? [...current, option.value]
                    : current.filter((value) => value !== option.value));
                  setFieldErrors((current) => ({ ...current, dayOfWeek: "" }));
                }}
              />;
            })}
          </div>
          {existingLoading ? <p className="text-xs text-muted">{t("loadingExisting")}</p> : null}
          {existingError ? <p role="alert" className="text-xs text-rose-600">{t("existingLoadError")}</p> : null}
          {fieldErrors.dayOfWeek ? <p role="alert" className="text-xs text-rose-600">{fieldErrors.dayOfWeek}</p> : null}
          <p className="text-xs text-muted">{t("multiDayHint")}</p>
          <p className="text-xs text-muted">{mode === "edit" ? t("editDaysHint") : t("existingDaysHint")}</p>
        </fieldset>
      )}

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
        <TextField
          label={t("fields.openTime")}
          type="time"
          value={form.openTime}
          error={fieldErrors.openTime || undefined}
          onChange={(value) => updateField("openTime", normalizeTime(value))}
        />
        <TextField
          label={t("fields.closeTime")}
          type="time"
          value={form.closeTime}
          error={fieldErrors.closeTime || undefined}
          onChange={(value) => updateField("closeTime", normalizeTime(value))}
        />
      </div>
      <p className="text-xs leading-5 text-muted">{t("hints.time")}</p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border">
        <CheckboxField
          label={t("fields.isOperational")}
          checked={form.isOperational}
          onChange={(checked) => updateField("isOperational", checked)}
        />
        <CheckboxField
          label={t("fields.isHalfDay")}
          checked={form.isHalfDay}
          onChange={(checked) => updateField("isHalfDay", checked)}
        />
        <CheckboxField
          label={t("fields.isActive")}
          checked={form.isActive}
          onChange={(checked) => updateField("isActive", checked)}
        />
      </div>
    </form>
  );
}
