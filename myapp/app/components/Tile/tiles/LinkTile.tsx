export type LinkTileProps = {
  url: string;
};

export function LinkTile({ url }: LinkTileProps) {
  return (
    <iframe
      src={url}
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
}

