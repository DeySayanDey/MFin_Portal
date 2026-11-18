"use client";

import { useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  DateField,
  FormField,
  SelectField,
  TextField,
} from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Textarea";
import type { ApplOption } from "@/features/master/appl-options";
import { DepositAccountCustomerPicker } from "./DepositAccountCustomerPicker";
import type { DepositNominee } from "../types/deposit-account.types";
import {
  MAX_ACTIVE_NOMINEES,
  MINOR_AGE,
  emptyNominee,
  nomineeAge,
  remainingShare,
  type NomineeDraft,
} from "../nominee-draft";
import { parseYmd, todayYmd } from "../deposit-account.rules";
import type { DepositCustomer } from "../types/deposit-account.types";

type DepositAccountNomineeStepProps = {
  drafts: NomineeDraft[];
  holderIds: number[];
  reservedShare: number;
  reservedCount: number;
  groupAccount: boolean;
  relations: ApplOption[];
  branchId?: number | null;
  errors: Record<string, string>;
  onChange: (drafts: NomineeDraft[]) => void;
  onDeactivate: (nomineeId: number) => void;
};

export function DepositAccountNomineeStep({
  drafts,
  holderIds,
  reservedShare,
  reservedCount,
  groupAccount,
  relations,
  branchId,
  errors,
  onChange,
  onDeactivate,
}: DepositAccountNomineeStepProps) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const room = Math.max(0, MAX_ACTIVE_NOMINEES - reservedCount - drafts.length);
  const remaining = remainingShare(drafts, reservedShare);
  

  function update(key: string, partial: Partial<NomineeDraft>) {
    onChange(
      drafts.map((draft) => (draft.key === key ? { ...draft, ...partial } : draft)),
    );
  }

  function addDraft() {
    if (room < 1 || remaining <= 0) return;
    onChange([...drafts, emptyNominee(String(remaining))]);
  }

  if (groupAccount) {
    return <Alert tone="warning">{t("form.nominees.groupNotice")}</Alert>;
  }

  return (
    <div className="flex flex-col gap-4">
      {errors.nominees ? <Alert tone="error">{errors.nominees}</Alert> : null}
      {drafts.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-muted">
          <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span>{t("form.nominees.empty")}</span>
        </p>
      ) : null}
      {drafts.map((draft, index) => (
        <NomineeBlock
          key={draft.key}
          index={index}
          draft={draft}
          relations={relations}
          branchId={branchId}
          holderIds={holderIds}
          siblingIds={drafts
            .filter((item) => item.key !== draft.key)
            .map((item) => item.member?.id)
            .filter((id): id is number => id != null)}
          remaining={remainingShare(
            drafts.filter((item) => item.key !== draft.key),
            reservedShare,
          )}
          errors={errors}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(partial) => update(draft.key, partial)}
          onRemove={() => onChange(drafts.filter((item) => item.key !== draft.key))}
          onDeactivate={onDeactivate}
        />
      ))}
      {drafts.length > 0 && remaining > 0 ? (
        <Alert tone="warning">
          {t("form.nominees.unallocated", { percent: String(remaining) })}
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-700">
          {t("form.nominees.total", {
            percent: String(Math.max(0, 100 - remaining)),
          })}
        </p>
        <Button
          type="button"
          variant="secondary"
          icon={Plus}
          disabled={room < 1 || remaining <= 0}
          tooltip={
            room < 1
              ? t("form.nominees.limit")
              : remaining <= 0
                ? t("form.nominees.reduceShare")
                : undefined
          }
          onClick={addDraft}
        >
          {drafts.length === 0 ? t("form.nominees.add") : t("form.nominees.another")}
        </Button>
      </div>
    </div>
  );
}

