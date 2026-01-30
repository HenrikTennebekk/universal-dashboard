import type { AnyTileConfig } from "../tiles/registry";

const STORAGE_KEY = "universal-dashboard:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadDashboard(): AnyTileConfig[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnyTileConfig[];
  } catch {
    return [];
  }
}

export function saveDashboard(tiles: AnyTileConfig[]) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
  } catch {
    // ignore
  }
}

export function clearDashboard() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
