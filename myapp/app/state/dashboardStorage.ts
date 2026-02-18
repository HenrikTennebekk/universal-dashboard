import type { AnyTileConfig } from "../tiles/registry";
import type { BackgroundConfig } from "../components/BackgroundPicker/BackgroundPicker";

const STORAGE_KEY = "universal-dashboard:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export type SpaceConfig = {
  id: string;
  name: string;
  // layout may be any preset id or built-in layout string
  layout?: string;
  layoutColumns?: number;
  // base tile width/height unit (pixels) and gap between tiles (pixels)
  tileUnit?: number;
  tileGap?: number;
  background?: BackgroundConfig;
  // deprecated: old way of storing background
  backgroundColor?: string;
  tiles: AnyTileConfig[];
};

type StoredShape = {
  spaces: SpaceConfig[];
  activeSpaceId?: string;
};

export function loadSpaces(): SpaceConfig[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    // Backwards compatibility: old format was an array of tiles
    if (Array.isArray(parsed)) {
      return [
        {
          id: "space-1",
          name: "Default",
          layout: "grid",
          tiles: parsed as AnyTileConfig[],
        },
      ];
    }

    if (parsed && Array.isArray(parsed.spaces)) {
      return parsed.spaces as SpaceConfig[];
    }

    return [];
  } catch {
    return [];
  }
}

export function saveSpaces(spaces: SpaceConfig[], activeSpaceId?: string) {
  if (!isBrowser()) return;

  try {
    const payload: StoredShape = { spaces, activeSpaceId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}
