"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { AuthLanguageSelect } from "@/features/auth/components/AuthShell";
import { registerFormSchema } from "@/features/auth/schemas/auth-form.schema";
import { formatIssue, mobilePattern, normalizeMobile } from "@/lib/validation/formats";
import { Alert } from "@/components/ui/Alert";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import { Link } from "@/i18n/navigation";

const designations = [
  "Branch Manager",
  "Field Officer",
  "Branch Accountant",
  "Credit Underwriter",
  "Cashier",
  "Super Admin",
];

const branches = [
  "Kolkata Shyambazar Hub Branch (BR-WB01)",
  "Sonarpur Branch",
  "Barasat Branch",
  "Halisahar Branch",
  "Karveer Rural Branch",
];

type RegisterDraft = {
  fullName: string;
  empId: string;
  mobile: string;
  email: string;
  designation: string;
  branch: string;
  password: string;
  confirmPassword: string;
  accepted: boolean;
};

const emptyDraft: RegisterDraft = {
  fullName: "",
  empId: "",
  mobile: "",
  email: "",
  designation: designations[0] ?? "",
  branch: branches[0] ?? "",
  password: "",
  confirmPassword: "",
  accepted: false,
};

export function RegisterForm() {
  const t = useTranslations("auth");
  const [form, setForm] = useState<RegisterDraft>(emptyDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof RegisterDraft>(key: K, value: RegisterDraft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerFormSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const key of Object.keys(flat)) {
        if (flat[key as keyof typeof flat]?.length) {
          next[key] =
            key === "password"
              ? t("errors.passwordMin")
              : t(`errors.${key}` as "errors.fullName");
        }
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
  }

  return (
    <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
      <AuthLanguageSelect />

      <Alert tone="warning">{t("registerPendingApi")}</Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t("register.fullName")}
          required
          className="sm:col-span-2"
          value={form.fullName}
          maxLength={100}
          placeholder={t("register.fullNamePlaceholder")}
          error={fieldErrors.fullName}
          onChange={(value) => update("fullName", value)}
        />
        <TextField
          label={t("register.empId")}
          required
          value={form.empId}
          maxLength={50}
          placeholder={t("register.empIdPlaceholder")}
          error={fieldErrors.empId}
          onChange={(value) => update("empId", value)}
        />
        <TextField
          label={t("register.mobile")}
          type="tel"
          required
          value={form.mobile}
          maxLength={10}
          inputMode="numeric"
          placeholder={t("register.mobilePlaceholder")}
          hint={t("hints.mobile")}
          error={fieldErrors.mobile}
          validate={(value, final) =>
            formatIssue(
              normalizeMobile(value),
              final,
              10,
              mobilePattern,
              t("errors.mobile"),
            )
          }
          onChange={(value) => update("mobile", value)}
        />
        <TextField
          label={t("register.email")}
          type="email"
          required
          className="sm:col-span-2"
          value={form.email}
          maxLength={100}
          placeholder={t("register.emailPlaceholder")}
          error={fieldErrors.email}
          onChange={(value) => update("email", value)}
        />
        <SelectField
          label={t("register.designation")}
          required
          value={form.designation}
          error={fieldErrors.designation}
          onChange={(value) => update("designation", value)}
          options={designations.map((item) => ({ value: item, label: item }))}
        />
        <SelectField
          label={t("register.branch")}
          required
          value={form.branch}
          error={fieldErrors.branch}
          onChange={(value) => update("branch", value)}
          options={branches.map((item) => ({ value: item, label: item }))}
        />
        <TextField
          label={t("register.password")}
          type={showPassword ? "text" : "password"}
          required
          value={form.password}
          maxLength={100}
          hint={t("hints.password")}
          error={fieldErrors.password}
          validate={(value, final) => {
            if (!value) return final ? t("errors.passwordMin") : undefined;
            if (!final && value.length < 8) return undefined;
            return value.length >= 8 ? undefined : t("errors.passwordMin");
          }}
          onChange={(value) => update("password", value)}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded-md p-1 text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <TextField
          label={t("register.confirmPassword")}
          type={showConfirm ? "text" : "password"}
          required
          value={form.confirmPassword}
          maxLength={100}
          error={fieldErrors.confirmPassword}
          validate={(value, final) => {
            if (!value) return final ? t("errors.confirmPassword") : undefined;
            if (!final && value.length < form.password.length) return undefined;
            return value === form.password ? undefined : t("errors.confirmPassword");
          }}
          onChange={(value) => update("confirmPassword", value)}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="rounded-md p-1 text-slate-400 hover:text-slate-700"
              aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </div>

      <div>
        <CheckboxField
          label={t("register.confirmStaff")}
          checked={form.accepted}
          onChange={(checked) => update("accepted", checked)}
        />
        {fieldErrors.accepted ? (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.accepted}</p>
        ) : null}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full justify-center py-3 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.55)]"
      >
        <UserPlus className="h-4 w-4" />
        {t("register.submit")}
      </button>

      <p className="text-center text-sm text-slate-500">
        {t("register.alreadyRegistered")}{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
