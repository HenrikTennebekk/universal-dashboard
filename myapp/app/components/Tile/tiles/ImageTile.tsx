import { useEffect, useMemo, useState } from "react";

export type ImageTileProps = {
  images?: string[];
  intervalSeconds?: number;
};

export function ImageTile({ images = [], intervalSeconds = 6 }: ImageTileProps) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [safeImages.length]);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const intervalMs = Math.max(1000, Math.floor(intervalSeconds * 1000));
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeImages.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [safeImages.length, intervalSeconds]);

  if (safeImages.length === 0) {
    return <div className="image-tile__empty">Add images in Edit mode.</div>;
  }

  const src = safeImages[index] ?? safeImages[0];

  return (
    <div className="image-tile" aria-label="Image slideshow">
      <img key={src} src={src} alt="" className="image-tile__img" />
    </div>
  );
}
