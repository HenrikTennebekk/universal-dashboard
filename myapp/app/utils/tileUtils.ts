import type { AnyTileConfig } from "../tiles/registry";
import { tileRegistry } from "../tiles/registry";

export type TileType = keyof typeof tileRegistry;

/**
 * Creates a new tile with default props based on type
 */
export function createTile(type: TileType): AnyTileConfig {
  const defaultProps: Record<TileType, any> = {
    clock: { timeZone: "auto" },
    link: { url: "https://example.com" },
    weather: { city: "" },
    image: { images: [], intervalSeconds: 6 },
  };

  return {
    id: `${type}-${Date.now()}`,
    type,
    props: defaultProps[type],
    appearance: {
      backgroundColor: "#111111",
      opacity: 1,
    },
  };
}

/**
 * Calculates the maximum number of tiles a layout can hold
 */
export function layoutCapacity(layout?: string, presets?: Array<{ id: string; meta?: { capacity?: number } }>): number {
  if (!layout) return Infinity;

  // Check if layout is in presets
  if (presets) {
    const p = presets.find((x) => x.id === layout);
    if (p?.meta?.capacity !== undefined) return p.meta.capacity;
  }

  // Fallback for built-in layouts
  switch (layout) {
    case "focus":
      return 3;
    default:
      return Infinity;
  }
}
