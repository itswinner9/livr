export const THEME_STORAGE_KEY = "livrank-theme";

export type ThemePreference = "light" | "dark";

export function resolveTheme(stored: string | null, prefersLight: boolean): ThemePreference {
  if (stored === "light" || stored === "dark") return stored;
  return prefersLight ? "light" : "dark";
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0a0a" : "#f7f4ef");
}
