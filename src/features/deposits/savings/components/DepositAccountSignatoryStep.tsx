"use client";

import { useEffect, useState } from "react";
import { ImagePlus, PenLine, Plus, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, SelectField } from "@/components/ui/Form";
import { DepositAccountCustomerPicker } from "./DepositAccountCustomerPicker";
import { fetchGroupSignatoryMembers } from "../services/deposit-account-client";
import {
  MAX_SIGNATORIES,
  emptySignatory,
  type SignatoryDraft,
} from "../signatory-draft";
import type { DepositCustomer, SignatoryCandidate } from "../types/deposit-account.types";

const LEAD_ROLES = ["president", "secretary", "treasurer"];

type DepositAccountSignatoryStepProps = {
  drafts: SignatoryDraft[];
  mode: "holders" | "members" | "group";
  holders: DepositCustomer[];
  groupId: number | null;
  branchId: number | null;
  authorisedEmpty: boolean;
  errors: Record<string, string>;
  onChange: (drafts: SignatoryDraft[]) => void;
  onDeactivate: (signatoryId: number) => void;
};

export function DepositAccountSignatoryStep({
  drafts,
  mode,
  holders,
  groupId,
  branchId,
  authorisedEmpty,
  errors,
  onChange,
  onDeactivate,
}: DepositAccountSignatoryStepProps) {
  const t = useTranslations("deposits.savings");
  const tUi = useTranslations("ui");
  const [groupMembers, setGroupMembers] = useState<SignatoryCandidate[]>([]);
  const [groupError, setGroupError] = useState(false);

  useEffect(() => {
    if (mode !== "group" || groupId == null) {
      setGroupMembers([]);
      return;
    }
    let cancelled = false;
    fetchGroupSignatoryMembers(groupId)
      .then((items) => {
        if (cancelled) return;
        setGroupError(false);
        setGroupMembers(
          [...items].sort((left, right) => roleRank(left.role) - roleRank(right.role)),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setGroupMembers([]);
          setGroupError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, mode]);

  function update(key: string, partial: Partial<SignatoryDraft>) {
    onChange(
      drafts.map((draft) => (draft.key === key ? { ...draft, ...partial } : draft)),
    );
  }

  const room = Math.max(0, MAX_SIGNATORIES - drafts.length);

  return (
    <div className="flex flex-col gap-4">
      {mode === "group" ? (
        <p className="flex items-start gap-2 text-sm text-muted">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span>{t("form.signatories.groupHint")}</span>
        </p>
      ) : null}
      {mode === "holders" ? (
        <p className="flex items-start gap-2 text-sm text-muted">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span>{t("form.signatories.holderHint")}</span>
        </p>
      ) : null}
      {authorisedEmpty ? (
        <Alert tone="warning">{t("form.signatories.authorisedEmpty")}</Alert>
      ) : null}
      {errors.signatories ? <Alert tone="error">{errors.signatories}</Alert> : null}
      {groupError ? <Alert tone="error">{t("form.signatories.loadMembersError")}</Alert> : null}
      {drafts.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-muted">
          <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span>{t("form.signatories.empty")}</span>
        </p>
      ) : null}
      {drafts.map((draft, index) => (
        <SignatoryBlock
          key={draft.key}
          index={index}
          draft={draft}
          mode={mode}
          holders={holders}
          groupMembers={groupMembers}
          branchId={branchId}
          takenIds={drafts
            .filter((item) => item.key !== draft.key)
            .map((item) => item.member?.id)
            .filter((id): id is number => id != null)}
          errors={errors}
          searchPlaceholder={tUi("selectSearch")}
          emptyMessage={tUi("selectEmpty")}
          onChange={(partial) => update(draft.key, partial)}
          onRemove={() => onChange(drafts.filter((item) => item.key !== draft.key))}
          onDeactivate={onDeactivate}
        />
      ))}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          icon={Plus}
          disabled={room < 1}
          onClick={() => onChange([...drafts, emptySignatory()])}
        >
          {drafts.length === 0
            ? t("form.signatories.add")
            : t("form.signatories.another")}
        </Button>
      </div>
    </div>
  );
}

function ImageNameField({
  label,
  fileName,
  error,
  hint,
  inputId,
  onChange,
}: {
  label: string;
  fileName: string;
  error?: string;
  hint: string;
  inputId: string;
  onChange: (fileName: string) => void;
}) {
  const t = useTranslations("deposits.savings");
  const [preview, setPreview] = useState<string | null>(null);
  const [typeError, setTypeError] = useState("");

  function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTypeError(t("form.signatories.imageOnly"));
      return;
    }
    setTypeError("");
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    onChange(file.name);
  }

  function clear() {
    setPreview(null);
    setTypeError("");
    onChange("");
  }

  const shownError =
    error || typeError || (fileName.length > 75 ? t("form.errors.signatoryFile") : "");

  return (
    <FormField label={label} error={shownError} hint={fileName ? undefined : hint}>
      <div className="flex min-h-44 w-full min-w-0 flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-3 transition hover:border-brand focus-within:border-brand focus-within:shadow-[var(--focus-ring)] sm:p-4">
        {preview ? (
          <div
            role="img"
            aria-label={label}
            className="h-32 w-full shrink-0 rounded-[var(--radius-control)] border border-border bg-white bg-contain bg-center bg-no-repeat sm:h-36"
            style={{ backgroundImage: `url("${preview.replace(/"/g, "%22")}")` }}
          />
        ) : (
          <div className="flex h-32 w-full shrink-0 flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] bg-surface-muted text-muted sm:h-36">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        {fileName ? (
          <p className="w-full truncate text-center text-xs text-muted" title={fileName}>
            {fileName}
          </p>
        ) : null}
        <div className="flex w-full flex-col gap-2 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:justify-center">
          <label
            htmlFor={inputId}
            className="btn btn-secondary btn-sm w-full cursor-pointer justify-center min-[480px]:w-auto"
          >
            {fileName ? t("form.signatories.changeImage") : t("form.signatories.chooseImage")}
          </label>
          {fileName ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center min-[480px]:w-auto"
              onClick={clear}
            >
              {t("form.signatories.removeImage")}
            </Button>
          ) : null}
        </div>
        <input autoComplete="off"
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            pick(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </div>
    </FormField>
  );
}

function roleRank(role: string): number {
  const index = LEAD_ROLES.indexOf(role.trim().toLowerCase());
  return index === -1 ? LEAD_ROLES.length : index;
}

function SignatoryBlock({
  index,
  draft,
  mode,
  holders,
  groupMembers,
  branchId,
  takenIds,
  errors,
  searchPlaceholder,
  emptyMessage,
  onChange,
  onRemove,
  onDeactivate,
}: {
  index: number;
  draft: SignatoryDraft;
  mode: "holders" | "members" | "group";
  holders: DepositCustomer[];
  groupMembers: SignatoryCandidate[];
  branchId: number | null;
  takenIds: number[];
  errors: Record<string, string>;
  searchPlaceholder: string;
  emptyMessage: string;
  onChange: (partial: Partial<SignatoryDraft>) => void;
  onRemove: () => void;
  onDeactivate: (signatoryId: number) => void;
}) {
  const t = useTranslations("deposits.savings");
  const saved = draft.signatoryId != null;
  const pool = mode === "group" ? groupMembers : holders;
  const options = pool
    .filter((member) => !takenIds.includes(member.id) || member.id === draft.member?.id)
    .map((member) => ({
      value: String(member.id),
      label: [
        member.name,
        member.refCode,
        "role" in member && member.role ? member.role : "",
      ]
        .filter(Boolean)
        .join(" · "),
    }));
  if (
    draft.member &&
    !options.some((option) => option.value === String(draft.member?.id))
  ) {
    options.unshift({
      value: String(draft.member.id),
      label: [draft.member.name, draft.member.refCode, draft.role]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">
          {t("form.signatories.block", { number: index + 1 })}
        </p>
        {saved ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onDeactivate(draft.signatoryId!)}
          >
            {t("form.signatories.deactivate")}
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={onRemove}>
            {t("form.signatories.remove")}
          </Button>
        )}
      </div>
      {saved && draft.role ? (
        <p className="text-xs text-muted">{draft.role}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode === "members" && !saved ? (
          <div className="sm:col-span-2">
            <DepositAccountCustomerPicker
              kind="member"
              label={t("form.signatories.member")}
              required
              customer={draft.member}
              excludeIds={takenIds}
              branchId={branchId}
              error={errors[`${draft.key}.member`]}
              onChange={(member) => onChange({ member })}
            />
          </div>
        ) : (
          <SelectField
            label={t("form.signatories.member")}
            required
            disabled={saved}
            value={draft.member ? String(draft.member.id) : ""}
            error={errors[`${draft.key}.member`]}
            placeholder={t("form.signatories.memberPlaceholder")}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            onChange={(value) => {
              const member = pool.find((item) => String(item.id) === value) ?? null;
              onChange({
                member,
                role: member && "role" in member ? String(member.role ?? "") : "",
              });
            }}
            options={options}
          />
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <ImageNameField
          label={t("form.signatories.signature")}
          fileName={draft.signFileNm}
          error={errors[`${draft.key}.signFileNm`]}
          hint={t("form.signatories.fileHint")}
          inputId={`${draft.key}-signature`}
          onChange={(signFileNm) => onChange({ signFileNm })}
        />
        <ImageNameField
          label={t("form.signatories.photo")}
          fileName={draft.photoFileNm}
          error={errors[`${draft.key}.photoFileNm`]}
          hint={t("form.signatories.fileHint")}
          inputId={`${draft.key}-photo`}
          onChange={(photoFileNm) => onChange({ photoFileNm })}
        />
      </div>
    </div>
  );
}
