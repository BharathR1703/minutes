"use client";

import type { Meeting, Upcoming } from "@/lib/model";
import { SpeakingGraph } from "@/components/SpeakingGraph";
import { mmss, fmtTime, hms } from "@/lib/time";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Real-time milliseconds between streamed utterances (accelerated clock). */
const TICK_MS = 1400;
/** Acceleration label — sim clock runs this many seconds per real second. */
const SPEED = 20;

/**
 * Live capture simulation. This build stubs the capture layer; this screen plays
 * the part of the local-recording flow — elapsed clock, streaming words, the
 * speaking graph growing in real time — and lands on the summary Minutes writes
 * when the call ends.
 */
export function LiveCapture({
  event,
  meeting,
  onDone,
}: {
  event: Upcoming;
  meeting: Meeting;
  /** fired once when the simulated call ends — where a booked call gets recorded */
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"armed" | "live" | "done">("armed");
  const [turns, setTurns] = useState(0);
  const [simSec, setSimSec] = useState(0);
  const [words, setWords] = useState(0);
  const [fastForwarding, setFastForwarding] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // the accelerated capture clock
  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => {
      setSimSec((s) => s + SPEED / 2);
      setWords((w) => w + 11);
    }, 500);
    return () => clearInterval(timer);
  }, [phase]);

  // stream utterances in
  useEffect(() => {
    if (phase !== "live" || fastForwarding) return;
    if (turns >= meeting.transcript.length) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setTurns((n) => n + 1), TICK_MS);
    return () => clearTimeout(t);
  }, [phase, turns, fastForwarding, meeting.transcript.length]);

  // auto-scroll the streaming transcript
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  // the call ended: hand the recording to whoever armed the capture
  useEffect(() => {
    if (phase === "done") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function start() {
    setPhase("live");
  }

  function endNow() {
    setFastForwarding(true);
    setTurns(meeting.transcript.length);
    setSimSec(meeting.duration);
    setPhase("done");
  }

  const shown = meeting.transcript.slice(0, turns);
  const speakerOf = (id: string) => meeting.speakers.find((s) => s.id === id);
  const summary = meeting.summaries[meeting.defaultTemplate];
  const startAt = new Date(event.startedAt);
  const liveClock = new Date(startAt.getTime() + simSec * 1000);

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
            Minutes is armed for this call.
            {event.captureMode === "bot"
              ? " The notetaker bot will join as a visible participant when the meeting starts."
              : " No bot joins — Minutes records your system audio and microphone from your machine."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={start}
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
            >
              ▶ Simulate the call starting
            </button>
            <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
              Back to meetings
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-faint">
            This walkthrough build stubs the capture layer — the simulation below shows what a
            real session looks like from your seat.
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
              {words.toLocaleString()} words ·{" "}
              {liveClock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={endNow}
              className="ml-auto rounded-full border border-line bg-raised px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
            >
              Jump to call end ⏭
            </button>
          </div>

          {/* growing speaking graph */}
          <div className="pane mt-4 px-4 pt-3 pb-1" aria-hidden>
            <SpeakingGraph
              meeting={{ ...meeting, transcript: shown }}
              progress={simSec / meeting.duration}
              height={44}
            />
          </div>

          {/* streaming transcript */}
          <div
            ref={listRef}
            className="pane mt-4 h-72 overflow-y-auto"
            aria-label="Streaming transcript"
          >
            <ul>
              {shown.map((u, i) => {
                const sp = speakerOf(u.speaker);
                return (
                  <li key={i} className="border-b border-line-soft px-4 py-2.5">
                    <div className="mb-0.5 flex items-baseline gap-2">
                      <span
                        className="text-[12.5px] font-semibold"
                        style={{ color: sp?.self ? undefined : sp?.color }}
                      >
                        {sp?.self ? "You" : sp?.name}
                      </span>
                    </div>
                    <p className="text-[14px] leading-relaxed text-ink-soft">{u.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-2 text-right text-[12px] text-ink-faint">
            capture simulation, ~{SPEED}× speed
          </p>
        </div>
      )}

      {phase === "done" && summary && (
        <div>
          <div className="pane flex items-center gap-3 px-4 py-3">
            <span className="rec-dot size-2 rounded-full bg-record" aria-hidden />
            <span className="text-[14px] font-medium">Call ended</span>
            <span className="font-mono text-[13px] tabular-nums text-ink-faint">
              {hms(meeting.duration)} captured
            </span>
          </div>
          <div className="pane mt-4 p-5">
            <p className="eyebrow mb-2">Minutes wrote, as the call ended</p>
            <p className="font-[family-name:var(--font-display)] text-xl leading-snug">
              {summary.gist}
            </p>
            <ul className="mt-4 space-y-2.5">
              {summary.sections[0]?.bullets.slice(0, 4).map((b, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
                  <span className="text-ink-faint">·</span>
                  {b.text}
                </li>
              ))}
            </ul>
            {meeting.actionItems.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="eyebrow mb-2">Actions</p>
                <ul className="space-y-1.5">
                  {meeting.actionItems.slice(0, 3).map((a) => (
                    <li key={a.id} className="text-[14px] text-ink-soft">
                      <span className="font-medium text-ink">{a.ownerName}</span> — {a.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/m/${meeting.id}`}
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
            >
              Open the full meeting →
            </Link>
            <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
              Back to meetings
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-faint">
            In this build the capture layer is stubbed — every word above now lives in your
            meetings list with playback, search and sharing.
          </p>
        </div>
      )}
    </div>
  );
}