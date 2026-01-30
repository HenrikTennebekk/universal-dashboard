import { useEffect, useState } from "react";

export type ClockTileProps = {
  timeZone?: string;
};

export function ClockTile({ timeZone }: ClockTileProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();

      let tz: string | undefined = timeZone;
      if (timeZone === "auto") {
        try {
          tz = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
        } catch {
          tz = undefined;
        }
      }

      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };

      if (tz) options.timeZone = tz;

      setTime(now.toLocaleTimeString("en-GB", options));
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
