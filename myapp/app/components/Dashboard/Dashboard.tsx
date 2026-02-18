import { Tile } from "../Tile/Tile";
import "./Dashboard.css";
import { tileRegistry } from "../../tiles/registry";
import type { AnyTileConfig, TilePropsMap } from "../../tiles/registry";
import { useEffect, useMemo, useRef, useState } from "react";
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
  layout = "preset-columns-three",
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
  // For 'columns' (infinite), render only existing tiles + a single placeholder in edit mode.
  const slotCount = (() => {
    if (!isEditing) return tiles.length;
    if (Number.isFinite(capacity ?? Infinity)) return Math.max(capacity as number, tiles.length);
    return Math.max(tiles.length + 1, 1);
  })();

  const tileTypes = Object.keys(tileRegistry) as Array<keyof typeof tileRegistry>;

  function handleAdd(type: keyof typeof tileRegistry, index?: number) {
    onAddTile?.(type, index);
    setOpenAddIndex(null);
  }

  const inlineStyle: React.CSSProperties = {};
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredCols, setMeasuredCols] = useState<number | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      const height = el.clientHeight;
      const gap = tileGap ?? 12;
      const unit = Math.max(64, tileUnit ?? 240);
      const cols = Math.max(1, Math.floor((width + gap) / (unit + gap)));
      setMeasuredCols(cols);
      setMeasuredHeight(height);
    }

    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [tileUnit, tileGap]);

  const presetMatch = layoutPresets.find((x) => x.id === (layout ?? ""));
  const presetCols = presetMatch?.meta?.columns;
  const finalCols = Number.isFinite(columnsCount ?? NaN)
    ? (columnsCount as number)
    : presetCols ?? measuredCols ?? 1;

  inlineStyle.gap = `${tileGap}px`;
  (inlineStyle as any)["--tile-gap"] = `${tileGap}px`;
  (inlineStyle as any)["--dashboard-cols"] = String(finalCols);

  const isFocusLayout = layout === "preset-focus-three" || layout === "preset-focus-four";

  const computeRowsNeeded = (cols: number, items: AnyTileConfig[]) => {
    const heights = new Array(cols).fill(0);
    for (const it of items) {
      const w = Math.max(1, Math.min(cols, it.layoutSpan?.w ?? 1));
      const h = Math.max(1, it.layoutSpan?.h ?? 1);

      let bestIdx = 0;
      let bestMax = Infinity;
      for (let c = 0; c <= cols - w; c++) {
        const segmentMax = Math.max(...heights.slice(c, c + w));
        if (segmentMax < bestMax) {
          bestMax = segmentMax;
          bestIdx = c;
        }
      }

      const newHeight = bestMax + h;
      for (let c = bestIdx; c < bestIdx + w; c++) heights[c] = newHeight;
    }
    return Math.max(1, Math.max(...heights));
  };

  let rowsNeeded = computeRowsNeeded(finalCols, tiles);

  if (isFocusLayout) rowsNeeded = Math.max(rowsNeeded, 3);

  const el = containerRef.current;
  const paddingY = 12 * 2;
  const gapsY = Math.max(0, (rowsNeeded - 1) * tileGap);

  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const containerHeight = measuredHeight ?? el?.clientHeight ?? viewportH;
  const availableForRows = Math.max(0, containerHeight - paddingY - gapsY);

  const rowHeight = Math.max(48, Math.floor(availableForRows / Math.max(1, rowsNeeded)));
  (inlineStyle as any)["--tile-row"] = `${rowHeight}px`;

  const columnWidth = (() => {
    const el = containerRef.current;
    if (!el) return Math.max(64, tileUnit);
    const totalGap = Math.max(0, (finalCols - 1) * tileGap);
    const width = Math.max(0, el.clientWidth - totalGap);
    return Math.max(32, Math.floor(width / finalCols));
  })();

  const focusPlacements = useMemo(() => {
    if (layout === "preset-focus-three") {
      return [
        { gridColumn: "1 / span 2", gridRow: "1 / span 2" },
        { gridColumn: "1", gridRow: "3" },
        { gridColumn: "2", gridRow: "3" },
      ] satisfies React.CSSProperties[];
    }
    if (layout === "preset-focus-four") {
      return [
        { gridColumn: "1 / span 2", gridRow: "1 / span 2" },
        { gridColumn: "3", gridRow: "1 / span 3" },
        { gridColumn: "1", gridRow: "3" },
        { gridColumn: "2", gridRow: "3" },
      ] satisfies React.CSSProperties[];
    }
    return null;
  }, [layout]);

  const getFocusPlacement = (idx: number): React.CSSProperties | undefined => {
    if (!focusPlacements) return undefined;
    return focusPlacements[idx];
  };

  return (
    <div ref={containerRef} className={`dashboard layout-${sanitizeId(layout)}`} style={inlineStyle}>
      {Array.from({ length: slotCount }).map((_, i) => {
        const tile = tiles[i];

        if (tile) {
          const TileComponent = tileRegistry[tile.type]
            .component as React.ComponentType<TilePropsMap[typeof tile.type]>;

          const spanW = Math.max(1, Math.min(finalCols, tile.layoutSpan?.w ?? 1));
          const spanH = Math.max(1, tile.layoutSpan?.h ?? 1);

          const focusStyle = isFocusLayout ? getFocusPlacement(i) : undefined;
          const placementStyle: React.CSSProperties =
            focusStyle ?? { gridColumn: `span ${spanW}`, gridRow: `span ${spanH}` };

          return (
            <div className="dashboard-tile" key={tile.id} style={placementStyle}>
              <Tile
                title={tile.title}
                isEditing={isEditing}
                onRemove={() => onRemoveTile?.(tile.id)}
                onUpdateTitle={(title) => onUpdateTile?.(tile.id, { title })}
                tileType={tile.type}
                tileProps={tile.props}
                onUpdateProps={(props) => onUpdateTile?.(tile.id, { props })}
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
        const focusStyle = isFocusLayout ? getFocusPlacement(i) : undefined;
        const placeholderStyle: React.CSSProperties =
          focusStyle ?? { gridColumn: `span 1`, gridRow: `span 1` };

        return (
          <div
            className="dashboard-tile dashboard-placeholder"
            key={`slot-${i}`}
            style={placeholderStyle}
          >
            <button
              className="placeholder-button"
              onClick={() => setOpenAddIndex(openAddIndex === i ? null : i)}
              aria-expanded={openAddIndex === i}
              disabled={!isEditing}
            >
              <div className="placeholder-plus">+</div>
            </button>

            {openAddIndex === i && (
              <div className="placeholder-menu">
                {tileTypes.map((t) => (
                  <button key={t} onClick={() => handleAdd(t, i)} className="placeholder-menu-item">
                    + {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
