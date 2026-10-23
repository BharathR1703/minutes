"use client";

import type { Highlight, Meeting, Utterance } from "@/lib/model";
import { mmss, hms } from "@/lib/time";
import { useEffect, useRef, useState } from "react";

const CLIP_SECONDS = 28;

/** The AI clip list: each highlight becomes a ready-to-share vertical clip. */
export function ClipsPanel({ meeting }: { meeting: Meeting }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const clips = meeting.highlights.map((h) => ({
    h,
    speaker: dominantSpeaker(meeting, h.at, CLIP_SECONDS),
    lines: clipLines(meeting, h.at, CLIP_SECONDS),
  }));

  const open = clips.find((c) => c.h.id === openId);

  return (
    <div>
      <p className="mb-3 text-[12.5px] text-ink-faint">
        Minutes cut this call into vertical clips for social — captions on, speaker on, nothing
        to edit.
      </p>
      <ul className="space-y-2.5">
        {clips.map((c) => (
          <ClipRow key={c.h.id} clip={c} onOpen={() => setOpenId(c.h.id)} />
        ))}
      </ul>
      {open && <ClipTheatre clip={open} meeting={meeting} onClose={() => setOpenId(null)} />}
    </div>
  );
}

type Clip = {
  h: Highlight;
  speaker: { id: string; name: string; color: string } | undefined;
  lines: Utterance[];
};

function ClipRow({ clip, onOpen }: { clip: Clip; onOpen: () => void }) {
  const { h, speaker } = clip;
  return (
    <li>
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-lg border border-line-soft bg-raised px-3 py-2.5 text-left hover:border-ink-soft"
        aria-label={`Play clip: ${h.title}`}
      >
        {/* mini vertical thumb */}
        <span
          className="grid w-9 shrink-0 place-items-center rounded text-[10px] font-semibold text-paper"
          style={{ aspectRatio: "9/16", background: speaker?.color ?? "#374151" }}
          aria-hidden
        >
          9:16
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium">{h.title}</span>
          <span className="mt-0.5 block text-[12px] text-ink-faint">
            {h.tag ?? "clip"} · starts {mmss(h.at)} · {CLIP_SECONDS}s · {speaker?.name}
          </span>
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-ink px-3 py-1 text-[12px] font-medium text-paper">
          Play
        </span>
      </button>
    </li>
  );
}

