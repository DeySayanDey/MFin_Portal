"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectField } from "@/components/ui/Form";
import { FIGURE_PERCENT_OPT_CODE } from "@/features/master/charges-setup/constants";
import { fetchChargeSetups } from "@/features/master/charges-setup/services/charges-setup-client";
import type { ChargeSetup } from "@/features/master/charges-setup/types/charges-setup.types";
import { loanSchemeChargeSaveInputSchema } from "../schemas/loan-schemes.schema";
import { fetchLoanSchemeCharges } from "../services/loan-schemes-client";
import type {
  LoanSchemeCharge,
  LoanSchemeChargeSaveInput,
} from "../types/loan-schemes.types";

type LoanSchemeChargesFormProps = {
  open: boolean;
  mode: "create" | "edit";
  charge: LoanSchemeCharge | null;
  schemes?: { id: number; schemeName: string }[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: LoanSchemeChargeSaveInput) => Promise<void> | void;
};

const MAX_PAGES = 10;

export function LoanSchemeChargesForm({
  open,
  mode,
  charge,
  schemes = [],
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: LoanSchemeChargesFormProps) {
  const t = useTranslations("master.loanSchemes.charges");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const formKey = mode === "edit" ? `edit-${charge?.schemeId ?? 0}` : "create";

  const [schemeId, setSchemeId] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [masterCharges, setMasterCharges] = useState<ChargeSetup[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    schemeId?: string;
    chargeIds?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setSchemeId(charge?.schemeId ? String(charge.schemeId) : "");
      setSelectedIds([]);
      setFieldErrors({});
      setOptionsError(null);
      setLoadingOptions(true);
      try {
        const charges = await loadActiveMasterCharges();
        if (cancelled) return;
        setMasterCharges(charges);
        if (mode === "edit" && charge) {
          const mappedIds = await loadActiveSchemeChargeIds(charge.schemeId);
          if (cancelled) return;
          const allowed = new Set(charges.map((item) => item.chargeId));
          setSelectedIds(mappedIds.filter((id) => allowed.has(id)));
        }
      } catch {
        if (!cancelled) setOptionsError(tErrors("generic"));
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, formKey, mode, charge, tErrors]);

  function toggleCharge(chargeId: number, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(chargeId) ? current : [...current, chargeId];
      }
      return current.filter((id) => id !== chargeId);
    });
    setFieldErrors((current) => ({ ...current, chargeIds: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadingOptions || saving) return;

    const parsed = loanSchemeChargeSaveInputSchema.safeParse({
      schemeId: schemeId ? Number(schemeId) : 0,
      chargeIds: selectedIds,
      mode,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        schemeId: flat.schemeId ? t("errors.schemeId") : undefined,
        chargeIds: flat.chargeIds ? t("errors.chargeIds") : undefined,
      });
      return;
    }

    setFieldErrors({});
    void onSubmit(parsed.data);
  }

  const schemeOptions = schemes.map((scheme) => ({
    value: String(scheme.id),
    label: scheme.schemeName,
  }));
  if (
    charge?.schemeId &&
    !schemeOptions.some((option) => option.value === String(charge.schemeId))
  ) {
    schemeOptions.unshift({
      value: String(charge.schemeId),
      label: charge.schemeName || String(charge.schemeId),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="lg"
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
            form="loan-scheme-charges-form"
            icon={Save}
            disabled={saving || loadingOptions}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <form autoComplete="off"
        id="loan-scheme-charges-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <PageToast message={errorMessage ?? optionsError} tone="error" />
        <p className="text-sm text-muted">
          {mode === "create" ? t("addHint") : t("editHint")}
        </p>

        <SelectField
          label={t("fields.scheme")}
          value={schemeId}
          required
          disabled={mode === "edit"}
          placeholder={t("fields.schemePlaceholder")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          error={fieldErrors.schemeId}
          options={schemeOptions}
          onChange={(value) => {
            setSchemeId(value);
            setFieldErrors((current) => ({ ...current, schemeId: undefined }));
          }}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            {t("fields.charges")}
            {mode === "create" ? (
              <span className="text-rose-500"> *</span>
            ) : null}
          </p>
          {fieldErrors.chargeIds ? (
            <span className="block text-xs text-rose-600" role="alert">
              {fieldErrors.chargeIds}
            </span>
          ) : null}
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-3">
            {loadingOptions ? (
              <p className="text-sm text-muted">{t("chargesLoading")}</p>
            ) : masterCharges.length === 0 ? (
              <p className="text-sm text-muted">{t("chargesEmpty")}</p>
            ) : (
              masterCharges.map((item) => (
                <Checkbox
                  key={item.chargeId}
                  variant="row"
                  label={formatChargeOption(item)}
                  checked={selectedIds.includes(item.chargeId)}
                  disabled={saving}
                  onChange={(checked) => toggleCharge(item.chargeId, checked)}
                />
              ))
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

function formatChargeOption(charge: ChargeSetup): string {
  if (charge.chargeRate == null) return charge.chargeName;
  const rate =
    charge.figureCd === FIGURE_PERCENT_OPT_CODE
      ? `${charge.chargeRate}%`
      : String(charge.chargeRate);
  return `${charge.chargeName} (${rate})`;
}

async function loadActiveMasterCharges(): Promise<ChargeSetup[]> {
  const items: ChargeSetup[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchChargeSetups("loan", {
      isActive: 1,
      page,
      perPage: 200,
    });
    items.push(...result.items);
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);
  return items;
}

async function loadActiveSchemeChargeIds(schemeId: number): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchLoanSchemeCharges({
      schemeId,
      isActive: 1,
      page,
      perPage: 200,
    });
    for (const item of result.items) ids.push(item.chargeId);
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);
  return [...new Set(ids)];
}
