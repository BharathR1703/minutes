/**
 * Real Google Calendar integration (client side):
 * - OAuth tokens land in this browser via /api/auth/google/callback
 *   (the client secret stays on the server; only the access token ever
 *   refreshes through /api/auth/google/refresh)
 * - "Book for real" posts to the Calendar API and returns a real event with
 *   a real Google Meet conference link
 * - Real Google Meet capture happens in the browser (tab audio) — see
 *   RealCapture; this file only reads/writes calendar data.
 *
 * With no database, the tokens live in the signing-in browser only.
 */

export type GcalTokens = {
  access: string;
  refresh: string;
  expiresAt: number; // epoch ms
  email?: string;
};

const KEY = "minutes.gcal";
const ARM_KEY = "minutes.gcal.armed";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadGCal(): GcalTokens | null {
  if (typeof window === "undefined") return null;
  return safeParse<GcalTokens>(localStorage.getItem(KEY));
}

export function saveGCal(tokens: GcalTokens): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tokens));
  } catch {
    /* storage unavailable */
  }
}

export function clearGCal(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(ARM_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function connectHref(): string {
  return "/api/auth/google/start";
}

/** Exchange the refresh token for a fresh access token when needed. */
async function freshTokens(): Promise<GcalTokens | null> {
  const t = loadGCal();
  if (!t) return null;
  if (Date.now() < t.expiresAt - 60_000) return t;
  const res = await fetch("/api/auth/google/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh: t.refresh }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { access: string; expiresAt: number };
  const next = { ...t, access: j.access, expiresAt: j.expiresAt };
  saveGCal(next);
  return next;
}

export type GcalEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end?: string;
  meetLink?: string;
  attendees: { name?: string; email: string }[];
};

/**
 * Reads the user's real primary calendar, soonest-first. Throws on failure —
 * callers show it; a 401/403 clears the stale connection.
 */
export async function listUpcoming(max = 8): Promise<GcalEvent[]> {
  const t = await freshTokens();
  if (!t) {
    clearGCal();
    throw new Error("not_connected");
  }
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(new Date().toISOString())}` +
    `&singleEvents=true&orderBy=startTime&maxResults=${max}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${t.access}` } });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) clearGCal();
    throw new Error("calendar_list_failed");
  }
  type ApiItem = {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    hangoutLink?: string;
    attendees?: { displayName?: string; email?: string; self?: boolean }[];
  };
  const j = (await res.json()) as { items?: ApiItem[] };
  return (j.items ?? [])
    .filter((e) => e.start?.dateTime || e.start?.date)
    .map((e) => ({
      id: e.id,
      title: e.summary || "(untitled event)",
      start: (e.start?.dateTime ?? e.start?.date) as string,
      end: e.end?.dateTime ?? e.end?.date,
      meetLink: e.hangoutLink,
      attendees: (e.attendees ?? [])
        .filter((a) => a.email && !a.self)
        .map((a) => ({ name: a.displayName, email: a.email as string })),
    }));
}

/**
 * Creates a REAL event on the user's real calendar — with a real Google Meet
 * conference link, and (sendUpdates=all) Google emails the attendee invites.
 */
export async function insertEvent(spec: {
  title: string;
  startedAt: string; // ISO
  durationMin?: number;
  attendees: { name?: string; email: string }[];
  description?: string;
}): Promise<GcalEvent & { htmlLink: string }> {
  const t = await freshTokens();
  if (!t) {
    clearGCal();
    throw new Error("not_connected");
  }
  const start = new Date(spec.startedAt);
  const end = new Date(+start + 1000 * 60 * (spec.durationMin ?? 30));
  const body = {
    summary: spec.title,
    description: spec.description,
    start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    attendees: spec.attendees.map((a) => ({ email: a.email, displayName: a.name })),
    conferenceData: {
      createRequest: {
        requestId: `minutes-${Math.random().toString(36).slice(2, 10)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      "?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${t.access}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) clearGCal();
    throw new Error("event_create_failed");
  }
  type ApiEv = { id: string; summary?: string; hangoutLink?: string; htmlLink: string; start: { dateTime?: string } };
  const ev = (await res.json()) as ApiEv;
  return {
    id: ev.id,
    title: ev.summary ?? spec.title,
    start: ev.start?.dateTime ?? spec.startedAt,
    meetLink: ev.hangoutLink,
    htmlLink: ev.htmlLink,
    attendees: spec.attendees,
  };
}

// ── armed real events (event id → the demo booking that captures it) ───────

export function armRealEvent(eventId: string, demoId: string): void {
  try {
    const map = safeParse<Record<string, string>>(localStorage.getItem(ARM_KEY)) ?? {};
    map[eventId] = demoId;
    localStorage.setItem(ARM_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}

export function demoIdForRealEvent(eventId: string): string | null {
  if (typeof window === "undefined") return null;
  const map = safeParse<Record<string, string>>(localStorage.getItem(ARM_KEY));
  return map?.[eventId] ?? null;
}