/** Full-screen-ish theatre: the 9:16 player with TikTok-style captions. */
function ClipTheatre({
  clip,
  meeting,
  onClose,
}: {
  clip: Clip;
  meeting: Meeting;
  onClose: () => void;
}) {
  const [t, setT] = useState(0); // clip-local seconds
  const [playing, setPlaying] = useState(true);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const step = (now: number) => {
      setT((v) => {
        const nv = v + (now - last) / 1000;
        last = now;
        return nv >= CLIP_SECONDS ? CLIP_SECONDS : nv;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  const { h, speaker } = clip;
  const activeIdx = clip.lines.findIndex((u) => t + h.at >= u.t && t + h.at < u.t + u.dur);
  const finished = t >= CLIP_SECONDS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Clip: ${h.title}`}
      onClick={onClose}
    >
      <div className="flex max-h-full items-end gap-4" onClick={(e) => e.stopPropagation()}>
        {/* the vertical video */}
        <div
          className="relative flex w-[270px] shrink-0 flex-col overflow-hidden rounded-2xl bg-ink text-paper shadow-2xl"
          style={{ aspectRatio: "9/16", maxHeight: "78vh" }}
        >
          {/* speaker color wash */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3 opacity-25"
            style={{
              background: `linear-gradient(to bottom, ${speaker?.color ?? "#374151"}, transparent)`,
            }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between px-3 pt-3">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: speaker?.color ?? "#888" }}
                aria-hidden
              />
              {speaker?.name ?? "Unknown"}
            </span>
            <span className="rounded-full bg-paper/15 px-1.5 py-px font-mono text-[9.5px]">
              {mmss(h.at)}
            </span>
          </div>
          <div className="relative flex-1" aria-hidden />
          {/* captions rising from the bottom */}
          <div className="relative flex h-[38%] flex-col justify-end overflow-hidden px-3 pb-4">
            {(activeIdx < 0 ? clip.lines.slice(0, 2) : clip.lines.slice(Math.max(0, activeIdx - 1), activeIdx + 2)).map(
              (u, i, arr) => {
                const globalIdx = activeIdx < 0 ? i : i + Math.max(0, activeIdx - 1);
                return (
                  <p
                    key={globalIdx}
                    className={
                      "text-[13px] leading-snug transition-opacity duration-300 " +
                      (globalIdx === activeIdx
                        ? "font-semibold text-paper"
                        : i < arr.length - 1 && globalIdx < activeIdx
                          ? "text-paper/40"
                          : "text-paper/70")
                    }
                  >
                    {u.text}
                  </p>
                );
              }
            )}
          </div>
          {/* progress */}
          <div className="relative px-3 pb-3">
            <div className="h-1 overflow-hidden rounded-full bg-paper/20">
              <div
                className="h-full rounded-full bg-record"
                style={{ width: `${(t / CLIP_SECONDS) * 100}%` }}
              />
            </div>
          </div>
          {/* play / replay */}
          <button
            onClick={() => {
              if (finished) {
                setT(0);
                setPlaying(true);
              } else setPlaying((p) => !p);
            }}
            className="absolute inset-0 grid place-items-center"
            aria-label={finished ? "Replay clip" : playing ? "Pause clip" : "Play clip"}
          >
            {(finished || !playing) && (
              <span className="grid size-14 place-items-center rounded-full bg-ink/60 text-xl backdrop-blur">
                {finished ? "↻" : "▶"}
              </span>
            )}
          </button>
        </div>

        {/* side meta */}
        <div className="max-w-xs pb-1 text-paper">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-paper/60">
            Smart clip · {meeting.title.split("—")[0].trim()}
          </p>
          <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-medium leading-tight">
            {h.title}
          </h2>
          {h.note && <p className="mt-2 text-[13px] leading-relaxed text-paper/70">{h.note}</p>}
          <p className="mt-3 font-mono text-[11.5px] text-paper/50 tabular-nums">
            {mmss(h.at)}–{mmss(Math.min(meeting.duration, h.at + CLIP_SECONDS))} of{" "}
            {hms(meeting.duration)}
          </p>
          <div className="mt-5 flex flex-col items-start gap-2">
            <a
              href={`/share/${meeting.id}?h=${h.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-paper/15 px-3.5 py-2 text-[13px] font-medium hover:bg-paper/25"
            >
              Share this clip ↗
            </a>
            <a
              href={`/m/${meeting.id}?t=${h.at}`}
              className="text-[13px] text-paper/60 underline underline-offset-2 hover:text-paper"
            >
              Keep the whole call instead
            </a>
            <button
              onClick={onClose}
              className="mt-3 text-[13px] text-paper/60 hover:text-paper"
            >
              Close (esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────────── */

function clipLines(meeting: Meeting, at: number, len: number) {
  return meeting.transcript.filter((u) => u.t + u.dur > at - 1 && u.t < at + len);
}

function dominantSpeaker(meeting: Meeting, at: number, len: number) {
  const tally = new Map<string, number>();
  for (const u of clipLines(meeting, at, len))
    tally.set(u.speaker, (tally.get(u.speaker) ?? 0) + u.dur);
  let best: { id: string; n: number } | null = null;
  for (const [id, n] of tally) {
    if (id === meeting.speakers.find((s) => s.self)?.id && tally.size > 1) continue;
    if (!best || n > best.n) best = { id, n };
  }
  return meeting.speakers.find((s) => s.id === (best?.id ?? tally.keys().next().value));
}