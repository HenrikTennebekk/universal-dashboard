import { useEffect, useMemo, useState } from "react";

export type ClockVariant = "digital" | "analog";

export type ClockTileProps = {
  /** "auto" uses the browser's detected IANA timezone */
  timeZone?: string;
  /** digital | analog */
  variant?: ClockVariant;
  /** true = 24h, false = AM/PM */
  use24Hour?: boolean;
};

function getSystemTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function resolveTimeZone(timeZone?: string) {
  if (!timeZone || timeZone === "auto") {
    return getSystemTimeZone();
  }
  
  // Validate the timezone by attempting to use it
  try {
    new Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
    return timeZone;
  } catch {
    // If validation fails, fall back to system timezone
    return getSystemTimeZone();
  }
}

function getTimeZoneOffset(date: Date, timeZone?: string): string {
  if (!timeZone) return "";
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    const parts = formatter.formatToParts(date);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value;
    return offset ? `(${offset})` : "";
  } catch {
    return "";
  }
}

export function ClockTile({
  timeZone = "auto",
  variant = "digital",
  use24Hour = true,
}: ClockTileProps) {
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = useMemo(() => {
    try {
      setError(null);
      return resolveTimeZone(timeZone);
    } catch (e) {
      setError("Invalid timezone");
      return getSystemTimeZone();
    }
  }, [timeZone]);

  const tzOffset = useMemo(() => getTimeZoneOffset(now, tz), [now, tz]);
  const tzLabel = useMemo(() => {
    if (!tz) return "Local Time";
    if (timeZone === "auto") return `${tz} (auto-detected)`;
    return tz;
  }, [tz, timeZone]);

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
      {error && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(255, 100, 100, 0.2)",
            color: "#ff6464",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.75rem",
          }}
          title="Invalid timezone, using system timezone"
        >
          ⚠️ Invalid TZ
        </div>
      )}

      {(variant === "analog") && (
        <svg
          className="clock-analog"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Analog clock"
          role="img"
        >
          <circle className="clock-face" cx="50" cy="50" r="48" />

          {/* Hour marks and numbers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const x1 = 50 + Math.sin(a) * 40;
            const y1 = 50 - Math.cos(a) * 40;
            const x2 = 50 + Math.sin(a) * 46;
            const y2 = 50 - Math.cos(a) * 46;
            
            // Hour numbers
            const numX = 50 + Math.sin(a) * 34;
            const numY = 50 - Math.cos(a) * 34;
            const hour = i === 0 ? 12 : i;

            return (
              <g key={i}>
                <line
                  className="clock-mark"
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                />
                <text
                  x={numX}
                  y={numY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="6"
                  fill="currentColor"
                  opacity="0.7"
                >
                  {hour}
                </text>
              </g>
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

      {(variant === "digital") && (
        <div
          className="clock-digital"
          aria-label="Digital clock"
        >
          {timeText}
        </div>
      )}

      {/* Timezone label and offset */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "0.85rem",
          opacity: 0.75,
          textAlign: "center",
          minHeight: "1.4em",
        }}
      >
        <div>{tzLabel}</div>
        {tzOffset && <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{tzOffset}</div>}
      </div>
    </div>
  );
}