export function RegisteredNomineeList({
  nominees,
  loading,
  error,
  emptyMessage,
}: {
  nominees: DepositNominee[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
}) {
  const t = useTranslations("deposits.savings");
  const format = useFormatter();
  const dash = t("dash");
  const birthLabel = (value: string | null) => {
    const parsed = value ? parseYmd(value) : null;
    return parsed
      ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
      : null;
  };

  if (loading) {
    return <p className="text-sm text-muted">{t("view.loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!error && nominees.length === 0 ? (
        <p className="text-sm text-muted">
          {emptyMessage ?? t("form.nominees.registeredEmpty")}
        </p>
      ) : null}
      {nominees.map((nominee) => (
        <div
          key={nominee.nomineeId}
          className={`rounded-xl border border-border p-3 ${nominee.isActive ? "" : "opacity-60"}`}
        >
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            <span>{nominee.nomName || dash}</span>
            {nominee.isMinor ? (
              <Badge tone="warning" caps={false}>
                {t("form.nominees.minor")}
              </Badge>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {[
              nominee.relationDesc,
              nominee.age != null ? t("form.nominees.ageValue", { age: nominee.age }) : null,
              birthLabel(nominee.birthDate),
              nominee.contactNo,
              nominee.guardianName,
            ]
              .filter(Boolean)
              .join(" · ") || dash}
          </p>
          {nominee.address ? (
            <p className="mt-1 text-xs text-slate-600">{nominee.address}</p>
          ) : null}
          {nominee.sharePercent != null ? (
            <p className="mt-2 text-sm font-medium text-slate-800">
              {t("form.nominees.shareValue", { percent: nominee.sharePercent })}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function NomineeBlock({
  index,
  draft,
  relations,
  branchId,
  holderIds,
  siblingIds,
  remaining,
  errors,
  searchPlaceholder,
  emptyMessage,
  onChange,
  onRemove,
  onDeactivate,
}: {
  index: number;
  draft: NomineeDraft;
  relations: ApplOption[];
  branchId?: number | null;
  holderIds: number[];
  siblingIds: number[];
  remaining: number;
  errors: Record<string, string>;
  searchPlaceholder: string;
  emptyMessage: string;
  onChange: (partial: Partial<NomineeDraft>) => void;
  onRemove: () => void;
  onDeactivate: (nomineeId: number) => void;
}) {
  const t = useTranslations("deposits.savings");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const age = nomineeAge(draft);
  const minor = age != null && age < MINOR_AGE;
  const error = (field: string) => errors[`${draft.key}.${field}`];

  function selectMember(member: DepositCustomer | null) {
    onChange({
      member,
      nomName: member?.name ?? draft.nomName,
      contactNo: member?.mobile ?? draft.contactNo,
      birthDate: member?.dateOfBirth ?? draft.birthDate,
      useAgeOnly: member?.dateOfBirth ? false : draft.useAgeOnly,
    });
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-semibold text-slate-800">
        {t("form.nominees.block", { number: index + 1 })}
      </legend>
      <div className="flex items-center justify-between gap-2">
        <CheckboxField
          label={t("form.nominees.linkMember")}
          checked={draft.linkMember}
          onChange={(linkMember) =>
            onChange({
              linkMember,
              member: linkMember ? draft.member : null,
            })
          }
        />
        <Button
          type="button"
          variant="ghost"
          icon={Trash2}
          tooltip={t("form.nominees.remove")}
          onClick={() => {
            if (draft.nomineeId == null) onRemove();
            else setConfirmRemove(true);
          }}
        />
      </div>
      {confirmRemove && draft.nomineeId != null ? (
        <div className="flex flex-col gap-2">
          <Alert tone="warning">
            {t("form.nominees.deactivateConfirm", {
              name: draft.nomName || t("dash"),
              percent: draft.sharePercent || "0",
            })}
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              onClick={() => onDeactivate(draft.nomineeId as number)}
            >
              {t("form.nominees.deactivate")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>
              {t("form.nominees.keep")}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {draft.linkMember ? (
        <div className="sm:col-span-2">
        <DepositAccountCustomerPicker
          kind="member"
          label={t("form.nominees.member")}
          required
          customer={draft.member}
          excludeIds={[...holderIds, ...siblingIds]}
          branchId={branchId}
          error={error("member")}
          onChange={selectMember}
        />
        </div>
      ) : null}
      <TextField
        label={t("form.nominees.name")}
        required={!draft.linkMember}
        value={draft.nomName}
        maxLength={120}
        error={error("nomName")}
        onChange={(nomName) => onChange({ nomName })}
      />
      <SelectField
        label={t("form.nominees.relation")}
        required
        value={draft.relationCd}
        error={error("relationCd")}
        placeholder={t("form.nominees.relationPlaceholder")}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        onChange={(relationCd) => onChange({ relationCd })}
        options={relations.map((option) => ({
          value: String(option.optCode),
          label: option.optDescription,
        }))}
      />
      <div className="flex flex-col gap-2">
      {draft.useAgeOnly ? (
        <TextField
          label={t("form.nominees.age")}
          required
          restrict="digits"
          value={draft.age}
          maxLength={3}
          error={error("age")}
          onChange={(ageValue) => onChange({ age: ageValue })}
        />
      ) : (
        <DateField
          label={t("form.nominees.birthDate")}
          required
          value={draft.birthDate}
          max={todayYmd()}
          error={error("birthDate")}
          onChange={(birthDate) => onChange({ birthDate })}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        className="self-start"
        onClick={() => onChange({ useAgeOnly: !draft.useAgeOnly })}
      >
        {draft.useAgeOnly ? t("form.nominees.useBirthDate") : t("form.nominees.ageOnly")}
      </Button>
      </div>
      <TextField
        label={t("form.nominees.contact")}
        restrict="digits"
        value={draft.contactNo}
        maxLength={10}
        error={error("contactNo")}
        onChange={(contactNo) => onChange({ contactNo })}
      />
      {minor ? (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Alert tone="warning">{t("form.nominees.minorNotice")}</Alert>
          <TextField
            label={t("form.nominees.guardian")}
            required
            value={draft.guardianName}
            maxLength={100}
            error={error("guardianName")}
            onChange={(guardianName) => onChange({ guardianName })}
          />
        </div>
      ) : null}
      <div className="sm:col-span-2">
      <FormField
        label={t("form.nominees.address")}
        error={error("address")}
        meta={`${draft.address.length}/150`}
      >
        <Textarea
          value={draft.address}
          maxLength={150}
          onChange={(event) => onChange({ address: event.target.value })}
        />
      </FormField>
      </div>
      <TextField
        label={t("form.nominees.share")}
        required
        restrict="decimal"
        value={draft.sharePercent}
        error={error("sharePercent")}
        hint={t("form.nominees.remaining", { percent: String(Math.max(0, remaining)) })}
        onChange={(sharePercent) => onChange({ sharePercent })}
      />
      </div>
    </fieldset>
  );
}
