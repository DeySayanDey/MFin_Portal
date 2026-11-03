"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  CheckboxField,
  DateField,
  SelectField,
  TextField,
} from "@/components/ui/Form";
import type { ApplOption } from "@/features/master/appl-options";
import { TD_PROD_RECURRING } from "../deposit-account.constants";
import { todayYmd } from "../deposit-account.rules";
import {
  needsSbCredit,
  sbCreditRequired,
  takesInstallments,
  termStartDate,
  type TermDraft,
} from "../term-draft";

type Option = { value: string; label: string };

type DepositAccountTermDetailsProps = {
  draft: TermDraft;
  prodTypeCd: number | null;
  applDate: string;
  schemeRoi: number | null;
  maturityOptions: ApplOption[];
  sbAccountOptions: Option[];
  sbAccountsLoading: boolean;
  errors: Record<string, string>;
  onChange: (partial: Partial<TermDraft>) => void;
};

export function DepositAccountTermDetails({
  draft,
  prodTypeCd,
  applDate,
  schemeRoi,
  maturityOptions,
  sbAccountOptions,
  sbAccountsLoading,
  errors,
  onChange,
}: DepositAccountTermDetailsProps) {
  const t = useTranslations("deposits.savings.form.term");
  const tUi = useTranslations("ui");
  const format = useFormatter();
  const installments = takesInstallments(prodTypeCd);
  const recurring = prodTypeCd === TD_PROD_RECURRING;
  const recurringMax =
    (Number(draft.periodYy) || 0) * 12 + (Number(draft.periodMm) || 0);
  const instNoHint = recurring
    ? recurringMax > 0
      ? t("instNoMax", { max: recurringMax })
      : undefined
    : t("instNoDailyHint");
  const showSbCredit = needsSbCredit(draft.matuInsCd);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          label={t("startDate")}
          required
          value={termStartDate(draft, applDate)}
          min={applDate || undefined}
          max={todayYmd()}
          error={errors.tdStartDate}
          onChange={(startDate) => onChange({ startDate, startTouched: true })}
        />
        <TextField
          label={t("roi")}
          readOnly
          value={
            schemeRoi != null
              ? format.number(schemeRoi, { maximumFractionDigits: 2 })
              : ""
          }
          placeholder={t("roiPlaceholder")}
          hint={t("roiHint")}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-xs font-semibold text-slate-600">
          {t("period")}
          <span className="text-rose-600" aria-hidden="true"> *</span>
        </legend>
        <div className={`grid grid-cols-1 gap-4 ${recurring ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <TextField
            label={t("years")}
            restrict="digits"
            inputMode="numeric"
            maxLength={2}
            value={draft.periodYy}
            placeholder="0"
            onChange={(periodYy) => onChange({ periodYy })}
          />
          <TextField
            label={t("months")}
            restrict="digits"
            inputMode="numeric"
            maxLength={3}
            value={draft.periodMm}
            placeholder="0"
            onChange={(periodMm) => onChange({ periodMm })}
          />
          {recurring ? null : (
            <TextField
              label={t("days")}
              restrict="digits"
              inputMode="numeric"
              maxLength={3}
              value={draft.periodDd}
              placeholder="0"
              onChange={(periodDd) => onChange({ periodDd })}
            />
          )}
        </div>
        {errors.tdPeriod ? (
          <p className="text-xs text-rose-600" role="alert">
            {errors.tdPeriod}
          </p>
        ) : (
          <p className="text-xs text-muted">
            {recurring ? t("periodWholeMonthsHint") : t("periodHint")}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label={installments ? t("installmentAmount") : t("depositAmount")}
          required
          restrict="decimal"
          inputMode="decimal"
          value={draft.instAmount}
          error={errors.tdInstAmount}
          placeholder="0.00"
          onChange={(instAmount) => onChange({ instAmount })}
        />
        {installments ? (
          <TextField
            label={t("instNo")}
            restrict="digits"
            inputMode="numeric"
            maxLength={5}
            value={draft.instNo}
            error={errors.tdInstNo}
            placeholder={t("instNoPlaceholder")}
            hint={instNoHint}
            onChange={(instNo) => onChange({ instNo })}
          />
        ) : null}
        <SelectField
          label={t("maturityInstruction")}
          value={draft.matuInsCd}
          error={errors.tdMatuInsCd}
          searchable={false}
          placeholder={t("maturityPlaceholder")}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(matuInsCd) =>
            onChange({
              matuInsCd,
              sbCreditAcId: needsSbCredit(matuInsCd) ? draft.sbCreditAcId : "",
            })
          }
          options={[...maturityOptions]
            .sort((left, right) => left.optCode - right.optCode)
            .map((option) => ({
              value: String(option.optCode),
              label: option.optDescription,
            }))}
        />
        {showSbCredit ? (
          <SelectField
            label={t("sbCredit")}
            required={sbCreditRequired(draft.matuInsCd)}
            value={draft.sbCreditAcId}
            error={errors.tdSbCreditAcId}
            disabled={sbAccountsLoading || sbAccountOptions.length === 0}
            placeholder={sbAccountsLoading ? tUi("loading") : t("sbCreditPlaceholder")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            hint={
              !sbAccountsLoading && sbAccountOptions.length === 0
                ? t("sbCreditEmpty")
                : undefined
            }
            onChange={(sbCreditAcId) => onChange({ sbCreditAcId })}
            options={sbAccountOptions}
          />
        ) : null}
        <TextField
          label={t("refAcNo")}
          value={draft.refAcNo}
          maxLength={15}
          error={errors.tdRefAcNo}
          onChange={(refAcNo) => onChange({ refAcNo: refAcNo.toUpperCase() })}
        />
      </div>

      <CheckboxField
        label={t("tdsDeduct")}
        checked={draft.tdsDeduct}
        onChange={(tdsDeduct) => onChange({ tdsDeduct })}
      />
    </div>
  );
}
