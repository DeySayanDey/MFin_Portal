"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { AuthLanguageSelect } from "@/features/auth/components/AuthShell";
import { loginFormSchema } from "@/features/auth/schemas/auth-form.schema";
import { CheckboxField, TextField } from "@/components/ui/Form";
import { Link, useRouter } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { clearMenuClientCache } from "@/features/navigation/services/menu-client";
import { storeAuthUser } from "@/features/auth/utils/auth-user-storage";
import {
  readRememberedLogin,
  saveRememberedLogin,
} from "@/features/auth/utils/remember-login";

export function LoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const saved = readRememberedLogin();
    if (!saved) return;
    setRemember(saved.remember);
    if (saved.login) setUsername(saved.login);
  }, []);

  function updateRemember(next: boolean) {
    setRemember(next);
    saveRememberedLogin(next, next ? username : "");
  }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginFormSchema.safeParse({ username, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const key of Object.keys(flat)) {
        if (flat[key as keyof typeof flat]?.length) {
          next[key] = t(`errors.${key}` as "errors.username");
        }
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch(endpoints.auth.login, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          login: parsed.data.username,
          password: parsed.data.password,
          remember,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: { user?: import("@/features/auth/types/auth").AuthUser };
      };

      if (!response.ok || payload.success === false) {
        setError(payload.message || t("invalidCredentials"));
        return;
      }

      if (!payload.data?.user) {
        setError(tErrors("network"));
        return;
      }

      saveRememberedLogin(remember, parsed.data.username);
      storeAuthUser(payload.data.user);
      clearMenuClientCache();
      router.replace("/dashboard");
      return;
    } catch {
      setError(tErrors("network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
      <TextField
        label={t("emailUsername")}
        name="username"
        required
        autoComplete="username"
        placeholder={t("emailUsername")}
        value={username}
        maxLength={100}
        error={fieldErrors.username}
        validate={(value, final) =>
          final && !value.trim() ? t("errors.username") : undefined
        }
        onChange={(value) => {
          setUsername(value);
          if (remember) saveRememberedLogin(true, value);
        }}
      />

      <TextField
        label={t("password")}
        name="password"
        type={showPassword ? "text" : "password"}
        required
        autoComplete="current-password"
        placeholder={t("password")}
        value={password}
        maxLength={100}
        error={fieldErrors.password}
        validate={(value, final) =>
          final && !value ? t("errors.password") : undefined
        }
        onChange={setPassword}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
      />

      <AuthLanguageSelect />

      {error ? (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1B74D6] text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(27,116,214,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1668c2] hover:shadow-lg active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          t("signingIn")
        ) : (
          <>
            <LogIn className="h-4 w-4" aria-hidden />
            {t("login")}
          </>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-sm">
        <CheckboxField
          label={t("rememberMe")}
          checked={remember}
          onChange={updateRemember}
        />
        <Link
          href="/forgot-password"
          className="cursor-pointer font-semibold text-[#1B74D6] transition-colors hover:text-[#0D5FBF] hover:underline"
        >
          {t("forgotPassword")}
        </Link>
      </div>
    </form>
  );
}
