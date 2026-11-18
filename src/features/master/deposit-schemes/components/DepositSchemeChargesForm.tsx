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
import { depositSchemeChargeSaveInputSchema } from "@/features/master/deposit-schemes/schemas/deposit-schemes.schema";
import { fetchDepositSchemeCharges } from "@/features/master/deposit-schemes/services/deposit-schemes-client";
import type {
  DepositSchemeCharge,
  DepositSchemeChargeSaveInput,
} from "@/features/master/deposit-schemes/types/deposit-schemes.types";

type DepositSchemeChargesFormProps = {
  open: boolean;
  mode: "create" | "edit";
  charge: DepositSchemeCharge | null;
  schemes?: { id: number; schemeName: string }[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: DepositSchemeChargeSaveInput) => Promise<void> | void;
};

export function DepositSchemeChargesForm({
  open,
  mode,
  charge,
  schemes = [],
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: DepositSchemeChargesFormProps) {
  const t = useTranslations("master.depositSchemes.charges");
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
    chargesIds?: string;
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
          if (mappedIds.some((id) => !allowed.has(id))) {
            throw new Error("An active mapping is missing from the active charge list");
          }
          setSelectedIds(mappedIds);
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
    setFieldErrors((current) => ({ ...current, chargesIds: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadingOptions || saving || optionsError) return;

    const parsed = depositSchemeChargeSaveInputSchema.safeParse({
      schemeId: schemeId ? Number(schemeId) : 0,
      chargesIds: selectedIds,
      mode,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        schemeId: flat.schemeId ? t("errors.schemeId") : undefined,
        chargesIds: flat.chargesIds ? t("errors.chargesIds") : undefined,
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
            form="deposit-scheme-charges-form"
            icon={Save}
            disabled={saving || loadingOptions || Boolean(optionsError)}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <form autoComplete="off"
        id="deposit-scheme-charges-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <PageToast message={errorMessage ?? optionsError} tone="error" />
        <p className="text-sm text-slate-600">
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
          <p className="text-xs font-semibold text-slate-600">
            {t("fields.charges")}
            {mode === "create" ? (
              <span className="text-rose-500"> *</span>
            ) : null}
          </p>
          {fieldErrors.chargesIds ? (
            <span className="block text-xs text-rose-600" role="alert">
              {fieldErrors.chargesIds}
            </span>
          ) : null}
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-3">
            {loadingOptions ? (
              <p className="text-sm text-slate-500">{t("chargesLoading")}</p>
            ) : masterCharges.length === 0 ? (
              <p className="text-sm text-slate-500">{t("chargesEmpty")}</p>
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
    const result = await fetchChargeSetups("deposit", {
      isActive: 1,
      page,
      perPage: 200,
    });
    items.push(...result.items);
    if (!result.meta && result.items.length === 200) {
      throw new Error("Charge list pagination is missing");
    }
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage);
  return items;
}

async function loadActiveSchemeChargeIds(schemeId: number): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchDepositSchemeCharges({
      schemeId,
      isActive: 1,
      page,
      perPage: 200,
    });
    for (const item of result.items) ids.push(item.chargesId);
    if (!result.meta && result.items.length === 200) {
      throw new Error("Scheme charge list pagination is missing");
    }
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage);
  return [...new Set(ids)];
}
