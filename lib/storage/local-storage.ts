import type { AlgorithmId } from "@/lib/ml/types";

export type GameFilter = "all" | "Mobile Legends" | "Dota 2";

export interface UserPreferences {
  preferredAlgorithm: AlgorithmId;
  dashboardGameFilter: GameFilter;
  sidebarCollapsed: boolean;
  commandThemeAccent: "violet" | "cyan";
}

const PREFS_KEY = "gamesent.preferences.v1";

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredAlgorithm: "naive_bayes",
  dashboardGameFilter: "all",
  sidebarCollapsed: false,
  commandThemeAccent: "violet",
};

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      preferredAlgorithm:
        parsed.preferredAlgorithm === "knn" ? "knn" : "naive_bayes",
      dashboardGameFilter:
        parsed.dashboardGameFilter === "Mobile Legends" ||
        parsed.dashboardGameFilter === "Dota 2"
          ? parsed.dashboardGameFilter
          : "all",
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
      commandThemeAccent:
        parsed.commandThemeAccent === "cyan" ? "cyan" : "violet",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(partial: Partial<UserPreferences>): UserPreferences {
  const current = loadPreferences();
  const next: UserPreferences = { ...current, ...partial };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota / private-mode storage errors
    }
  }
  return next;
}
