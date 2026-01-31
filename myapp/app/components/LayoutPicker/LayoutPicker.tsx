import React, { useState, type JSX } from "react";
import "./LayoutPicker.css";

export type PresetMeta = {
  columns?: number;
  capacity?: number; // how many tile slots this preset exposes
};

type Preset = { id: string; label: string; render: () => JSX.Element; meta?: PresetMeta };

export const presets: Preset[] = [
  { id: "preset-single", label: "Single", meta: { capacity: 1, columns: 1 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="88" height="88" rx="4" />
    </svg>
  ) },

  { id: "preset-columns-two", label: "Columns (2)", meta: { capacity: 2, columns: 2 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="42" height="88" rx="3" />
      <rect x="52" y="6" width="42" height="88" rx="3" />
    </svg>
  ) },

  { id: "preset-columns-three", label: "Columns (3)", meta: { capacity: 3, columns: 3 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="28" height="88" rx="3" />
      <rect x="36" y="6" width="28" height="88" rx="3" />
      <rect x="66" y="6" width="28" height="88" rx="3" />
    </svg>
  ) },

  { id: "preset-grid-four", label: "Grid (4)", meta: { capacity: 4, columns: 2 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="42" height="42" rx="3" />
      <rect x="52" y="6" width="42" height="42" rx="3" />
      <rect x="6" y="52" width="42" height="42" rx="3" />
      <rect x="52" y="52" width="42" height="42" rx="3" />
    </svg>
  ) },

  { id: "preset-stack-two", label: "Stack (2)", meta: { capacity: 2 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="88" height="44" rx="3" />
      <rect x="6" y="50" width="88" height="44" rx="3" />
    </svg>
  ) },

  { id: "preset-stack-three", label: "Stack (3)", meta: { capacity: 3, columns: 1 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="88" height="24" rx="3" />
      <rect x="6" y="38" width="88" height="24" rx="3" />
      <rect x="6" y="70" width="88" height="24" rx="3" />
    </svg>
  ) },

  { id: "preset-focus-three", label: "Focus (3)", meta: { capacity: 3 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="88" height="58" rx="3" />
      <rect x="6" y="66" width="42" height="28" rx="3" />
      <rect x="52" y="66" width="42" height="28" rx="3" />
    </svg>
  ) },

  { id: "preset-focus-four", label: "Focus (4)", meta: { capacity: 4, columns: 3 }, render: () => (
    <svg viewBox="0 0 100 100" className="lp-thumb" aria-hidden>
      <rect x="6" y="6" width="58" height="58" rx="3" />
      <rect x="66" y="6" width="28" height="88" rx="3" />
      <rect x="6" y="66" width="28" height="28" rx="3" />
      <rect x="36" y="66" width="28" height="28" rx="3" />

    </svg>
  ) },

];

export function LayoutPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  function selectPreset(p: Preset) {
    onChange(p.id);
  }

  return (
    <div className="layout-picker">
      {presets.map((p) => (
        <div key={p.id} style={{ position: "relative" }}>
          <button
            className={["lp-item", value === p.id ? "selected" : ""].join(" ")}
            onClick={() => selectPreset(p)}
            title={p.label}
            aria-pressed={value === p.id}
          >
            <div className="lp-thumb-wrap">{p.render()}</div>
            <div className="lp-label">{p.label}</div>
          </button>
        </div>
      ))}
    </div>
  );
}

export default LayoutPicker;
