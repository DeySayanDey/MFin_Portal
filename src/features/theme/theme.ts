export const THEME_STORAGE_KEY = "mfin-theme";
export const THEME_COOKIE = "mfin-theme";

export type ThemeMode = "light" | "dark";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode */
  }
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;samesite=lax`;
}

/** Inline, before paint. Keep in sync with THEME_COOKIE / THEME_STORAGE_KEY. */
export const THEME_BOOT_SCRIPT = `(function(){try{var k="mfin-theme";var m=document.cookie.match(/(?:^|; )mfin-theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):localStorage.getItem(k);var dark=t==="dark";document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
