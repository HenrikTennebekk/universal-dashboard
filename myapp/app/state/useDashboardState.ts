import { useEffect, useState } from "react";
import type { AnyTileConfig } from "../tiles/registry";
import { loadDashboard, saveDashboard } from "./dashboardStorage";

export function useDashboardState(initialTiles: AnyTileConfig[] = []) {
  const [tiles, setTiles] = useState<AnyTileConfig[]>(() => {
    const stored = loadDashboard();

    // If there is a stored layout, merge any missing default tiles so
    // new tiles (like the weather tile) show up for users who have an
    // older saved layout that doesn't include them.
    if (stored.length > 0) {
      const merged = [...stored];
      for (const def of initialTiles) {
        const exists = stored.some((t) => t.type === def.type && t.title === def.title);
        if (!exists) merged.push(def);
      }
      return merged;
    }

    return initialTiles;
  });

  useEffect(() => {
    saveDashboard(tiles);
  }, [tiles]);

  return {
    tiles,
    setTiles,
  };
}
