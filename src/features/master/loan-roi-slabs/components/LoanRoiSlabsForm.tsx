"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  DateField,
  SelectField,
  TextField,
} from "@/components/ui/Form";
import { loanSchemeSlabSaveInputSchema } from "../schemas/loan-roi-slabs.schema";
import { fetchLoanSchemeSlabs } from "../services/loan-roi-slabs-client";
import type {
  LoanSchemeChoice,
  LoanSchemeSlab,
  LoanSchemeSlabSaveInput,
} from "../types/loan-roi-slabs.types";

type LoanRoiSlabsFormProps = {
  mode: "create" | "edit";
  slab: LoanSchemeSlab | null;
  schemes: LoanSchemeChoice[];
  defaultDate: string;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: LoanSchemeSlabSaveInput) => Promise<void> | void;
};

type FormState = {
  schemeId: string;
  minAmount: string;
  maxAmount: string;
  roi: string;
  maxDuration: string;
  amtPer1000: string;
  effectFrom: string;
  isActive: boolean;
};

function createFormState(
  slab: LoanSchemeSlab | null,
  defaultDate: string,
): FormState {
  if (slab) {
    return {
      schemeId: String(slab.schemeId),
      minAmount: String(slab.minAmount),
      maxAmount: String(slab.maxAmount),
      roi: String(slab.roi),
      maxDuration: String(slab.maxDuration),
      amtPer1000: slab.amtPer1000 == null ? "" : String(slab.amtPer1000),
      effectFrom: slab.effectFrom,
      isActive: slab.isActive,
    };
  }
  return {
    schemeId: "",
    minAmount: "0",
    maxAmount: "",
    roi: "",
    maxDuration: "",
    amtPer1000: "",
    effectFrom: defaultDate,
    isActive: true,
  };
}

function readNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rangesOverlap(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number,
): boolean {
  return minA <= maxB && minB <= maxA;
}

