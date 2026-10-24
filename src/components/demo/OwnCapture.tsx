"use client";

import type { Meeting } from "@/lib/model";
import { extractArtifacts } from "@/lib/extract";
import { demoEventUpcoming, downloadIcs, type DemoEvent, type FeedLine } from "@/lib/demo";
import { CaptureSummary } from "@/components/demo/CaptureSummary";
import { mmss, fmtTime, hms } from "@/lib/time";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const SPEED = 20;

/**
 * Live capture for a call booked as "your own" — no walkthrough script. The
 * scribe listens and you feed what's said (type or paste it as it happens);
 * Minutes transcribes, and on the call end extracts the summary, action items
 * and highlights it would write for any call, every line citing the moment.
 */
export function OwnCapture({
  booking,
  speakers,
  onDone,
}: {
  booking: DemoEvent;
  /** [You, ...attendees] — a FeedLine's sp indexes into this */
  speakers: Meeting["speakers"];
  onDone: (feeds: FeedLine[]) => void;
}) {
  const event = demoEventUpcoming(booking);
  const [phase, setPhase] = useState<"armed" | "live" | "done">("armed");
  const [simSec, setSimSec] = useState(0);
  const [feeds, setFeeds] = useState<FeedLine[]>([]);
  const [sp, setSp] = useState<number | "self">(0);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setSimSec((s) => s + SPEED / 2), 500);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [feeds]);

  function feed() {
    const clean = text.trim();
    if (!clean) return;
    setFeeds((f) => [...f, { sp, text: clean }]);
    setText("");
    inputRef.current?.focus();
  }

  const words = useMemo(
    () => feeds.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0),
    [feeds]
  );

  // the extraction Minutes would run — computed live so the done pane shows it
  const fedTimes = useMemo(() => {
    const out: number[] = [];
    let t = 0;
    for (const l of feeds) {
      out.push(Math.round(t));
      const w = l.text.trim().split(/\s+/).length;
      t += Math.max(1.6, Math.round((w / 2.6) * 10) / 10) + 0.9;
    }
    return out;
  }, [feeds]);

  const preview = useMemo(() => {
    if (feeds.length === 0) return null;
    let t = 0;
    const transcript = feeds.map((l) => {
      const words = l.text.trim().split(/\s+/).length;
      const dur = Math.max(1.6, Math.round((words / 2.6) * 10) / 10);
      const speaker = l.sp === "self" ? "you" : `g${Math.min(l.sp, Math.max(0, speakers.length - 2))}`;
      const u = { t: Math.round(t), dur, speaker, text: l.text.trim() };
      t += dur + 0.9;
      return u;
    });
    return extractArtifacts(transcript, {
      idPrefix: "preview",
      nameOf: (sid) => speakers.find((s) => s.id === sid)?.name ?? sid,
    });
  }, [feeds, speakers]);

  function endNow() {
    if (feeds.length === 0) return;
    onDone(feeds);
    setPhase("done");
  }

  const nameOf = (spIdx: number | "self") =>
    speakers.find((s) => (spIdx === "self") === !!s.self)?.name ?? "?";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      {/* ── header ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">
            {event.platform} · starts {fmtTime(event.startedAt)}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
            {event.title}
          </h1>
        </div>
        <span
          className={
            "rounded-full px-2.5 py-1 text-[12.5px] font-medium " +
            (event.captureMode === "bot"
              ? "bg-line-soft text-ink-soft"
              : "bg-ok-soft text-ok")
          }
        >
          {event.captureMode === "bot" ? "minutes bot joins" : "bot-free — captures locally"}
        </span>
      </div>

      {phase === "armed" && (
        <div className="pane p-6">
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Minutes is armed for this call — it&rsquo;s yours, not a walkthrough. When the meeting
            starts, the scribe listens and you feed what&rsquo;s said; Minutes writes the
            summary, action items and highlights from your words, every line cited.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPhase("live")}
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
            >
              ▶ Start the call
            </button>
            <button
              onClick={() => downloadIcs(booking)}
              className="rounded-full border border-line bg-raised px-4 py-2.5 text-[13.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
              title="Download this booking as a calendar .ics file with the attendees' emails"
            >
              Add to my real calendar (.ics)
            </button>
            <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
              Back to meetings
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-faint">
            Attendees: {speakers.filter((s) => !s.self).map((s) => s.name).join(", ") || "none yet"}. In
            this build nothing joins Zoom — the capture layer is this scribe.
          </p>
        </div>
      )}

      {phase === "live" && (
        <div>
          {/* status bar */}
          <div className="pane flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span className="flex items-center gap-2 text-[13.5px] font-medium">
              <span className="rec-dot size-2 rounded-full bg-record" aria-hidden />
              Capturing
            </span>
            <span className="font-mono text-[13.5px] tabular-nums text-ink">
              {mmss(Math.floor(simSec))}
            </span>
            <span className="text-[12.5px] text-ink-faint">
              {words.toLocaleString()} words · {feeds.length} turn{feeds.length === 1 ? "" : "s"} fed
            </span>
            <button
              onClick={endNow}
              disabled={feeds.length === 0}
              className="ml-auto rounded-full border border-line bg-raised px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink disabled:opacity-40"
              title={feeds.length === 0 ? "Feed at least one line first" : "Minutes writes the summary"}
            >
              End the call — Minutes writes it ⏭
            </button>
          </div>

          {/* scribe composer */}
          <div className="pane mt-4 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] text-ink-faint">Who&rsquo;s speaking:</span>
              {speakers.map((s) => {
                const isSelf = !!s.self;
                const idx: number | "self" = isSelf ? "self" : Number(s.id.replace("g", "")) || 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSp(idx)}
                    aria-pressed={sp === idx}
                    className={
                      "rounded-full px-3 py-1 text-[12.5px] font-medium " +
                      (sp === idx
                        ? "text-paper"
                        : "border border-line bg-raised text-ink-soft hover:text-ink")
                    }
                    style={sp === idx ? { background: s.color } : { boxShadow: `inset 3px 0 0 ${s.color}` }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                feed();
              }}
              className="mt-2.5 flex gap-2"
            >
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  sp === "self"
                    ? "What you're saying… then Enter to feed the scribe"
                    : `What ${nameOf(sp)} says… then Enter`
                }
                aria-label="Feed the scribe"
                className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-[14px] focus:outline-none focus:border-ink-soft"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper hover:opacity-90"
              >
                Feed
              </button>
            </form>
          </div>

          {/* transcript the scribe is writing (timestamps follow Minutes' cadence) */}
          <div ref={listRef} className="pane mt-4 h-64 overflow-y-auto" aria-label="Streaming transcript">
            {feeds.length === 0 ? (
              <p className="px-4 pt-14 text-center text-[13px] text-ink-faint">
                The scribe is listening — feed the first line of the call above.
              </p>
            ) : (
              <ul>
                {feeds.map((l, i) => {
                  const s = speakers.find((x) => (l.sp === "self") === !!x.self);
                  const fedAt = fedTimes[i] ?? 0;
                  return (
                    <li key={i} className="border-b border-line-soft px-4 py-2.5">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="text-[12.5px] font-semibold" style={{ color: s?.self ? undefined : s?.color }}>
                          {l.sp === "self" ? "You" : nameOf(l.sp)}
                        </span>
                        <span className="font-mono text-[11px] text-ink-faint">{mmss(fedAt)}</span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-ink-soft">{l.text}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="mt-2 text-right text-[12px] text-ink-faint">
            capture simulation, ~{SPEED}× clock — type or paste the call as it happens
          </p>
        </div>
      )}

      {phase === "done" && preview && (
        <CaptureSummary
          event={event}
          preview={preview}
          capturedLabel={`${hms(Math.round(simSec))}`}
        />
      )}
    </div>
  );
}