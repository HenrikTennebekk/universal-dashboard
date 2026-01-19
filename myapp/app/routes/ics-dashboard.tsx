import { useEffect, useMemo, useState } from "react";

type Range = "today" | "week" | "month";

type CalendarEvent = {
  uid: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  start: string; // ISO
  end: string | null; // ISO
  allDay: boolean;
  status: string | null;
  url: string | null;
};

type EventsResponse = {
  source: string;
  zone: string;
  range: { type: string; start: string; end: string };
  count: number;
  events: CalendarEvent[];
};

const API_BASE = "";

const STORAGE_KEY = "icsUrl";

function formatWhen(startIso: string, endIso: string | null, allDay: boolean) {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;

  if (allDay) return `${start.toLocaleDateString()} (hele dagen)`;
  const startStr = start.toLocaleString();
  return end ? `${startStr} – ${end.toLocaleString()}` : startStr;
}

function getStoredIcsUrlSafe(): string {
  // SSR-safe
  if (typeof window === "undefined") return "";
  try {
    const ls = window.localStorage;
    if (!ls || typeof ls.getItem !== "function") return "";
    return ls.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setStoredIcsUrlSafe(value: string) {
  if (typeof window === "undefined") return;
  try {
    const ls = window.localStorage;
    if (!ls || typeof ls.setItem !== "function") return;
    ls.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export default function IcsDashboard() {
  // Start med tom streng slik at SSR aldri toucher localStorage
  const [icsUrl, setIcsUrl] = useState<string>("");
  const [range, setRange] = useState<Range>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Etter mount (kun i browser) les fra localStorage
  useEffect(() => {
    setIcsUrl(getStoredIcsUrlSafe());
  }, []);

  const requestUrl = useMemo(() => {
    if (!icsUrl) return null;

    // Bygger korrekt URL både med proxy og med API_BASE
    const baseOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(`${API_BASE}/events/${range}`, baseOrigin);
    url.searchParams.set("url", icsUrl);
    return url.toString();
  }, [icsUrl, range]);

  async function loadEvents() {
    if (!requestUrl) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(requestUrl);
      const data = (await res.json()) as EventsResponse;

      if (!res.ok) {
        const maybeErr = data as unknown as { error?: string; details?: string };
        throw new Error(maybeErr.details ?? maybeErr.error ?? "Kunne ikke hente events");
      }

      setEvents(data.events ?? []);
    } catch (err) {
      setEvents([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Last ved endringer + auto refresh hvert 60s (kun når vi faktisk har URL)
  useEffect(() => {
    if (!requestUrl) return;

    loadEvents();
    const id = window.setInterval(loadEvents, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestUrl]);

  function saveUrl() {
    setStoredIcsUrlSafe(icsUrl);
    loadEvents();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">ICS dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lim inn en <span className="font-medium">.ics</span>-lenke for å hente events automatisk.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="icsUrl">
            ICS URL
          </label>

          <input
            id="icsUrl"
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
            placeholder="https://.../calendar.ics"
            className="w-full flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveUrl}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-950"
            >
              Lagre
            </button>

            <button
              type="button"
              onClick={loadEvents}
              disabled={!icsUrl}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Oppdater
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Vis:</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="today">Resten av dagen</option>
              <option value="week">1 uke</option>
              <option value="month">1 måned</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {loading && <span className="text-sm text-gray-600">Henter…</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
            {!loading && !error && icsUrl && (
              <span className="text-xs text-gray-500">Auto-oppdaterer hvert 60. sekund</span>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-gray-900">Events</h2>
          <span className="text-sm text-gray-500">{events.length} stk</span>
        </div>

        {(!icsUrl || events.length === 0) && !loading && !error ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
            {!icsUrl ? "Legg inn en .ics-lenke og trykk Lagre." : "Ingen events i denne perioden."}
          </div>
        ) : null}

        <ul className="grid gap-3">
          {events.map((ev) => (
            <li key={ev.uid ?? ev.start} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{ev.summary || "(Uten tittel)"}</div>

                  <div className="mt-1 text-sm text-gray-600">
                    {formatWhen(ev.start, ev.end, ev.allDay)}
                  </div>

                  {ev.location && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        Sted
                      </span>
                      {ev.location}
                    </div>
                  )}

                  {ev.description && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        Beskrivelse
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{ev.description}</p>
                    </details>
                  )}
                </div>

                {ev.url && (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-fit items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 sm:mt-0"
                  >
                    Åpne
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
