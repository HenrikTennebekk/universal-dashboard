import { Tile } from "../Tile/Tile"; // assume named export
import "./Dashboard.css";
import { tileRegistry } from "../../tiles/registry";
import type { AnyTileConfig, TilePropsMap } from "../../tiles/registry";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { presets as layoutPresets } from "../LayoutPicker/LayoutPicker";

type DashboardProps = {
  tiles: AnyTileConfig[];
  layout?: string;
  isEditing?: boolean;
  capacity?: number; // optional number of slots for this layout (Infinity for free)
  columnsCount?: number;
  // visual sizing and spacing (pixels). If omitted, dashboard can compute columns automatically.
  tileUnit?: number;
  tileGap?: number;
  onRemoveTile?: (id: string) => void;
  onUpdateTile?: (id: string, changes: Partial<AnyTileConfig>) => void;
  onAddTile?: (type: keyof typeof tileRegistry, index?: number) => void;
};

export function Dashboard({
  tiles,
  layout = "preset-three-grid",
  isEditing,
  capacity,
  columnsCount,
  tileUnit = 320,
  tileGap = 12,
  onRemoveTile,
  onUpdateTile,
  onAddTile,
}: DashboardProps) {
  const [openAddIndex, setOpenAddIndex] = useState<number | null>(null);

  const sanitizeId = (id?: string) => {
    if (!id) return "default";
    return String(id).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  };

  // If layout has explicit capacity (finite), show all slots.
  // For 'columns' (infinite), render only existing columns so they stretch to full width
  // and provide an explicit "Add column" button instead of many placeholders.
  const slotCount = (() => {
    if (!isEditing) return tiles.length;
    if (Number.isFinite(capacity ?? Infinity)) return Math.max(capacity as number, tiles.length);
    // default: show tiles plus a single placeholder to let the user add more
    return Math.max(tiles.length + 1, 1);
  })();

  const tileTypes = Object.keys(tileRegistry) as Array<keyof typeof tileRegistry>;

  function handleAdd(type: keyof typeof tileRegistry, index?: number) {
    onAddTile?.(type, index);
    setOpenAddIndex(null);
  }

  const inlineStyle: React.CSSProperties = {};
  // We'll compute concrete column count so each column is exactly `tileUnit` px wide
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredCols, setMeasuredCols] = useState<number | null>(null);

  useEffect(() => {
    function computeCols() {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      const gap = tileGap ?? 12;
      const unit = Math.max(64, tileUnit ?? 240);
      const cols = Math.max(1, Math.floor((width + gap) / (unit + gap)));
      setMeasuredCols(cols);
    }

    computeCols();
    const ro = new ResizeObserver(() => computeCols());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", computeCols);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeCols);
    };
  }, [tileUnit, tileGap]);

  // If a specific columnsCount is provided (e.g., columns preset or preset meta), prefer that.
  const presetMatch = layoutPresets.find((x) => x.id === (layout ?? ""));
  const presetCols = presetMatch?.meta?.columns;
  const finalCols = Number.isFinite(columnsCount ?? NaN)
    ? (columnsCount as number)
    : presetCols ?? measuredCols ?? 1;

  // set grid template so columns evenly split the available width (prevent overflow)
  inlineStyle.gridTemplateColumns = `repeat(${finalCols}, 1fr)`;
  inlineStyle.gap = `${tileGap}px`;
  (inlineStyle as any)["--tile-gap"] = `${tileGap}px`;

  // compute rows needed to place tiles given their spans so we can size rows to fill container
  const computeRowsNeeded = (cols: number, items: AnyTileConfig[]) => {
    const heights = new Array(cols).fill(0);
    for (const it of items) {
      const w = Math.max(1, Math.min(cols, it.layoutSpan?.w ?? 1));
      const h = Math.max(1, it.layoutSpan?.h ?? 1);
      // find placement column: leftmost index where max height over the span is minimal
      let bestIdx = 0;
      let bestMax = Infinity;
      for (let c = 0; c <= cols - w; c++) {
        const segmentMax = Math.max(...heights.slice(c, c + w));
        if (segmentMax < bestMax) {
          bestMax = segmentMax;
          bestIdx = c;
        }
      }
      // place tile
      const newHeight = bestMax + h;
      for (let c = bestIdx; c < bestIdx + w; c++) heights[c] = newHeight;
    }
    return Math.max(1, Math.max(...heights));
  };

  const rowsNeeded = computeRowsNeeded(finalCols, tiles);

  // set row height so rowsNeeded * rowHeight == container height (fill whole area)
  const containerHeight = containerRef.current?.clientHeight ?? 800;
  const rowHeight = Math.max(48, Math.floor(containerHeight / Math.max(1, rowsNeeded)));
  (inlineStyle as any)["--tile-row"] = `${rowHeight}px`;

  // compute current column pixel width for interactive resizing (actual rendered size)
  const columnWidth = (() => {
    const el = containerRef.current;
    if (!el) return Math.max(64, tileUnit);
    const totalGap = Math.max(0, (finalCols - 1) * tileGap);
    const width = Math.max(0, el.clientWidth - totalGap);
    return Math.max(32, Math.floor(width / finalCols));
  })();

  return (
    <div ref={containerRef} className={`dashboard layout-${sanitizeId(layout)}`} style={inlineStyle}>
      {Array.from({ length: slotCount }).map((_, i) => {
        const tile = tiles[i];
        if (tile) {
          const TileComponent = tileRegistry[tile.type]
            .component as React.ComponentType<TilePropsMap[typeof tile.type]>;

          const spanW = Math.max(1, Math.min(finalCols, tile.layoutSpan?.w ?? 1));
          const spanH = Math.max(1, tile.layoutSpan?.h ?? 1);

          return (
            <div className="dashboard-tile" key={tile.id} style={{ gridColumn: `span ${spanW}`, gridRow: `span ${spanH}` }}>
              <Tile
                title={tile.title}
                isEditing={isEditing}
                onRemove={() => onRemoveTile?.(tile.id)}
                onUpdateTitle={(title) => onUpdateTile?.(tile.id, { title })}
                tileType={tile.type}
                tileProps={tile.props}
                onUpdateProps={(props) => onUpdateTile?.(tile.id, { props })}
                layoutSpan={tile.layoutSpan}
                onUpdateLayoutSpan={(span) => onUpdateTile?.(tile.id, { layoutSpan: span })}
                // pass sizing info for interactive resizing
                _gridUnit={columnWidth}
                _rowHeight={rowHeight}
                _cols={finalCols}
                _maxRows={rowsNeeded}
              >
                <TileComponent {...(tile.props as TilePropsMap[typeof tile.type])} />
              </Tile>
            </div>
          );
        }

        // empty placeholder slot
        return (
          <div className="dashboard-tile dashboard-placeholder" key={`slot-${i}`} style={{ gridColumn: `span 1`, gridRow: `span 1` }}>
            <button
              className="placeholder-button"
              onClick={() => setOpenAddIndex(openAddIndex === i ? null : i)}
              aria-expanded={openAddIndex === i}
              aria-label={`Add tile in slot ${i + 1}`}
              disabled={!isEditing}
              title={isEditing ? "Add tile" : "Enter edit mode to add tiles"}
            >
              <div className="placeholder-plus">+</div>
              <div className="placeholder-text">Add</div>
            </button>

            {openAddIndex === i && (
              <div className="placeholder-menu">
                {tileTypes.map((t) => (
                  <button key={t} onClick={() => handleAdd(t, i)} className="placeholder-menu-item">
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* add-column button removed — use LayoutPicker to configure columns or placeholders to add tiles */}
    </div>
  );
}
