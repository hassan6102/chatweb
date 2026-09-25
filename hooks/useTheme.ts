"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { ThemePreference } from "@/types/ui";

const STORAGE_KEY = "theme-preference";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemePreference>(STORAGE_KEY, "system");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  }, [setTheme]);

  return { theme, setTheme, cycle };
}
