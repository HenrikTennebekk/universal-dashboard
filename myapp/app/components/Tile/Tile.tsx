import "./Tile.css";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

type TileProps = {
  title: string;
  children: ReactNode;
  isEditing?: boolean;
  onRemove?: () => void;
  onUpdateTitle?: (title: string) => void;
  tileType?: string;
  tileProps?: any;
  onUpdateProps?: (props: any) => void;
  layoutSpan?: { w?: number; h?: number };
  onUpdateLayoutSpan?: (span: { w?: number; h?: number }) => void;
  // internal props passed from Dashboard for interactive resizing
  _gridUnit?: number;
  _rowHeight?: number;
  _cols?: number;
  _maxRows?: number;
};

export function Tile({ title, children, isEditing, onRemove, onUpdateTitle, tileType, tileProps, onUpdateProps, layoutSpan, onUpdateLayoutSpan, _gridUnit, _rowHeight, _cols }: TileProps) {
  const [editingTitle, setEditingTitle] = useState(title);
  const [editingProps, setEditingProps] = useState<any>(tileProps ?? {});
  const [editingSpan, setEditingSpan] = useState<{ w?: number; h?: number }>(layoutSpan ?? { w: 1, h: 1 });
  const [showPropsEditor, setShowPropsEditor] = useState(false);

  useEffect(() => setEditingSpan(layoutSpan ?? { w: 1, h: 1 }), [layoutSpan]);

  // Interactive resize handlers
  function startDrag(e: React.MouseEvent | React.TouchEvent, mode: "w" | "h" | "both") {
    if (!isEditing) return;
    e.preventDefault();
    const startX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const startY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const startSpan = { w: editingSpan.w ?? 1, h: editingSpan.h ?? 1 };

    function onMove(ev: MouseEvent | TouchEvent) {
      const mx = "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const my = "touches" in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      const dx = mx - startX;
      const dy = my - startY;

        const unit = _gridUnit ?? 320;
        const rowH = _rowHeight ?? 200;
        const cols = _cols ?? 1;
        const maxRows = _maxRows ?? Infinity;

      let dW = 0;
      let dH = 0;
      if (mode === "w" || mode === "both") dW = Math.round(dx / unit);
      if (mode === "h" || mode === "both") dH = Math.round(dy / rowH);

      const next = {
        w: Math.max(1, Math.min(cols, (startSpan.w ?? 1) + dW)),
        h: Math.max(1, Math.min(maxRows, (startSpan.h ?? 1) + dH)),
      };
      setEditingSpan(next);
      onUpdateLayoutSpan?.(next);
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove as any);
      document.removeEventListener("touchmove", onMove as any);
      document.removeEventListener("mouseup", onUp as any);
      document.removeEventListener("touchend", onUp as any);
    }

    document.addEventListener("mousemove", onMove as any, { passive: false });
    document.addEventListener("touchmove", onMove as any, { passive: false });
    document.addEventListener("mouseup", onUp as any);
    document.addEventListener("touchend", onUp as any);
  }

  function saveProps() {
    onUpdateProps?.(editingProps);
    onUpdateLayoutSpan?.(editingSpan);
    setShowPropsEditor(false);
  }

  return (
    <div className="tile">
      {isEditing && (
        <div className="tile-header-row">
          {isEditing ? (
            <input
              className="tile-title-input"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => onUpdateTitle?.(editingTitle)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          ) : (
            <h2 className="tile-header">{title}</h2>
          )}

          {isEditing && (
            <div style={{ marginLeft: "8px", display: "flex", gap: 8 }}>
              <button onClick={() => setShowPropsEditor((v) => !v)} aria-label="Edit props">
                {showPropsEditor ? "Close" : "Edit props"}
              </button>
              <button onClick={onRemove} aria-label="Remove tile">
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {isEditing && showPropsEditor && (
        <div className="tile-props-editor">
          {tileType === "link" && (
            <div>
              <label>URL:</label>
              <input
                value={editingProps?.url ?? ""}
                onChange={(e) => setEditingProps({ ...editingProps, url: e.target.value })}
                onBlur={() => saveProps()}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {tileType === "weather" && (
            <div>
              <label>City:</label>
              <input
                value={editingProps?.city ?? ""}
                onChange={(e) => setEditingProps({ ...editingProps, city: e.target.value })}
                onBlur={() => saveProps()}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {tileType === "clock" && (
            <div>
              <label>Timezone:</label>
              <input
                value={editingProps?.timeZone ?? ""}
                onChange={(e) => setEditingProps({ ...editingProps, timeZone: e.target.value })}
                onBlur={() => saveProps()}
                placeholder="auto or Europe/Oslo"
                style={{ width: "100%" }}
              />
            </div>
          )}

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={saveProps}>Save</button>
            <button
              onClick={() => {
                setEditingProps(tileProps ?? {});
                setShowPropsEditor(false);
              }}
            >
              Cancel
            </button>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Width (units):
              <input
                type="number"
                min={1}
                max={12}
                value={editingSpan?.w ?? 1}
                onChange={(e) => setEditingSpan({ ...editingSpan, w: Math.max(1, Number(e.target.value) || 1) })}
                onBlur={() => onUpdateLayoutSpan?.(editingSpan)}
                style={{ width: 72 }}
              />
            </label>

            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Height (units):
              <input
                type="number"
                min={1}
                max={12}
                value={editingSpan?.h ?? 1}
                onChange={(e) => setEditingSpan({ ...editingSpan, h: Math.max(1, Number(e.target.value) || 1) })}
                onBlur={() => onUpdateLayoutSpan?.(editingSpan)}
                style={{ width: 72 }}
              />
            </label>
          </div>
        </div>
      )}

      <div className="tile-content">{children}</div>
      {isEditing && (
        <>
          <div
            className="tile-handle tile-handle-right"
            onMouseDown={(e) => startDrag(e, "w")}
            onTouchStart={(e) => startDrag(e, "w")}
            aria-hidden
          />
          <div
            className="tile-handle tile-handle-bottom"
            onMouseDown={(e) => startDrag(e, "h")}
            onTouchStart={(e) => startDrag(e, "h")}
            aria-hidden
          />
          <div
            className="tile-handle tile-handle-corner"
            onMouseDown={(e) => startDrag(e, "both")}
            onTouchStart={(e) => startDrag(e, "both")}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
