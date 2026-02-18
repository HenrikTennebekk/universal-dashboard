import { ClockTile } from "../components/Tile/tiles/ClockTile";
import type { ClockTileProps } from "../components/Tile/tiles/ClockTile";

import { LinkTile } from "../components/Tile/tiles/LinkTile";
import type { LinkTileProps } from "../components/Tile/tiles/LinkTile";

import { WeatherTile } from "../components/Tile/tiles/WeatherTile";
import type { WeatherTileProps } from "../components/Tile/tiles/WeatherTile";

import { ImageTile } from "../components/Tile/tiles/ImageTile";
import type { ImageTileProps } from "../components/Tile/tiles/ImageTile";

export const tileRegistry = {
  clock: { component: ClockTile },
  link: { component: LinkTile },
  weather: { component: WeatherTile },
  image: { component: ImageTile },
} as const;

export type TileType = keyof typeof tileRegistry;

export type TilePropsMap = {
  clock: ClockTileProps;
  link: LinkTileProps;
  weather: WeatherTileProps;
  image: ImageTileProps;
};

// ✅ This must be exported!
export type AnyTileConfig = {
  [K in TileType]: {
    id: string;
    title: string;
    type: K;
    props: TilePropsMap[K];
    // Optional layout span (how many columns / rows this tile should occupy)
    layoutSpan?: { w?: number; h?: number };
  };
}[TileType];
