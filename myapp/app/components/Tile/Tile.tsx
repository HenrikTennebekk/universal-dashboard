import "./Tile.css";
import type { ReactNode } from "react";

type TileProps = {
  title: string;
  children: ReactNode;
};

export function Tile({ title, children }: TileProps) {
  return (
    <div className="tile">
      <h2 className="tile-header">{title}</h2>
      <div className="tile-content">{children}</div>
    </div>
  );
}
