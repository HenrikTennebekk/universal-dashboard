import "./Tile.css";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

// Common IANA timezones
const COMMON_TIMEZONES = [
  "auto",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Oslo",
  "Europe/Amsterdam",
  "Europe/Copenhagen",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

type TileProps = {
  children: ReactNode;
  isEditing?: boolean;
  onRemove?: () => void;
  tileType?: string;
  tileProps?: any;
  onUpdateProps?: (props: any) => void;
  // internal props passed from Dashboard for interactive resizing
  _gridUnit?: number;
  _rowHeight?: number;
  _cols?: number;
  _maxRows?: number;
};

export function Tile({ children, isEditing, onRemove, tileType, tileProps, onUpdateProps, _gridUnit, _rowHeight, _cols }: TileProps) {
  const [editingProps, setEditingProps] = useState<any>(tileProps ?? {});
  const [showPropsEditor, setShowPropsEditor] = useState(false);

  function saveProps() {
    onUpdateProps?.(editingProps);
    setShowPropsEditor(false);
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const readFile = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

    try {
      const uploaded = await Promise.all(Array.from(files).map(readFile));
      setEditingProps((prev: any) => {
        const existing = Array.isArray(prev?.images) ? prev.images : [];
        return { ...prev, images: [...existing, ...uploaded.filter(Boolean)] };
      });
    } catch {
      // Ignore failed reads; user can retry.
    }
  }

  return (
    <div className="tile">
      {isEditing && (
        <div className="tile-header-row">
          <button onClick={() => setShowPropsEditor((v) => !v)} aria-label="Edit props">
            {showPropsEditor ? "Close" : "Edit"}
          </button>
          <button onClick={onRemove} aria-label="Remove tile">
            Remove
          </button>
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
                <select
                  className="tile-input-full"
                  value={editingProps?.timeZone ?? "auto"}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "__custom__") {
                      // User wants to enter custom timezone
                      const custom = prompt("Enter IANA timezone (e.g., America/New_York):");
                      if (custom) {
                        setEditingProps({ ...editingProps, timeZone: custom });
                      }
                    } else {
                      setEditingProps({ ...editingProps, timeZone: value });
                    }
                  }}
                  onBlur={() => saveProps()}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz === "auto" ? "Auto-detect (System)" : tz}
                    </option>
                  ))}
                  <option value="__custom__" disabled={!editingProps?.timeZone || COMMON_TIMEZONES.includes(editingProps.timeZone)}>
                    ─ Enter custom timezone ─
                  </option>
                </select>
                {editingProps?.timeZone && !COMMON_TIMEZONES.includes(editingProps.timeZone) && (
                  <div style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "4px" }}>
                    Custom: {editingProps.timeZone}
                  </div>
                )}
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

          {tileType === "image" && (
            <div className="tile-grid-col">
              <div>
                <label>Images:</label>
                <input
                  className="tile-input-full"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageFiles(e.target.files)}
                />
              </div>

              <div>
                <label>Interval (seconds):</label>
                <input
                  className="tile-input-full"
                  type="number"
                  min={1}
                  value={editingProps?.intervalSeconds ?? 6}
                  onChange={(e) => setEditingProps({ ...editingProps, intervalSeconds: Math.max(1, Number(e.target.value) || 1) })}
                  onBlur={() => saveProps()}
                />
              </div>

              {Array.isArray(editingProps?.images) && editingProps.images.length > 0 && (
                <div className="tile-grid-col">
                  <div>Images: {editingProps.images.length}</div>
                  {editingProps.images.map((src: string, idx: number) => (
                    <div key={`${idx}-${src.slice(0, 24)}`} className="tile-flex-row">
                      <img className="tile-image-thumb" src={src} alt="" />
                      <button
                        onClick={() => {
                          const next = editingProps.images.filter((_: string, i: number) => i !== idx);
                          setEditingProps({ ...editingProps, images: next });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
        </div>
      )}

      <div className={`tile-content${tileType === "clock" ? " tile-content--clock" : ""}`}>{children}</div>
    </div>
  );
}
