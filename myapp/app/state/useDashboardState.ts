import { useEffect, useState } from "react";
import type { AnyTileConfig } from "../tiles/registry";
import { loadSpaces, saveSpaces, type SpaceConfig } from "./dashboardStorage";
import { presets as layoutPresets } from "../components/LayoutPicker/LayoutPicker";

export function useDashboardState(initialTiles: AnyTileConfig[] = []) {
  const initialSpaces: SpaceConfig[] = [
    {
      id: "space-1",
      name: "Default",
      layout: "preset-three-grid",
      layoutColumns: 2,
      tiles: initialTiles,
      backgroundColor: undefined,
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
        const exists = tiles.some((t) => t.type === def.type && t.title === def.title);
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

  function layoutCapacity(layout?: SpaceConfig["layout"]) {
    if (!layout) return Infinity;
    const p = layoutPresets.find((x) => x.id === layout);
    if (p?.meta?.capacity !== undefined) return p.meta.capacity;
    switch (layout) {
      case "focus":
        return 3;
      default:
        return Infinity;
    }
  }

  function addSpace(name = "New Space") {
    const id = `space-${Date.now()}`;
    const s: SpaceConfig = { id, name, layout: "preset-three-grid", tiles: [], backgroundColor: undefined };
    setSpaces((prev) => [...prev, s]);
    setActiveSpaceId(id);
  }

  function removeSpace(id: string) {
    setSpaces((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fallback: SpaceConfig = { id: "space-1", name: "Default", layout: "preset-three-grid", tiles: [], backgroundColor: undefined };
        setActiveSpaceId(fallback.id);
        return [fallback];
      }
      if (id === activeSpaceId) setActiveSpaceId(next[0].id);
      return next;
    });
  }

  function addTileToActive(tile: AnyTileConfig) {
    // Prevent adding tiles if the layout capacity is reached.
    const current = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];
    const capacity = layoutCapacity(current.layout);
    if (current.tiles.length >= capacity) return false;

    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, tiles: [...s.tiles, tile] } : s)));
    return true;
  }

  function addTileAtActive(tile: AnyTileConfig, index?: number) {
    const current = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];
    const capacity = layoutCapacity(current.layout);
    if (current.tiles.length >= capacity) return false;

    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== activeSpaceId) return s;
        const tiles = [...s.tiles];
        if (index === undefined || index < 0 || index > tiles.length) {
          tiles.push(tile);
        } else {
          tiles.splice(index, 0, tile);
        }
        return { ...s, tiles };
      })
    );
    return true;
  }

  function setBackgroundForActive(color?: string) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, backgroundColor: color } : s)));
  }

  function removeTileFromActive(tileId: string) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, tiles: s.tiles.filter((t) => t.id !== tileId) } : s)));
  }

  function updateTileInActive(tileId: string, changes: Partial<AnyTileConfig>) {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === activeSpaceId
          ? { ...s, tiles: s.tiles.map((t) => (t.id === tileId ? { ...t, ...(changes as any) } : t)) }
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
        case "preset-two-side":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-two-stack":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-three-grid":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-focus-small":
          return [{ w: 1, h: 1 }, { w: 1, h: 2 }, { w: 1, h: 1 }];
        case "preset-four-2x2":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-four-columns":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        case "preset-five-mosaic":
          return [
            { w: 2, h: 2 },
            { w: 1, h: 1 },
            { w: 1, h: 1 },
            { w: 1, h: 1 },
            { w: 2, h: 1 },
          ];
        case "preset-three-rows":
          return [{ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 }];
        default:
          return undefined;
      }
    }

    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== activeSpaceId) return s;
        // enforce capacity for layouts that define one
        const capacity = layoutCapacity(layout as any);
        let tiles = s.tiles;
        if (Number.isFinite(capacity) && tiles.length > capacity) {
          tiles = tiles.slice(0, capacity);
        }

        // apply default spans for known presets to match picker thumbnails
        const spans = getDefaultSpans(layout as any);
        if (spans) {
          tiles = tiles.map((t, i) => ({ ...t, layoutSpan: spans[i] ?? { w: 1, h: 1 } }));
        }

        return { ...s, layout, tiles };
      })
    );
  }

  function setLayoutColumnsForActive(count?: number) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, layoutColumns: count } : s)));
  }

  function setTileUnitForActive(unit?: number) {
    setSpaces((prev) => prev.map((s) => (s.id === activeSpaceId ? { ...s, tileUnit: unit } : s)));
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
    addTileToActive,
    removeTileFromActive,
    updateTileInActive,
    setLayoutForActive,
    setBackgroundForActive,
    setNameForActive,
    addTileAtActive,
    setLayoutColumnsForActive,
    setTileUnitForActive,
    setTileGapForActive,
  };
}
