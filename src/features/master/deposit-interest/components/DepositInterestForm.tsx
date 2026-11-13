"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  TextField,
  SelectField,
  DateField,
} from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";
import { depositSchemeSlabSaveInputSchema } from "../schemas/deposit-interest.schema";
import { fetchDepositSchemeSlabs } from "../services/deposit-interest-client";
import type {
  DepositSchemeSlab,
  DepositSchemeSlabSaveInput,
} from "../types/deposit-interest.types";

type DepositInterestFormProps = {
  open: boolean;
  schemes?: { id: number; schemeName: string }[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: DepositSchemeSlabSaveInput) => Promise<void> | void;
};

type FormState = {
  schemeId: string;
  minDuration: string;
  maxDuration: string;
  termCd: string;
  roi: string;
  lockPeriod: string;
  effectFrm: string;
  effectUpto: string;
  isActive: boolean;
};

function checkRangeOverlap(minA: number, maxA: number, minB: number, maxB: number): boolean {
  return minA <= maxB && minB <= maxA;
}

function checkDateOverlap(
  startA: string,
  endA: string | null | undefined,
  startB: string,
  endB: string | null | undefined,
): boolean {
  if (!startA || !startB) return false;
  const aStartsBeforeBEnds = !endB || startA <= endB;
  const bStartsBeforeAEnds = !endA || startB <= endA;
  return aStartsBeforeBEnds && bStartsBeforeAEnds;
}

function createInitialFormState(): FormState {
  return {
    schemeId: "",
    minDuration: "1",
    maxDuration: "",
    termCd: "1", // Days by default
    roi: "",
    lockPeriod: "",
    effectFrm: new Date().toISOString().split("T")[0],
    effectUpto: "",
    isActive: true,
  };
}

