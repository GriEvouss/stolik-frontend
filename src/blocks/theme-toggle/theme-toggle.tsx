import React, { useEffect, useState } from "react";
import { currentTheme, setTheme } from "../../domain/theme";

export default function ThemeToggle() {
  const [theme, update] = useState(currentTheme);
  useEffect(() => {
    const sync = () => update(currentTheme());
    window.addEventListener("themechange", sync);
    return () => window.removeEventListener("themechange", sync);
  }, []);
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Тёмная тема"
      aria-pressed={theme === "dark"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    </button>
  );
}
