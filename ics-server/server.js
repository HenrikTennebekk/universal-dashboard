// server.js (Node 18+ med innebygd fetch)
// Endepunkt:
//   GET /events/:range?url=<ics-url>
//     range: today | week | month
// Returnerer events i perioden (inkl. gjentakelser)

const express = require("express");
const cors = require("cors");
const ICAL = require("ical.js");
const { DateTime } = require("luxon");

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

const ZONE = "Europe/Oslo";

/* -------------------- Helpers -------------------- */

function isValidHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchIcs(url) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "ics-server/1.0",
      Accept: "text/calendar, text/plain;q=0.9, */*;q=0.8",
    },
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Kunne ikke hente ICS. HTTP ${r.status}. ${body.slice(0, 200)}`);
  }

  return r.text();
}

function getRange(range) {
  const now = DateTime.now().setZone(ZONE);

  if (range === "today") {
    return {
      rangeStart: now,
      rangeEnd: now.endOf("day").plus({ milliseconds: 1 }),
      label: "rest_of_day",
    };
  }

  if (range === "week") {
    return { rangeStart: now, rangeEnd: now.plus({ days: 7 }), label: "next_7_days" };
  }

  if (range === "month") {
    return { rangeStart: now, rangeEnd: now.plus({ months: 1 }), label: "next_month" };
  }

  const err = new Error("Ugyldig range (bruk today | week | month)");
  err.code = 400;
  throw err;
}

function overlapsRange(eventStart, eventEnd, rangeStart, rangeEnd) {
  const s = eventStart.toMillis();
  const e = eventEnd.toMillis();
  const rs = rangeStart.toMillis();
  const re = rangeEnd.toMillis();
  return s < re && e > rs;
}

/**
 * Ekspander .ics til events innenfor intervallet.
 * - Støtter RRULE/RDATE + EXDATE/overrides via getOccurrenceDetails
 * - Sorterer på start (UTC ISO)
 */
function expandIcsToEventsInRange(icsText, rangeStart, rangeEnd) {
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  /** @type {Array<any>} */
  const out = [];

  const windowStartUtc = rangeStart.toUTC();
  const windowEndUtc = rangeEnd.toUTC();

  const windowStartIcal = ICAL.Time.fromJSDate(windowStartUtc.toJSDate(), true);
  const windowEndIcal = ICAL.Time.fromJSDate(windowEndUtc.toJSDate(), true);

  function toUtcIso(icalTime) {
    return DateTime.fromJSDate(icalTime.toJSDate()).toUTC().toISO();
  }

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    if (!event.startDate) continue;

    const hasRecurrence =
      !!vevent.getFirstProperty("rrule") || vevent.getAllProperties("rdate").length > 0;

    // ---------- Ikke-gjentakende ----------
    if (!hasRecurrence) {
      const startIso = toUtcIso(event.startDate);

      let endIcal = event.endDate;
      if (!endIcal && event.duration) {
        endIcal = event.startDate.clone();
        endIcal.addDuration(event.duration);
      }
      if (!endIcal) endIcal = event.startDate;

      const endIso = toUtcIso(endIcal);

      const startInZone = DateTime.fromISO(startIso, { zone: "utc" }).setZone(ZONE);
      const endInZone = DateTime.fromISO(endIso, { zone: "utc" }).setZone(ZONE);

      if (overlapsRange(startInZone, endInZone, rangeStart, rangeEnd)) {
        out.push({
          uid: event.uid || null,
          occurrenceId: null,
          summary: event.summary ?? null,
          description: event.description ?? null,
          location: event.location ?? null,
          start: startIso,
          end: endIso,
          allDay: event.startDate.isDate ?? false,
          status: event.status ?? null,
          url: event.url ?? null,
        });
      }

      continue;
    }

    // ---------- Gjentakende ----------
    const iter = event.iterator();

    const MAX_OCCURRENCES = 5000;
    let count = 0;

    // Fast-forward til windowStart
    let next = iter.next();
    while (next && next.compare(windowStartIcal) < 0 && count < MAX_OCCURRENCES) {
      next = iter.next();
      count += 1;
    }

    // Forekomster innenfor vindu
    while (next && count < MAX_OCCURRENCES) {
      if (next.compare(windowEndIcal) >= 0) break;

      const details = event.getOccurrenceDetails(next);
      if (details && details.startDate && details.endDate) {
        const startIso = toUtcIso(details.startDate);
        const endIso = toUtcIso(details.endDate);

        const startInZone = DateTime.fromISO(startIso, { zone: "utc" }).setZone(ZONE);
        const endInZone = DateTime.fromISO(endIso, { zone: "utc" }).setZone(ZONE);

        if (overlapsRange(startInZone, endInZone, rangeStart, rangeEnd)) {
          const occurrenceEvent = details.item ?? event;

          out.push({
            uid: occurrenceEvent.uid || event.uid || null,
            occurrenceId: details.recurrenceId ? details.recurrenceId.toString() : null,
            summary: occurrenceEvent.summary ?? null,
            description: occurrenceEvent.description ?? null,
            location: occurrenceEvent.location ?? null,
            start: startIso,
            end: endIso,
            allDay: details.startDate.isDate ?? false,
            status: occurrenceEvent.status ?? null,
            url: occurrenceEvent.url ?? null,
          });
        }
      }

      next = iter.next();
      count += 1;
    }
  }

  out.sort((a, b) => {
    const as = DateTime.fromISO(a.start, { zone: "utc" }).toMillis();
    const bs = DateTime.fromISO(b.start, { zone: "utc" }).toMillis();
    return as - bs;
  });

  return out;
}

/* -------------------- Route -------------------- */

app.get("/events/:range", async (req, res) => {
  try {
    const range = String(req.params.range || "").toLowerCase(); // today|week|month
    const url = String(req.query.url || "").trim();

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ error: "Ugyldig eller manglende url" });
    }

    const { rangeStart, rangeEnd, label } = getRange(range);

    const icsText = await fetchIcs(url);
    const events = expandIcsToEventsInRange(icsText, rangeStart, rangeEnd);

    res.json({
      source: url,
      zone: ZONE,
      range: { type: label, start: rangeStart.toISO(), end: rangeEnd.toISO() },
      count: events.length,
      events,
    });
  } catch (e) {
    res.status(e.code || 500).json({ error: "Serverfeil", details: String(e.message || e) });
  }
});

const port = 3000;
app.listen(port, () => console.log(`ICS server kjører på http://localhost:${port}`));
