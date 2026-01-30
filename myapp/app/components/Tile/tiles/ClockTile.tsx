import { useEffect, useState } from "react";

export type ClockTileProps = {
  timeZone: string; // e.g. "Europe/Oslo"
};

export function ClockTile({ timeZone }: ClockTileProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  return (
    <div style={{ fontSize: "3rem", textAlign: "center" }}>
      {time}
    </div>
  );
}
