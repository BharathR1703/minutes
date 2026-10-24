"use client";

import { bookMeeting, loadDemoStore, SCRIPTS, type ScriptId, type Attendee, type DemoSpec } from "@/lib/demo";
import { armRealEvent, clearGCal, connectHref, insertEvent, listUpcoming, loadGCal, type GcalEvent, type GcalTokens } from "@/lib/gcal";
import type { Upcoming } from "@/lib/model";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Book a call in the app itself: it lands in the armed list like a seeded call. */
export default function BookPage() {
  const router = useRouter();
  const [script, setScript] = useState<ScriptId | "blank">("blank");
  const [title, setTitle] = useState("Discovery — a new demo call");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("14:30");
  const [platform, setPlatform] = useState<Upcoming["platform"]>("Google Meet");
  const [captureMode, setCaptureMode] = useState<Upcoming["captureMode"]>("bot");
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "Alex Rivera", email: "alex@example.com" },
  ]);
  const [ready, setReady] = useState(false);
  const [gcalMsg, setGcalMsg] = useState<string | null>(null);
  const [gcalState, setGcalState] = useState<"checking" | "off" | "on">("checking");
  const [gcalEmail, setGcalEmail] = useState<string | null>(null);
  const [realEvents, setRealEvents] = useState<GcalEvent[] | null>(null);
  const [realError, setRealError] = useState<string | null>(null);
  const [realBusy, setRealBusy] = useState(false);

  // the booking lives in this browser's storage only — say so next to the button
  useEffect(() => setReady(true), []);

  // real Google Calendar connection (tokens stored by the OAuth callback page)
  useEffect(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const gcal = q?.get("gcal");
    if (gcal === "denied") setGcalMsg("Google sign-in was declined — Minutes can't reach your calendar without it.");
    else if (gcal === "connected") setGcalMsg("Google Calendar connected — your real events are below.");
    else if (gcal === "notconfigured")
      setGcalMsg("The Google integration isn't configured on this deployment yet (missing OAuth client credentials).");
    else if (gcal === "exchange_failed" || gcal === "no_refresh")
      setGcalMsg("Google didn't grant a long-lived token — try connecting again (sign out and reconnect).");
    if (gcal) window.history.replaceState(null, "", "/book");

    const tokens = loadGCal();
    if (tokens) {
      setGcalState("on");
      setGcalEmail(tokens.email ?? null);
      listUpcoming()
        .then(setRealEvents)
        .catch((e: Error) => {
          if (e.message === "not_connected") setGcalState("off");
          else setRealError("Couldn't list your real calendar events — check the connection and try again.");
        });
    } else {
      setGcalState("off");
    }
  }, []);
  const existing = ready ? loadDemoStore() : { events: [], meetings: [] };
  const booked = existing.events.length + existing.meetings.length;

  const platforms: Upcoming["platform"][] = ["Zoom", "Google Meet", "Microsoft Teams", "In person"];

  function setAt(i: number, patch: Partial<Attendee>) {
    setAttendees((list) => list.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  }

  function cleanAttendees(): Attendee[] {
    return attendees
      .map((a) => ({ name: a.name.trim(), email: a.email?.trim() || undefined }))
      .filter((a) => a.name);
  }

  function book() {
    const clean = cleanAttendees();
    const startedAt = new Date(`${date}T${time}:00`);
    if (!(Number.isFinite(+startedAt) && title.trim()) || clean.length === 0) return;
    const ev = bookMeeting({
      script,
      title: title.trim(),
      platform,
      startedAt: startedAt.toISOString(),
      captureMode,
      attendees: clean,
    });
    router.push(`/live/${ev.id}`);
  }

  // create a REAL event on the real calendar, with a real Meet link; Google
  // emails the attendees (sendUpdates=all); then arm capture for it
  async function bookReal() {
    const clean = cleanAttendees();
    const startedAt = new Date(`${date}T${time}:00`);
    if (!(Number.isFinite(+startedAt) && title.trim()) || clean.length === 0) return;
    setRealBusy(true);
    setRealError(null);
    try {
      const gEv = await insertEvent({
        title: title.trim(),
        startedAt: startedAt.toISOString(),
        attendees: clean.flatMap((a) => (a.email ? [{ name: a.name, email: a.email }] : [])),
        description: "Booked through Minutes — Minutes will capture this call.",
      });
      const ev = bookMeeting({
        script,
        title: title.trim(),
        platform,
        startedAt: startedAt.toISOString(),
        captureMode: "bot-free",
        attendees: clean,
        meetLink: gEv.meetLink,
      });
      if (gEv.meetLink) armRealEvent(gEv.id, ev.id);
      router.push(`/live/real-${gEv.id}`);
    } catch (e) {
      setRealError(
        (e as Error).message === "not_connected"
          ? "Connection expired — reconnect to Google Calendar."
          : "Google rejected the event — check title/time/attendees and try again.",
      );
      if ((e as Error).message === "not_connected") setGcalState("off");
    } finally {
      setRealBusy(false);
    }
  }

  // arm capture for one of the user's REAL upcoming events (existing Meet link)
  function armReal(gEv: GcalEvent) {
    const who =
      gEv.attendees.length > 0
        ? gEv.attendees.map((a) => ({ name: a.name || a.email.split("@")[0], email: a.email }))
        : [{ name: "Guest (from the call)" }];
    const ev = bookMeeting({
      script: "blank",
      title: gEv.title,
      platform: "Google Meet",
      startedAt: gEv.start,
      captureMode: "bot-free",
      attendees: who,
      meetLink: gEv.meetLink,
    } satisfies DemoSpec);
    armRealEvent(gEv.id, ev.id);
    router.push(`/live/real-${gEv.id}`);
  }

  const label = "block text-[12.5px] font-medium mb-1.5";
  const input =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-ink-soft";

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <p className="eyebrow mb-2">Book a call</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
        Put a meeting on the calendar
      </h1>
      <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-ink-soft">
        {booked > 0 && ready ? (
          <>
            You already have {booked} booked call{booked === 1 ? "" : "s"} in this browser — they
            sit in the armed list on your meetings page. Book another; Minutes arms for it like
            any other call.
          </>
        ) : (
          "Minutes reads your calendar and arms the notetaker. This build can't reach a real calendar, so book a call here and Minutes arms for it like any other."
        )}
      </p>

      {gcalMsg && (
        <p className="mt-3 rounded-lg border border-line bg-line-soft/60 px-4 py-2 text-[13px] text-ink-soft">
          {gcalMsg}
        </p>
      )}

      {/* ── real Google Calendar ─────────────────────────────────────── */}
      <div className="pane mt-6 p-5">
        {gcalState === "checking" ? (
          <p className="text-[13px] text-ink-faint">Checking your Google Calendar connection…</p>
        ) : gcalState === "off" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="max-w-md">
                <p className="text-[14px] font-medium">Real Google Calendar</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  Sign in with Google — Minutes lists your real upcoming meetings, arms capture on
                  any of them, and books new events with real Google Meet links (Google emails the
                  invites).
                </p>
              </div>
              <a
                href={connectHref()}
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
              >
                Connect Google Calendar
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">
                  Real Google Calendar connected{gcalEmail ? ` — ${gcalEmail}` : ""}
                </p>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Your real upcoming meetings are below; arm capture on any of them, or book below
                  for real.
                </p>
              </div>
              <button
                onClick={() => {
                  clearGCal();
                  setGcalState("off");
                  setRealEvents(null);
                }}
                className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft hover:border-record hover:text-record"
              >
                Disconnect
              </button>
            </div>
            {realError && (
              <p className="mt-3 rounded-lg border border-line bg-line-soft/60 px-4 py-2 text-[13px] text-ink-soft">
                {realError}
              </p>
            )}
            {realEvents === null && !realError && (
              <p className="mt-3 text-[13px] text-ink-faint">Loading your real events…</p>
            )}
            {realEvents && realEvents.length === 0 && (
              <p className="mt-3 text-[13px] text-ink-faint">
                No upcoming events on your calendar — book one below for real.
              </p>
            )}
            {realEvents && realEvents.length > 0 && (
              <ul className="mt-3 divide-y divide-line-soft">
                {realEvents.map((gEv) => (
                  <li key={gEv.id} className="-mx-1 flex items-center gap-3 px-1 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{gEv.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-soft">
                        {new Date(gEv.start).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {gEv.attendees.length > 0 && ` · ${gEv.attendees.length} others`}{" "}
                        {gEv.meetLink ? "· Meet link ✓" : "· no Meet link"}
                      </p>
                    </div>
                    <button
                      onClick={() => armReal(gEv)}
                      className="shrink-0 rounded-full border border-line bg-raised px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
                      title="Arm Minutes on this real event — capture the Meet call from its tab in this browser"
                    >
                      Arm Minutes
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[12px] text-ink-faint">
              Reading and creating only in the token&rsquo;s scope (events + email address);
              nothing is emailed unless Google sends invites for a booked event.
            </p>
          </>
        )}
      </div>

      <div className="pane mt-6 space-y-5 p-5">
        {/* meeting shape */}
        <div>
          <span className={label}>What kind of call is it?</span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Meeting type">
            <button
              onClick={() => setScript("blank")}
              aria-pressed={script === "blank"}
              className={
                "rounded-full px-3 py-1.5 text-[13px] font-medium " +
                (script === "blank"
                  ? "bg-ink text-paper"
                  : "border border-line bg-raised text-ink-soft hover:text-ink")
              }
              title="Your own meeting — feed the scribe what's said live"
            >
              Your own call
            </button>
            {SCRIPTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setScript(s.id)}
                aria-pressed={script === s.id}
                className={
                  "rounded-full px-3 py-1.5 text-[13px] font-medium " +
                  (script === s.id
                    ? "bg-ink text-paper"
                    : "border border-line bg-raised text-ink-soft hover:text-ink")
                }
                title={s.blurb}
              >
                {s.name}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-ink-faint">
            {script === "blank"
              ? "Your own meeting: during the live capture you feed what's said — type or paste it as it happens — and Minutes writes the summary, action items, highlights and clips from your words, every line cited to the moment."
              : `The type decides what the capture produces — the walkthrough script Minutes will
              summarize: ${SCRIPTS.find((s) => s.id === script)?.blurb}.`}
          </p>
        </div>

        {/* title */}
        <div>
          <label className={label} htmlFor="b-title">Title</label>
          <input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
        </div>

        {/* when + platform */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={label} htmlFor="b-date">Date</label>
            <input id="b-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="b-time">Time</label>
            <input id="b-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="b-platform">Where</label>
            <select
              id="b-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Upcoming["platform"])}
              className={input + " font-medium"}
            >
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>Capture</span>
            <div className="flex gap-1.5">
              {(["bot", "bot-free"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCaptureMode(m)}
                  aria-pressed={captureMode === m}
                  className={
                    "flex-1 rounded-lg px-2 py-2 text-[12px] font-medium " +
                    (captureMode === m
                      ? "bg-ink text-paper"
                      : "border border-line bg-raised text-ink-soft hover:text-ink")
                  }
                >
                  {m === "bot" ? "bot joins" : "bot-free"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* attendees with emails */}
        <div>
          <span className={label}>Who else is on the call?</span>
          <ul className="space-y-1.5">
            {attendees.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  value={a.name}
                  onChange={(e) => setAt(i, { name: e.target.value })}
                  placeholder="Name"
                  aria-label={`Attendee ${i + 1} name`}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-ink-soft"
                />
                <input
                  value={a.email ?? ""}
                  onChange={(e) => setAt(i, { email: e.target.value })}
                  placeholder="email@company.com"
                  type="email"
                  aria-label={`Attendee ${i + 1} email`}
                  className="min-w-0 flex-[1.4] rounded-lg border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-ink-soft"
                />
                {attendees.length > 1 && (
                  <button
                    onClick={() => setAttendees((l) => l.filter((_, j) => j !== i))}
                    aria-label={`Remove attendee ${a.name || i + 1}`}
                    className="shrink-0 rounded-full border border-line px-2 py-1 text-[12px] text-ink-faint hover:border-record hover:text-record"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setAttendees((l) => [...l, { name: "", email: "" }])}
            className="mt-2 text-[12.5px] text-record underline underline-offset-2 hover:text-ink"
          >
            + Add an attendee
          </button>
          <p className="mt-1.5 text-[12px] text-ink-faint">
            Names lead the call (the first gets the most lines in scripted calls). Emails go on
            the .ics invite you can add to your real calendar and into the follow-up draft —
            nothing is emailed in this build.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line-soft pt-4">
          <p className="text-[12px] text-ink-faint max-w-[55%]">
            {gcalState === "on"
              ? "“Book for real” creates the event on your actual calendar with a Google Meet link; Google emails the invitations."
              : "Booked calls live in this browser only (no database in this build) — they survive a reload, and only you can see them."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {gcalState === "on" && (
              <button
                onClick={bookReal}
                disabled={realBusy || !title.trim() || attendees.every((a) => !a.name.trim())}
                className="rounded-full bg-record px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
                title="Create the real event on your Google Calendar with a Google Meet link, then arm capture on it"
              >
                {realBusy ? "Booking for real…" : "Book for real (Google Calendar)"}
              </button>
            )}
            <button
              onClick={book}
              disabled={!title.trim() || attendees.every((a) => !a.name.trim())}
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
              title="Book in this browser only — the capture runs as a simulation, no calendar event is created"
            >
              Book &amp; arm the capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}