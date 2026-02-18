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
            <div className="tile-flex-row" style={{ marginLeft: "8px" }}>
              <button onClick={() => setShowPropsEditor((v) => !v)} aria-label="Edit props">
                {showPropsEditor ? "Close" : "Edit"}
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
                className="tile-input-full"
                value={editingProps?.url ?? ""}
                onChange={(e) => setEditingProps({ ...editingProps, url: e.target.value })}
                onBlur={() => saveProps()}
              />
            </div>
          )}

          {tileType === "weather" && (
            <div>
              <label>City:</label>
              <input
                className="tile-input-full"
                value={editingProps?.city ?? ""}
                onChange={(e) => setEditingProps({ ...editingProps, city: e.target.value })}
                onBlur={() => saveProps()}
              />
            </div>
          )}

          {tileType === "clock" && (
            <div className="tile-grid-col">
              <div>
                <label>Timezone:</label>
                <input
                  className="tile-input-full"
                  value={editingProps?.timeZone ?? ""}
                  onChange={(e) => setEditingProps({ ...editingProps, timeZone: e.target.value })}
                  onBlur={() => saveProps()}
                  placeholder="auto or Europe/Oslo"
                />
              </div>

              <div>
                <label>Clock type:</label>
                <select
                  className="tile-input-full"
                  value={editingProps?.variant ?? "digital"}
                  onChange={(e) => {
                    setEditingProps({ ...editingProps, variant: e.target.value });
                  }}
                  onBlur={() => saveProps()}
                >
                  <option value="digital">Digital</option>
                  <option value="analog">Analog</option>
                </select>
              </div>

              <label className="tile-flex-row">
                <input
                  type="checkbox"
                  checked={editingProps?.use24Hour ?? true}
                  onChange={(e) => {
                    setEditingProps({ ...editingProps, use24Hour: e.target.checked });
                  }}
                  onBlur={() => saveProps()}
                />
                24-hour time
              </label>
            </div>
          )}


          <div className="tile-flex-row" style={{ marginTop: 8 }}>
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
          <div className="tile-flex-row" style={{ marginTop: 8 }}>
            <label className="tile-label">
              Width (units):
              <input
                className="tile-input-small"
                type="number"
                min={1}
                max={12}
                value={editingSpan?.w ?? 1}
                onChange={(e) => setEditingSpan({ ...editingSpan, w: Math.max(1, Number(e.target.value) || 1) })}
                onBlur={() => onUpdateLayoutSpan?.(editingSpan)}
              />
            </label>

            <label className="tile-label">
              Height (units):
              <input
                className="tile-input-small"
                type="number"
                min={1}
                max={12}
                value={editingSpan?.h ?? 1}
                onChange={(e) => setEditingSpan({ ...editingSpan, h: Math.max(1, Number(e.target.value) || 1) })}
                onBlur={() => onUpdateLayoutSpan?.(editingSpan)}
              />
            </label>
          </div>
        </div>
      )}

      <div className={`tile-content${tileType === "clock" ? " tile-content--clock" : ""}`}>{children}</div>
    </div>
  );
}
