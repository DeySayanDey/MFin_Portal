"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  isThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/features/theme/theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readClientTheme(fallback: ThemeMode): ThemeMode {
  if (typeof document === "undefined") return fallback;
  if (document.documentElement.classList.contains("dark")) return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(stored)) return stored;
  } catch {
    /* ignore */
  }
  return fallback;
}

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme: ThemeMode;
};

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    const resolved = readClientTheme(initialTheme);
    setThemeState(resolved);
    applyTheme(resolved);
  }, [initialTheme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
