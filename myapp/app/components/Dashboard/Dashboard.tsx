import { Tile } from "../Tile/Tile"; // assume named export
import "./Dashboard.css";
import { tileRegistry } from "../../tiles/registry";
import type { AnyTileConfig, TilePropsMap } from "../../tiles/registry";

type DashboardProps = {
  tiles: AnyTileConfig[];
};

export function Dashboard({ tiles }: DashboardProps) {
  return (
    <div className="dashboard">
      {tiles.map((tile) => {
        // TypeScript now knows this component only accepts the correct props
        const TileComponent = tileRegistry[tile.type]
          .component as React.ComponentType<TilePropsMap[typeof tile.type]>;

        return (
          <div className="dashboard-tile" key={tile.id}>
            <Tile title={tile.title}>
              <TileComponent {...(tile.props as TilePropsMap[typeof tile.type])} />
            </Tile>
          </div>
        );
      })}
    </div>
  );
}
