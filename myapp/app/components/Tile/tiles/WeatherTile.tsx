export type WeatherTileProps = {
  city: string;
};

export function WeatherTile({ city }: WeatherTileProps) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem" }}>{city}</div>
      <div style={{ fontSize: "3rem" }}>🌤️</div>
      <div>12°C</div>
    </div>
  );
}