export function DepositInterestForm({
  open,
  schemes,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: DepositInterestFormProps) {
  const t = useTranslations("master.depositInterest");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("createTitle", { fallback: "Add Deposit Interest Slab" })}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("cancel", { fallback: "Cancel" })}
          </Button>
          <Button
            type="submit"
            form="deposit-interest-form"
            icon={Save}
            disabled={saving}
          >
            {saving
              ? t("saving", { fallback: "Saving..." })
              : t("save", { fallback: "Save Slab" })}
          </Button>
        </>
      }
    >
      <DepositInterestFormBody
        schemes={schemes}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function DepositInterestFormBody({
  schemes,
  errorMessage,
  onSubmit,
}: {
  schemes?: { id: number; schemeName: string }[];
  errorMessage?: string | null;
  onSubmit: (input: DepositSchemeSlabSaveInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.depositInterest");
  const tUi = useTranslations("ui");

  const [form, setForm] = useState<FormState>(createInitialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState<string | null>(null);

  const [termOptions, setTermOptions] = useState<ApplOption[]>([]);
  const [existingSchemeSlabs, setExistingSchemeSlabs] = useState<DepositSchemeSlab[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadTerms() {
      try {
        const opts = await fetchApplOptions(7); // Group 7: Term
        if (!cancelled) setTermOptions(opts);
      } catch {
        // fallback
      }
    }
    void loadTerms();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.schemeId) {
      setExistingSchemeSlabs([]);
      return;
    }

    let cancelled = false;
    async function loadSlabs() {
      try {
        const res = await fetchDepositSchemeSlabs({
          schemeId: Number(form.schemeId),
          perPage: 200,
        });
        if (!cancelled) {
          setExistingSchemeSlabs(res.items);
        }
      } catch {
        // ignore fallback
      }
    }
    void loadSlabs();
    return () => {
      cancelled = true;
    };
  }, [form.schemeId]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setInternalError(null);
  }

  // Conflict detection: active slab with same scheme, same term_cd, overlapping duration, and overlapping date
  const conflictingActiveSlab = useMemo(() => {
    if (
      !form.schemeId ||
      !form.termCd ||
      !form.minDuration ||
      !form.maxDuration ||
      !form.effectFrm
    ) {
      return null;
    }

    const schemeNum = Number(form.schemeId);
    const termCdNum = Number(form.termCd);
    const minD = Number(form.minDuration);
    const maxD = Number(form.maxDuration);

    if (minD < 1 || maxD < minD) return null;

    return (
      existingSchemeSlabs.find((s) => {
        if (s.schemeId !== schemeNum || s.termCd !== termCdNum) return false;
        // Only active existing slabs cause restriction
        if (!s.isActive) return false;

        const durationOverlaps = checkRangeOverlap(minD, maxD, s.minDuration, s.maxDuration);
        const dateOverlaps = checkDateOverlap(form.effectFrm, form.effectUpto, s.effectFrm, s.effectUpto);

        return durationOverlaps && dateOverlaps;
      }) ?? null
    );
  }, [
    form.schemeId,
    form.termCd,
    form.minDuration,
    form.maxDuration,
    form.effectFrm,
    form.effectUpto,
    existingSchemeSlabs,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setInternalError(null);

    // Overlap validation
    if (conflictingActiveSlab) {
      const durationRange = `${conflictingActiveSlab.minDuration}–${conflictingActiveSlab.maxDuration} ${conflictingActiveSlab.termDesc}`;
      const dateRange = `${conflictingActiveSlab.effectFrm} → ${conflictingActiveSlab.effectUpto || t("fields.openEnded", { fallback: "Open-ended" })}`;
      const errorMsg = t("errors.activeSlabOverlap", {
        duration: durationRange,
        from: conflictingActiveSlab.effectFrm,
        to: conflictingActiveSlab.effectUpto || t("fields.openEnded", { fallback: "Open-ended" }),
        fallback: `An active interest slab (${durationRange}, ${dateRange}) already exists for this scheme. Please deactivate the previous active slab before creating a new one.`,
      });
      setFieldErrors((prev) => ({
        ...prev,
        minDuration: errorMsg,
        maxDuration: errorMsg,
      }));
      setInternalError(errorMsg);
      return;
    }

    const payload: DepositSchemeSlabSaveInput = {
      schemeId:
        form.schemeId !== "" ? Number(form.schemeId) : (0 as unknown as number),
      minDuration:
        form.minDuration !== "" ? Number(form.minDuration) : (0 as unknown as number),
      maxDuration:
        form.maxDuration !== "" ? Number(form.maxDuration) : (0 as unknown as number),
      termCd:
        form.termCd !== "" ? Number(form.termCd) : (0 as unknown as number),
      roi: form.roi !== "" ? Number(form.roi) : (NaN as unknown as number),
      lockPeriod: form.lockPeriod !== "" ? Number(form.lockPeriod) : null,
      effectFrm: form.effectFrm,
      effectUpto: form.effectUpto !== "" ? form.effectUpto : null,
      isActive: form.isActive,
    };

    const parsed = depositSchemeSlabSaveInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const isMaxLessThanMin =
        Number(form.maxDuration) < Number(form.minDuration);
      const isEffectUptoBeforeFrom = Boolean(
        form.effectUpto && form.effectFrm && form.effectUpto < form.effectFrm,
      );

      setFieldErrors({
        schemeId: flat.schemeId ? t("errors.schemeId", { fallback: "Scheme is required" }) : "",
        termCd: flat.termCd ? t("errors.termCd", { fallback: "Term unit is required" }) : "",
        minDuration: flat.minDuration
          ? t("errors.minDuration", { fallback: "Min duration must be ≥ 1" })
          : "",
        maxDuration: flat.maxDuration
          ? isMaxLessThanMin
            ? t("errors.maxDurationGteMin", {
                fallback: "Max duration must be ≥ min duration",
              })
            : t("errors.maxDuration", { fallback: "Max duration is required" })
          : "",
        roi: flat.roi ? t("errors.roi", { fallback: "Valid RoI (0–100%) is required" }) : "",
        lockPeriod: flat.lockPeriod
          ? t("errors.lockPeriod", { fallback: "Lock period must be ≥ 0" })
          : "",
        effectFrm: flat.effectFrm
          ? t("errors.effectFrom", { fallback: "Effective From date is required" })
          : "",
        effectUpto: flat.effectUpto
          ? isEffectUptoBeforeFrom
            ? t("errors.effectToAfterFrom", {
                fallback: "Effective Upto must be on or after Effective From",
              })
            : t("errors.effectTo", { fallback: "Effective Upto date is required" })
          : "",
      });
      return;
    }

    await onSubmit(parsed.data);
  }

  const schemeSelectOptions =
    schemes && schemes.length > 0
      ? schemes.map((s) => ({ value: String(s.id), label: s.schemeName }))
      : [];

  const termSelectOptions =
    termOptions.length > 0
      ? termOptions.map((o) => ({
          value: String(o.optCode),
          label: o.optDescription,
        }))
      : [
          { value: "1", label: "Days" },
          { value: "2", label: "Months" },
          { value: "3", label: "Year" },
        ];

  const selectedTermLabel =
    termSelectOptions.find((o) => o.value === form.termCd)?.label || "Units";

  const displayError = internalError || errorMessage || null;

  return (
    <form autoComplete="off"
      id="deposit-interest-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={displayError} tone="error" />

      {conflictingActiveSlab ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300/80 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-xs dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950 dark:text-amber-100">
              {t("errors.activeSlabOverlapWarningTitle", {
                fallback: "Active Slab Conflict Detected",
              })}
            </p>
            <p className="leading-relaxed">
              {t("errors.activeSlabOverlap", {
                duration: `${conflictingActiveSlab.minDuration}–${conflictingActiveSlab.maxDuration} ${conflictingActiveSlab.termDesc}`,
                from: conflictingActiveSlab.effectFrm,
                to:
                  conflictingActiveSlab.effectUpto ||
                  t("fields.openEnded", { fallback: "Open-ended" }),
                fallback: `An active interest slab (${conflictingActiveSlab.minDuration}–${conflictingActiveSlab.maxDuration} ${conflictingActiveSlab.termDesc}, ${conflictingActiveSlab.effectFrm} → ${conflictingActiveSlab.effectUpto || "Open-ended"}) already exists for this scheme. Please deactivate the previous active slab before creating a new one.`,
              })}
            </p>
          </div>
        </div>
      ) : null}

      <SelectField
        label={t("fields.scheme", { fallback: "Deposit Scheme" })}
        value={form.schemeId}
        required
        error={fieldErrors.schemeId || undefined}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        options={schemeSelectOptions}
        onChange={(value) => updateField("schemeId", value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label={t("fields.termType", { fallback: "Term Unit" })}
          value={form.termCd}
          required
          error={fieldErrors.termCd || undefined}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          options={termSelectOptions}
          onChange={(value) => updateField("termCd", value)}
        />
        <TextField
          label={`${t("fields.minDuration", { fallback: "Min Duration" })} (${selectedTermLabel})`}
          value={form.minDuration}
          type="number"
          min="1"
          required
          error={fieldErrors.minDuration || undefined}
          onChange={(value) => updateField("minDuration", value)}
        />
        <TextField
          label={`${t("fields.maxDuration", { fallback: "Max Duration" })} (${selectedTermLabel})`}
          value={form.maxDuration}
          type="number"
          min={form.minDuration || "1"}
          required
          error={fieldErrors.maxDuration || undefined}
          onChange={(value) => updateField("maxDuration", value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label={t("fields.roi", { fallback: "Rate of Interest (%)" })}
          value={form.roi}
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="e.g. 5.25"
          required
          error={fieldErrors.roi || undefined}
          onChange={(value) => updateField("roi", value)}
        />
        <TextField
          label={`${t("fields.lockPeriod", { fallback: "Lock Period" })} (${selectedTermLabel})`}
          value={form.lockPeriod}
          type="number"
          min="0"
          placeholder="e.g. 7 (Optional)"
          error={fieldErrors.lockPeriod || undefined}
          onChange={(value) => updateField("lockPeriod", value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          label={t("fields.effectFrom", { fallback: "Effective From" })}
          value={form.effectFrm}
          required
          error={fieldErrors.effectFrm || undefined}
          onChange={(value) => updateField("effectFrm", value)}
        />
        <DateField
          label={t("fields.effectTo", { fallback: "Effective Upto" })}
          value={form.effectUpto}
          error={fieldErrors.effectUpto || undefined}
          onChange={(value) => updateField("effectUpto", value)}
        />
      </div>

      <CheckboxField
        label={t("fields.isActive", { fallback: "Status (Active)" })}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
    </form>
  );
}
