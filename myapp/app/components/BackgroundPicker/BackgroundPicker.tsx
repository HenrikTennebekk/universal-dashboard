import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import "./BackgroundPicker.css";

export type BackgroundConfig = {
  type: "color" | "gradient" | "image";
  value: string;
};

type Props = {
  value?: BackgroundConfig;
  onChange: (bg: BackgroundConfig) => void;
};

export function BackgroundPicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientColor1, setGradientColor1] = useState("#ff0000");
  const [gradientColor2, setGradientColor2] = useState("#ff8800");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bgType = value?.type ?? "color";
  const bgValue = value?.value ?? "#ff8800";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === "string") {
          onChange({ type: "image", value: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const buildGradientCSS = () => {
    return `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
  };

  const buildAndSendGradient = () => {
    onChange({ type: "gradient", value: buildGradientCSS() });
  };

  const handleOpenMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setIsOpen(true);
  };

  const handleTypeChange = (type: "color" | "gradient" | "image") => {
    if (type === "gradient") {
      onChange({ type: "gradient", value: buildGradientCSS() });
    } else if (type === "color") {
      onChange({ type: "color", value: "#ff8800" });
    } else if (type === "image") {
      onChange({ type: "image", value: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1200" });
    }
  };

  return (
    <div className="background-picker">
      <button
        ref={triggerRef}
        className="bp-trigger"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpenMenu())}
        title="Configure background"
      >
        Background
      </button>

      {isOpen && menuPos && ReactDOM.createPortal(
        <div className="bp-menu" style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}>
          <div className="bp-type-selector">
            <button
              className={`bp-type-btn ${bgType === "color" ? "active" : ""}`}
              onClick={() => handleTypeChange("color")}
            >
              Color
            </button>
            <button
              className={`bp-type-btn ${bgType === "gradient" ? "active" : ""}`}
              onClick={() => handleTypeChange("gradient")}
            >
              Gradient
            </button>
            <button
              className={`bp-type-btn ${bgType === "image" ? "active" : ""}`}
              onClick={() => handleTypeChange("image")}
            >
              Image
            </button>
          </div>

          <div className="bp-input-area">
            {bgType === "color" && (
              <div className="bp-input-group">
                <label>Color:</label>
                <input
                  type="color"
                  value={bgValue}
                  onChange={(e) => onChange({ type: "color", value: e.target.value })}
                  className="bp-color-input"
                />
                <input
                  type="text"
                  value={bgValue}
                  onChange={(e) => onChange({ type: "color", value: e.target.value })}
                  placeholder="#000000"
                  className="bp-text-input"
                />
              </div>
            )}

            {bgType === "gradient" && (
              <div className="bp-input-group">
                <label>Gradient Direction:</label>
                <div className="bp-angle-slider">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientAngle}
                    onChange={(e) => {
                      const angle = Number(e.target.value);
                      setGradientAngle(angle);
                      onChange({ type: "gradient", value: `linear-gradient(${angle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)` });
                    }}
                    className="bp-slider"
                  />
                  <span className="bp-angle-value">{gradientAngle}°</span>
                </div>

                <label>Color 1:</label>
                <input
                  type="color"
                  value={gradientColor1}
                  onChange={(e) => {
                    setGradientColor1(e.target.value);
                  }}
                  onBlur={buildAndSendGradient}
                  className="bp-color-input"
                />

                <label>Color 2:</label>
                <input
                  type="color"
                  value={gradientColor2}
                  onChange={(e) => {
                    setGradientColor2(e.target.value);
                  }}
                  onBlur={buildAndSendGradient}
                  className="bp-color-input"
                />
              </div>
            )}

            {bgType === "image" && (
              <div className="bp-input-group">
                <label>Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bp-file-input"
                />
                <div className="bp-help-text">
                  Or paste an image URL below
                </div>
                <input
                  type="text"
                  value={bgValue}
                  onChange={(e) => onChange({ type: "image", value: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="bp-text-input"
                />
              </div>
            )}

            <div className="bp-preview" style={{ background: bgValue }}>
              Preview
            </div>
          </div>

          <button
            className="bp-close"
            onClick={() => setIsOpen(false)}
          >
            Done
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
