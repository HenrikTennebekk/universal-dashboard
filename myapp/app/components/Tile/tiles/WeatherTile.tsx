import { useEffect, useState } from "react";

export type WeatherTileProps = {
  city: string;
};

function weatherCodeToEmoji(code: number) {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 86) return "🌧️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

export function WeatherTile({ city }: WeatherTileProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [emoji, setEmoji] = useState<string>("🌤️");
  const [locationLabel, setLocationLabel] = useState<string>(city);

  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
          )}&count=1`,
          { signal: controller.signal }
        );
        if (!geoRes.ok) throw new Error("Failed to geocode location");
        const geo = await geoRes.json();
        if (!geo.results || geo.results.length === 0) throw new Error("Location not found");
        const { latitude, longitude, name, country } = geo.results[0];

        setLocationLabel(`${name}${country ? ", " + country : ""}`);

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
          { signal: controller.signal }
        );
        if (!weatherRes.ok) throw new Error("Failed to fetch weather");
        const weather = await weatherRes.json();
        if (weather.current_weather) {
          setTemperature(weather.current_weather.temperature ?? null);
          setEmoji(weatherCodeToEmoji(weather.current_weather.weathercode ?? 0));
        } else {
          throw new Error("No current weather available");
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError(e.message || "Error fetching weather");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [city]);

  return (
    <div className="weather-tile">
      <div className="weather-location">{locationLabel}</div>
      <div className="weather-emoji">{emoji}</div>
      {loading ? (
        <div className="weather-status">Loading…</div>
      ) : error ? (
        <div className="weather-status weather-status--error">{error}</div>
      ) : (
        <div className="weather-temp">{temperature !== null ? `${Math.round(temperature)}°C` : "—"}</div>
      )}
    </div>
  );
}

