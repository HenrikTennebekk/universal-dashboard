import { useEffect, useMemo, useState } from "react";

export type ClockVariant = "digital" | "analog" | "both";

export type ClockTileProps = {
  /** "auto" uses the browser's detected IANA timezone */
  timeZone?: string;
  /** digital | analog | both */
  variant?: ClockVariant;
  /** true = 24h, false = AM/PM */
  use24Hour?: boolean;
};

function resolveTimeZone(timeZone?: string) {
  if (!timeZone || timeZone === "auto") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
      return undefined;
    }
  }
  return timeZone;
}

export function ClockTile({
  timeZone = "auto",
  variant = "digital",
  use24Hour = true,
}: ClockTileProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = useMemo(() => resolveTimeZone(timeZone), [timeZone]);

  // Digital formatted string
  const timeText = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !use24Hour,
    };
    if (tz) options.timeZone = tz;

    // Use the user's locale; hour12 controls AM/PM vs 24h.
    return new Intl.DateTimeFormat(undefined, options).format(now);
  }, [now, tz, use24Hour]);

  // Analog angles in the chosen timezone
  const parts = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    if (tz) options.timeZone = tz;

    const p = new Intl.DateTimeFormat("en-GB", options).formatToParts(now);
    const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
    return { h: get("hour"), m: get("minute"), s: get("second") };
  }, [now, tz]);

  const hourAngle = ((parts.h % 12) + parts.m / 60) * 30;
  const minuteAngle = (parts.m + parts.s / 60) * 6;
  const secondAngle = parts.s * 6;

  return (
    <div className="clock-tile">
      {(variant === "analog" || variant === "both") && (
        <svg
          className="clock-analog"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Analog clock"
          role="img"
        >
          <circle className="clock-face" cx="50" cy="50" r="48" />

          {/* Hour marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const x1 = 50 + Math.sin(a) * 40;
            const y1 = 50 - Math.cos(a) * 40;
            const x2 = 50 + Math.sin(a) * 46;
            const y2 = 50 - Math.cos(a) * 46;
            return (
              <line
                key={i}
                className="clock-mark"
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              />
            );
          })}

          <line
            className="hour-hand"
            x1="50"
            y1="50"
            x2="50"
            y2="30"
            transform={`rotate(${hourAngle} 50 50)`}
          />
          <line
            className="minute-hand"
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            transform={`rotate(${minuteAngle} 50 50)`}
          />
          <line
            className="second-hand"
            x1="50"
            y1="54"
            x2="50"
            y2="16"
            transform={`rotate(${secondAngle} 50 50)`}
          />

          <circle className="clock-center" cx="50" cy="50" r="1.8" />
        </svg>
      )}

      {(variant === "digital" || variant === "both") && (
        <div
          className={
            variant === "both"
              ? "clock-digital clock-digital-overlay"
              : "clock-digital"
          }
          aria-label="Digital clock"
        >
          {timeText}
        </div>
      )}
    </div>
  );
}