export function LoanRoiSlabsForm({
  mode,
  slab,
  schemes,
  defaultDate,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: LoanRoiSlabsFormProps) {
  const t = useTranslations("master.loanRoiSlabs");

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "edit" ? t("editTitle") : t("createTitle")}
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
          <Button type="submit" form="loan-roi-slab-form" icon={Save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <LoanRoiSlabsFormBody
        mode={mode}
        slab={slab}
        schemes={schemes}
        defaultDate={defaultDate}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function LoanRoiSlabsFormBody({
  mode,
  slab,
  schemes,
  defaultDate,
  errorMessage,
  onSubmit,
}: {
  mode: "create" | "edit";
  slab: LoanSchemeSlab | null;
  schemes: LoanSchemeChoice[];
  defaultDate: string;
  errorMessage?: string | null;
  onSubmit: (input: LoanSchemeSlabSaveInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.loanRoiSlabs");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() =>
    createFormState(slab, defaultDate),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [peerState, setPeerState] = useState<{
    schemeId: string;
    items: LoanSchemeSlab[];
    complete: boolean;
  }>({ schemeId: "", items: [], complete: false });

  useEffect(() => {
    if (!form.schemeId) return;
    let cancelled = false;
    const schemeId = form.schemeId;
    async function loadPeers() {
      try {
        const result = await fetchLoanSchemeSlabs({
          schemeId: Number(schemeId),
          perPage: 200,
          isActive: 1,
        });
        if (cancelled) return;
        setPeerState({
          schemeId,
          items: result.items,
          complete: result.meta?.hasMore !== true,
        });
      } catch {
        if (!cancelled) {
          setPeerState({ schemeId, items: [], complete: false });
        }
      }
    }
    void loadPeers();
    return () => {
      cancelled = true;
    };
  }, [form.schemeId]);

  const selectedScheme = schemes.find(
    (scheme) => scheme.id === Number(form.schemeId),
  );
  const durationUnit =
    selectedScheme?.repayScheduleDesc ||
    slab?.repayScheduleDesc ||
    t("fields.durationUnit");

  const schemeOptions = useMemo(() => {
    const visible = schemes.filter(
      (scheme) => scheme.isActive || scheme.id === Number(form.schemeId),
    );
    const options = visible.map((scheme) => ({
      value: String(scheme.id),
      label: `${scheme.schemeName} (${scheme.schemeCode})`,
    }));
    if (
      slab &&
      !options.some((option) => option.value === String(slab.schemeId))
    ) {
      options.unshift({
        value: String(slab.schemeId),
        label: `${slab.schemeName} (${slab.schemeCode})`,
      });
    }
    return options;
  }, [form.schemeId, schemes, slab]);

  const overlap = useMemo(() => {
    if (!form.isActive || peerState.schemeId !== form.schemeId || !peerState.complete) {
      return null;
    }
    const minAmount = readNumber(form.minAmount);
    const maxAmount = readNumber(form.maxAmount);
    if (minAmount == null || maxAmount == null || !form.effectFrom) return null;
    return (
      peerState.items.find((peer) => {
        if (slab && peer.id === slab.id) return false;
        if (peer.effectFrom.slice(0, 10) !== form.effectFrom) return false;
        return rangesOverlap(minAmount, maxAmount, peer.minAmount, peer.maxAmount);
      }) ?? null
    );
  }, [
    form.effectFrom,
    form.isActive,
    form.maxAmount,
    form.minAmount,
    form.schemeId,
    peerState,
    slab,
  ]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = loanSchemeSlabSaveInputSchema.safeParse({
      ...(mode === "edit" && slab ? { id: slab.id } : {}),
      schemeId: readNumber(form.schemeId),
      minAmount: readNumber(form.minAmount),
      maxAmount: readNumber(form.maxAmount),
      roi: readNumber(form.roi),
      maxDuration: readNumber(form.maxDuration),
      amtPer1000:
        form.amtPer1000.trim() === "" ? null : readNumber(form.amtPer1000),
      effectFrom: form.effectFrom,
      isActive: form.isActive,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const message = (key: string) =>
        flat[key as keyof typeof flat]?.length ? t(`errors.${key}`) : "";
      setFieldErrors({
        schemeId: message("schemeId"),
        minAmount: message("minAmount"),
        maxAmount: message("maxAmount"),
        roi: message("roi"),
        maxDuration: message("maxDuration"),
        amtPer1000: message("amtPer1000"),
        effectFrom: message("effectFrom"),
      });
      return;
    }

    if (overlap) {
      setFieldErrors({ maxAmount: t("overlapWarning") });
      return;
    }

    await onSubmit(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="loan-roi-slab-form"
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      {overlap ? (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("overlapWarning")}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={t("fields.scheme")}
          value={form.schemeId}
          required
          placeholder={t("fields.schemePlaceholder")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          error={fieldErrors.schemeId || undefined}
          onChange={(schemeId) => updateField("schemeId", schemeId)}
          options={schemeOptions}
        />
        <DateField
          label={t("fields.effectFrom")}
          value={form.effectFrom}
          required
          error={fieldErrors.effectFrom || undefined}
          onChange={(effectFrom) => updateField("effectFrom", effectFrom)}
        />
        <TextField
          label={t("fields.minAmount")}
          value={form.minAmount}
          required
          inputMode="numeric"
          error={fieldErrors.minAmount || undefined}
          onChange={(value) => updateField("minAmount", value)}
        />
        <TextField
          label={t("fields.maxAmount")}
          value={form.maxAmount}
          required
          inputMode="numeric"
          error={fieldErrors.maxAmount || undefined}
          onChange={(value) => updateField("maxAmount", value)}
        />
        <TextField
          label={t("fields.roi")}
          value={form.roi}
          required
          inputMode="decimal"
          error={fieldErrors.roi || undefined}
          onChange={(value) => updateField("roi", value)}
        />
        <TextField
          label={t("fields.maxDuration")}
          value={form.maxDuration}
          required
          inputMode="numeric"
          hint={t("fields.maxDurationHint", { unit: durationUnit })}
          error={fieldErrors.maxDuration || undefined}
          onChange={(value) => updateField("maxDuration", value)}
        />
        <TextField
          label={t("fields.amtPer1000")}
          value={form.amtPer1000}
          inputMode="decimal"
          hint={t("fields.amtPer1000Hint")}
          error={fieldErrors.amtPer1000 || undefined}
          onChange={(value) => updateField("amtPer1000", value)}
        />
        <div className="flex items-end pb-2">
          <CheckboxField
            label={t("fields.isActive")}
            checked={form.isActive}
            onChange={(isActive) => updateField("isActive", isActive)}
          />
        </div>
      </div>
    </form>
  );
}
