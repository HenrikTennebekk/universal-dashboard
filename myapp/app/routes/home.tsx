import { Dashboard } from "../components/Dashboard/Dashboard";
import { useDashboardState } from "../state/useDashboardState";
import { useState, useEffect } from "react";
import type { AnyTileConfig } from "../tiles/registry";
import { tileRegistry } from "../tiles/registry";
import LayoutPicker, { presets as layoutPresets } from "../components/LayoutPicker/LayoutPicker";
import "./home.css";

const defaultTiles: AnyTileConfig[] = [
  {
    id: "clock-1",
    type: "clock",
    title: "Local Time",
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
    addTileToActive,
    addTileAtActive,
    setLayoutColumnsForActive,
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

  function handleAddTile(type: typeof tileTypes[number]) {
    const id = `${type}-${Date.now()}`;
    const title = type === "clock" ? "Clock" : type === "link" ? "Link" : "Weather";
    const defaultProps: Record<string, any> = {
      clock: { timeZone: "auto" },
      link: { url: "https://example.com" },
      weather: { city: "" },
    };

    const tile: AnyTileConfig = {
      id,
      type: type as any,
      title,
      props: defaultProps[type as string],
    };

    const ok = addTileToActive(tile);
    if (!ok) {
      // simple feedback; UI also disables buttons when full
      // eslint-disable-next-line no-restricted-globals
      alert("Cannot add tile — layout is full.");
    }
  }

  // compute whether the current layout is at capacity
  const layoutCap = (layout?: string | undefined) => {
    if (!layout) return Infinity;
    const p = layoutPresets.find((x) => x.id === layout);
    if (p?.meta?.capacity !== undefined) return p.meta.capacity;
    // fallback for older built-ins
    if (layout === "focus") return 3;
    return Infinity;
  };

  const isLayoutFull = (activeSpace && activeSpace.tiles.length >= layoutCap(activeSpace.layout)) ?? false;

  return (
    <div className="home-root" style={{ backgroundColor: activeSpace?.backgroundColor ?? undefined }}>
      {isEditing && (
        <div className="home-toolbar">
          <div className="left">
            <button onClick={() => setIsEditing(false)} style={{ marginRight: 8 }}>
              Done
            </button>

            <label>Name:</label>
            <input
              type="text"
              value={activeSpace?.name ?? ""}
              onChange={(e) => setNameForActive?.(e.target.value)}
              placeholder="Space name"
              style={{ width: 180 }}
            />

            <label>Space:</label>
            <select value={activeSpaceId} onChange={(e) => setActiveSpaceId(e.target.value)}>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                // Ask user for a name for the new space
                // eslint-disable-next-line no-restricted-globals
                const name = prompt("Name for new space", "New Space");
                if (name === null) return;
                addSpace(name.trim() || "New Space");
              }}
            >
              + New Space
            </button>

            <button
              onClick={() => {
                const name = activeSpace?.name ?? "this space";
                if (!activeSpace?.id) return;
                // eslint-disable-next-line no-restricted-globals
                if (confirm(`Delete space "${name}"? This cannot be undone.`)) {
                  removeSpace(activeSpace.id);
                }
              }}
              style={{ marginLeft: 8 }}
            >
              Delete Space
            </button>
          </div>

          <div className="right">
            <div>
              <label>Layout:</label>
              <LayoutPicker
                value={(activeSpace?.layout as any) ?? "preset-three-grid"}
                currentColumns={activeSpace?.layoutColumns}
                onChange={(l) => setLayoutForActive(l)}
                onConfigureColumns={(n) => {
                  setLayoutColumnsForActive(n);
                }}
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
                value={activeSpace?.backgroundColor ?? "#ffffff"}
                onChange={(e) => setBackgroundForActive(e.target.value)}
                style={{ marginLeft: 8, verticalAlign: "middle" }}
                title="Choose background color"
              />
              <button onClick={() => setBackgroundForActive(undefined)} style={{ marginLeft: 8 }}>
                Clear
              </button>
            </div>

          </div>
        </div>
      )}

      <Dashboard
        tiles={activeSpace?.tiles ?? []}
        layout={activeSpace?.layout ?? "preset-three-grid"}
        columnsCount={activeSpace?.layoutColumns}
        tileUnit={activeSpace?.tileUnit}
        tileGap={activeSpace?.tileGap}
        isEditing={isEditing}
        capacity={layoutCap(activeSpace?.layout)}
        onRemoveTile={removeTileFromActive}
        onUpdateTile={updateTileInActive}
        onAddTile={(type, index) => {
          const id = `${type}-${Date.now()}`;
          const title = type === "clock" ? "Clock" : type === "link" ? "Link" : "Weather";
          const defaultProps: Record<string, any> = {
            clock: { timeZone: "auto" },
            link: { url: "https://example.com" },
            weather: { city: "" },
          };

          const tile: AnyTileConfig = {
            id,
            type: type as any,
            title,
            props: defaultProps[type as string],
          };

          // try to insert at index; fallback to append
          const ok = (addTileAtActive as any)?.(tile, index) ?? false;
          if (!ok) {
            // try append
            addTileToActive(tile);
          }
        }}
      />
    </div>
  );
}

