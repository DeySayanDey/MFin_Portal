"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { applyTheme, type ThemeMode } from "@/features/theme/theme";

type ThemeToggleProps = {
  className?: string;
  variant?: "icon" | "menu";
};

function currentTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({
  className = "",
  variant = "icon",
}: ThemeToggleProps) {
  const t = useTranslations("ui");
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    window.addEventListener("mfin-theme-change", sync);
    return () => window.removeEventListener("mfin-theme-change", sync);
  }, []);

  const isDark = theme === "dark";
  const label = isDark ? t("themeToLight") : t("themeToDark");

  function toggle() {
    const next: ThemeMode = isDark ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    window.dispatchEvent(new Event("mfin-theme-change"));
  }

  const icon = isDark ? (
    <Sun className="h-4 w-4" aria-hidden />
  ) : (
    <Moon className="h-4 w-4" aria-hidden />
  );

  if (variant === "menu") {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={toggle}
        aria-label={label}
        aria-pressed={isDark}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-surface-muted ${className}`.trim()}
      >
        <span className="text-muted-soft">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-slate-600 shadow-sm transition hover:bg-surface-muted ${className}`.trim()}
    >
      {icon}
    </button>
  );
}
