import { useEffect, useState } from "react";
import type { AnyTileConfig } from "../tiles/registry";
import { loadSpaces, saveSpaces, type SpaceConfig } from "./dashboardStorage";
import { presets as layoutPresets } from "../components/LayoutPicker/LayoutPicker";
import { layoutCapacity as calculateLayoutCapacity } from "../utils/tileUtils";
import type { BackgroundConfig } from "../components/BackgroundPicker/BackgroundPicker";

export function useDashboardState(initialTiles: AnyTileConfig[] = []) {
  const initialSpaces: SpaceConfig[] = [
    {
      id: "space-1",
      name: "Default",
      layout: "preset-columns-three",
      layoutColumns: 2,
      tiles: initialTiles,
      background: { type: "color", value: "#00145c" },
      // sensible defaults: base tile unit width and gap (px)
      tileUnit: 320,
      tileGap: 12,
    },
  ];

  const [spaces, setSpaces] = useState<SpaceConfig[]>(() => {
    const stored = loadSpaces();

    // merge defaults into the first space when it's empty
    if (stored.length === 0) return initialSpaces;

    // If stored exists, ensure any new default tiles are added to first space
    const merged = stored.map((s, idx) => {
      if (idx !== 0) return s;
      const tiles = [...s.tiles];
      for (const def of initialTiles) {
        const exists = tiles.some((t) => t && t.type === def.type && t.id === def.id);
        if (!exists) tiles.push(def);
      }
      return { ...s, tiles };
    });

    return merged;
  });

  const [activeSpaceId, setActiveSpaceId] = useState<string | undefined>(() => {
    const stored = loadSpaces();
    return stored.length > 0 ? stored[0].id : initialSpaces[0].id;
  });

  useEffect(() => {
    saveSpaces(spaces, activeSpaceId);
  }, [spaces, activeSpaceId]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];

  function layoutCap(layout?: SpaceConfig["layout"]) {
    return calculateLayoutCapacity(layout, layoutPresets as any);
  }

  function addSpace(name = "New Space") {
    const id = `space-${Date.now()}`;
    const s: SpaceConfig = { id, name, layout: "preset-columns-three", tiles: [], background: { type: "color", value: "#00145c" } };
    setSpaces((prev) => [...prev, s]);
    setActiveSpaceId(id);
  }

  function removeSpace(id: string) {
    setSpaces((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fallback: SpaceConfig = { id: "space-1", name: "Default", layout: "preset-columns-three", tiles: [], background: { type: "color", value: "#00145c" } };
        setActiveSpaceId(fallback.id);
        return [fallback];
      }
      if (id === activeSpaceId) setActiveSpaceId(next[0].id);
      return next;
    });
  }

  function addTileAtActive(tile: AnyTileConfig, index?: number) {
    const current = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];
    const capacity = layoutCap(current.layout);
    
    // Count non-null tiles
    const nonNullCount = current.tiles.filter(t => t !== null).length;
    if (nonNullCount >= capacity) return false;

    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== activeSpaceId) return s;
        const tiles = [...s.tiles];
        
        if (typeof index === "number" && Number.isFinite(index) && index >= 0 && index < capacity) {
          // Fill with nulls up to the index if necessary
          while (tiles.length < index) {
            tiles.push(null as any);
          }
          
          // If index is within current array, check if replacing null or inserting
          if (index < tiles.length) {
            if (tiles[index] === null) {
              tiles[index] = tile;
            } else {
              tiles.splice(index, 0, tile);
            }
          } else {
            tiles[index] = tile;
          }
        } else {
          tiles.push(tile);
        }
        return { ...s, tiles };
      })
    );
    return true;
  }

  function setBackgroundForActive(background?: BackgroundConfig) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, background } : s)));
  }

  function removeTileFromActive(tileId: string) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, tiles: s.tiles.filter((t) => t && t.id !== tileId) } : s)));
  }

  function updateTileInActive(tileId: string, changes: Partial<AnyTileConfig>) {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === activeSpaceId
          ? { ...s, tiles: s.tiles.map((t) => (t && t.id === tileId ? { ...t, ...(changes as any) } : t)) }
          : s
      )
    );
  }

  function setLayoutForActive(layout: SpaceConfig["layout"]) {
    // helper: default spans for presets so UI matches thumbnail layouts
    function getDefaultSpans(presetId?: string) {
      switch (presetId) {
        case "preset-single":
          return [{ w: 1, h: 1 }];
        case "preset-columns-two":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-columns-three":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-stack-two":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-stack-three":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-grid-four":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-focus-three":
          return [{ w: 1, h: 1 }, { w: 1, h: 2 }, { w: 1, h: 1 }];
        case "preset-focus-four":
          return [{ w: 2, h: 2 }, { w: 1, h: 3 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        default:
          return undefined;
      }
    }

    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== activeSpaceId) return s;
        // enforce capacity for layouts that define one
        const capacity = layoutCap(layout as any);
        let tiles = s.tiles;
        if (Number.isFinite(capacity) && tiles.length > capacity) {
          tiles = tiles.slice(0, capacity);
        }

        // apply default spans for known presets to match picker thumbnails
        const spans = getDefaultSpans(layout as any);
        if (spans) {
          tiles = tiles.map((t, i) => t ? { ...t, layoutSpan: spans[i] ?? { w: 1, h: 1 } } : t);
        }

        return { ...s, layout, tiles };
      })
    );
  }

  function setTileGapForActive(gap?: number) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, tileGap: gap } : s)));
  }

  function setNameForActive(name: string) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, name } : s)));
  }

  return {
    spaces,
    activeSpaceId,
    activeSpace,
    setActiveSpaceId,
    addSpace,
    removeSpace,
    removeTileFromActive,
    updateTileInActive,
    setLayoutForActive,
    setBackgroundForActive,
    setNameForActive,
    addTileAtActive,
    setTileGapForActive,
  };
}
