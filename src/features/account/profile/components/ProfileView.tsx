"use client";

import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { ChangePasswordForm } from "@/features/account/change-password";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextAreaField, TextField } from "@/components/ui/Form";
import type { AuthUser } from "@/features/auth/types/auth";
import type { MFinFormField } from "@/lib/mfin/types";

type ProfileViewProps = {
  user: AuthUser | null;
};

function buildProfileFields(
  user: AuthUser | null,
  t: ReturnType<typeof useTranslations<"account.profile">>,
): MFinFormField[] {
  if (!user) {
    return [
      { label: t("fields.name"), value: "—" },
      { label: t("fields.shortName"), value: "—" },
      { label: t("fields.employeeId"), value: "—" },
      { label: t("fields.designation"), value: "—" },
      { label: t("fields.branch"), value: "—" },
      { label: t("fields.status"), value: "—", type: "toggle" },
      { label: t("fields.mobile"), value: "—", span: 2 },
      { label: t("fields.email"), value: "—", span: 2 },
    ];
  }

  const branch =
    user.branchCode && user.branchName
      ? `${user.branchName} (${user.branchCode})`
      : user.branchName || user.branchCode || "—";

  return [
    { label: t("fields.name"), value: user.fullName || "—" },
    { label: t("fields.shortName"), value: user.shortName || "—" },
    { label: t("fields.employeeId"), value: user.employeeCode || "—" },
    {
      label: t("fields.designation"),
      value: user.designationName || "—",
    },
    { label: t("fields.branch"), value: branch },
    {
      label: t("fields.status"),
      value: user.isActive ? t("fields.active") : t("fields.inactive"),
      type: "toggle",
    },
    { label: t("fields.mobile"), value: user.mobile || "—", span: 2 },
    { label: t("fields.email"), value: user.email || "—", span: 2 },
  ];
}

export function ProfileView({ user }: ProfileViewProps) {
  const t = useTranslations("account.profile");
  const fields = buildProfileFields(user, t);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <Card title={t("detailsTitle")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => {
            const span = field.span === 2 ? "sm:col-span-2" : "";
            if (field.type === "toggle") {
              return (
                <div key={field.label} className={span}>
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">
                    {field.label}
                  </p>
                  <span className="inline-flex w-fit rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">
                    {field.value}
                  </span>
                </div>
              );
            }
            if (field.type === "textarea") {
              return (
                <div key={field.label} className={span}>
                  <TextAreaField
                    label={field.label}
                    value={field.value}
                    rows={3}
                    disabled
                    onChange={() => undefined}
                  />
                </div>
              );
            }
            return (
              <div key={field.label} className={span}>
                <TextField label={field.label} value={field.value} readOnly />
              </div>
            );
          })}
        </div>

        <div className="btn-actions mt-5 border-t border-border pt-4">
          <Button type="button" icon={Save}>
            {t("save")}
          </Button>
        </div>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
