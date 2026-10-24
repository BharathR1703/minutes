"use client";

import { bookMeeting, loadDemoStore, SCRIPTS, type ScriptId } from "@/lib/demo";
import type { Upcoming } from "@/lib/model";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Book a call in the app itself: it lands in the armed list like a seeded call. */
export default function BookPage() {
  const router = useRouter();
  const [script, setScript] = useState<ScriptId>("discovery");
  const [title, setTitle] = useState("Discovery — a new demo call");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("14:30");
  const [platform, setPlatform] = useState<Upcoming["platform"]>("Google Meet");
  const [captureMode, setCaptureMode] = useState<Upcoming["captureMode"]>("bot");
  const [attendees, setAttendees] = useState("Alex Rivera, Jordan Cole");
  const [ready, setReady] = useState(false);

  // the booking lives in this browser's storage only — say so next to the button
  useEffect(() => setReady(true), []);
  const existing = ready ? loadDemoStore() : { events: [], meetings: [] };
  const booked = existing.events.length + existing.meetings.length;

  const platforms: Upcoming["platform"][] = ["Zoom", "Google Meet", "Microsoft Teams", "In person"];

  function book() {
    const names = attendees.split(",").map((s) => s.trim()).filter(Boolean);
    const startedAt = new Date(`${date}T${time}:00`);
    if (!(Number.isFinite(+startedAt) && title.trim()) || names.length === 0) return;
    const ev = bookMeeting({
      script,
      title: title.trim(),
      platform,
      startedAt: startedAt.toISOString(),
      captureMode,
      attendees: names,
    });
    router.push(`/live/${ev.id}`);
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

      <div className="pane mt-6 space-y-5 p-5">
        {/* meeting shape */}
        <div>
          <span className={label}>What kind of call is it?</span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Meeting type">
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
            The type decides what the capture produces — the walkthrough script Minutes will
            summarize: {SCRIPTS.find((s) => s.id === script)?.blurb}.
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

        {/* attendees */}
        <div>
          <label className={label} htmlFor="b-att">Who else is on the call?</label>
          <input
            id="b-att"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            className={input}
            placeholder="Comma-separated names"
          />
          <p className="mt-1.5 text-[12px] text-ink-faint">
            The first name leads the call and gets the most lines. Two guests is the sweet spot —
            with one, every guest line folds into them.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
          <p className="text-[12px] text-ink-faint max-w-[60%]">
            Booked calls live in this browser only (no database in this build) — they survive a
            reload, and only you can see them.
          </p>
          <button
            onClick={book}
            disabled={!title.trim() || attendees.split(",").every((s) => !s.trim())}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
          >
            Book &amp; arm the capture
          </button>
        </div>
      </div>
    </div>
  );
}