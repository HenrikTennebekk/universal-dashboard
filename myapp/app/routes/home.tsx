import { Dashboard } from "../components/Dashboard/Dashboard";
import { useDashboardState } from "../state/useDashboardState";
import { useState, useEffect } from "react";
import type { AnyTileConfig } from "../tiles/registry";
import { tileRegistry } from "../tiles/registry";
import LayoutPicker, { presets as layoutPresets } from "../components/LayoutPicker/LayoutPicker";
import { createTile, layoutCapacity as calculateLayoutCapacity, type TileType } from "../utils/tileUtils";
import "./home.css";

const defaultTiles: AnyTileConfig[] = [
  {
    id: "clock-1",
    type: "clock",
    props: {
      timeZone: "auto",
    },
    layoutSpan: { w: 2, h: 1 },
  },
];

export default function Home() {
  const {
    spaces,
    activeSpace,
    activeSpaceId,
    setActiveSpaceId,
    addSpace,
    addTileAtActive,
    setTileGapForActive,
    setLayoutForActive,
    setBackgroundForActive,
    removeTileFromActive,
    updateTileInActive,
    removeSpace,
    setNameForActive,
  } = useDashboardState(defaultTiles);


  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditing) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      )
        return;
      // ignore modifier-only presses
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      setIsEditing(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditing]);

  const tileTypes = Object.keys(tileRegistry) as Array<keyof typeof tileRegistry>;

  // compute whether the current layout is at capacity
  const layoutCap = (layout?: string | undefined) => {
    return calculateLayoutCapacity(layout, layoutPresets as any);
  };

  const isLayoutFull = (activeSpace && activeSpace.tiles.length >= layoutCap(activeSpace.layout)) ?? false;

  return (
    <div className="home-root" style={{ backgroundColor: activeSpace?.backgroundColor ?? undefined }}>
      {isEditing && (
        <div className="home-toolbar">
          <div className="left">
            <button onClick={() => setIsEditing(false)} style={{ marginRight: 8 }}>
              Exit
            </button>

            <label>Name:</label>
            <input
              type="text"
              value={activeSpace?.name ?? ""}
              onChange={(e) => setNameForActive?.(e.target.value)}
              placeholder="Space name"
              style={{ width: 180 }}
            />

            <button
              onClick={() => {
                addSpace("New Space");
              }}
            >
              +
            </button>

            <button
              onClick={() => {
                const name = activeSpace?.name ?? "this space";
                if (!activeSpace?.id) return;
                removeSpace(activeSpace.id);
              }}
            >
              -
            </button>
          </div>

          <label>Space:</label>
            <select value={activeSpaceId} onChange={(e) => setActiveSpaceId(e.target.value)}>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

          <div className="right">
            <div>
              <LayoutPicker
                value={(activeSpace?.layout as any) ?? "preset-columns-three"}
                onChange={(l) => setLayoutForActive(l)}
              />
            </div>

            <div>
              <label>Gap:</label>
              <input
                type="number"
                value={activeSpace?.tileGap ?? 12}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value) || 0);
                  // @ts-ignore
                  setTileGapForActive?.(v);
                }}
                style={{ width: 60, marginLeft: 8 }}
                title="Gap between tiles in pixels"
              />
            </div>

            <div>
              <label>Background:</label>
              <input
                type="color"
                value={activeSpace?.backgroundColor ?? "#00145c"}
                onChange={(e) => setBackgroundForActive(e.target.value)}
                style={{ marginLeft: 8, verticalAlign: "middle" }}
                title="Choose background color"
              />
            </div>

          </div>
        </div>
      )}

      <Dashboard
        tiles={activeSpace?.tiles ?? []}
        layout={activeSpace?.layout ?? "preset-columns-three"}
        columnsCount={activeSpace?.layoutColumns}
        tileUnit={activeSpace?.tileUnit}
        tileGap={activeSpace?.tileGap}
        isEditing={isEditing}
        capacity={layoutCap(activeSpace?.layout)}
        onRemoveTile={removeTileFromActive}
        onUpdateTile={updateTileInActive}
        onAddTile={(type, index) => {
          const tile = createTile(type);
          const ok = addTileAtActive(tile, index);
          if (!ok) {
            alert("Cannot add tile — layout is full.");
          }
        }}
      />
    </div>
  );
}

