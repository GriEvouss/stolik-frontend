export type Theme = "light" | "dark";
const key = "stolik-theme";
const system = window.matchMedia("(prefers-color-scheme: dark)");
let explicit = false;

export function initializeTheme(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(key);
  } catch {
    /* Storage may be unavailable. */
  }
  explicit = saved === "light" || saved === "dark";
  document.documentElement.dataset.theme = explicit
    ? saved!
    : system.matches
      ? "dark"
      : "light";
  system.addEventListener("change", () => {
    if (!explicit) {
      document.documentElement.dataset.theme = system.matches
        ? "dark"
        : "light";
      window.dispatchEvent(new Event("themechange"));
    }
  });
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  explicit = true;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(key, theme);
  } catch {
    /* The current session still works. */
  }
  window.dispatchEvent(new Event("themechange"));
}
