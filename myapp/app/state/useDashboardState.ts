import { useEffect, useState } from "react";
import type { AnyTileConfig } from "../tiles/registry";
import { loadDashboard, saveDashboard } from "./dashboardStorage";

export function useDashboardState(initialTiles: AnyTileConfig[] = []) {
  const [tiles, setTiles] = useState<AnyTileConfig[]>(() => {
    const stored = loadDashboard();
    return stored.length > 0 ? stored : initialTiles;
  });

  useEffect(() => {
    saveDashboard(tiles);
  }, [tiles]);

  return {
    tiles,
    setTiles,
  };
}
