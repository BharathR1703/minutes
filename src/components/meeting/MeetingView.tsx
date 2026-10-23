"use client";

import type { Meeting } from "@/lib/model";
import { usePlayer } from "@/lib/player";
import { Player } from "./Player";
import { TranscriptPane } from "./TranscriptPane";
import { LeftPanel } from "./LeftPanel";
import { fmtDate, fmtTime, hms } from "@/lib/time";
import { useEffect, useState } from "react";

export function MeetingView({ meeting, initialTime }: { meeting: Meeting; initialTime: number }) {
  const player = usePlayer(meeting, initialTime);
  const [copiedLink, setCopiedLink] = useState(false);

  // keyboard: space = play/pause, arrows seek (when not typing)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        player.toggle();
      }
      if (e.key === "ArrowRight") player.seek(player.t + 10);
      if (e.key === "ArrowLeft") player.seek(player.t - 10);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  async function copyAtCurrentTime() {
    const url = `${window.location.origin}/m/${meeting.id}?t=${Math.floor(player.t)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  }

  const others = meeting.speakers.filter((s) => !s.self);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-[32px] font-medium leading-tight tracking-tight">
            {meeting.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-ink-soft">
            <span>
              {fmtDate(meeting.startedAt)} · {fmtTime(meeting.startedAt)}
            </span>
            <span className="font-mono tabular-nums text-ink-faint">{hms(meeting.duration)}</span>
            <span>{meeting.platform}</span>
            <span
              className={
                "rounded-full px-2 py-0.5 text-[11.5px] font-medium " +
                (meeting.captureMode === "bot"
                  ? "bg-line-soft text-ink-soft"
                  : "bg-ok-soft text-ok")
              }
            >
              {meeting.captureMode === "bot" ? "bot recorded" : "bot-free capture"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-soft">
            <span className="inline-flex -space-x-1.5" aria-hidden>
              {others.slice(0, 8).map((s) => (
                <span
                  key={s.id}
                  className="inline-block size-2.5 rounded-full ring-2 ring-paper"
                  style={{ background: s.color }}
                />
              ))}
            </span>
            <span>
              {others.map((s) => s.name.split(" ")[0]).join(", ")}
              {others.length === 0 ? " solo test" : ""}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={copyAtCurrentTime}
            className="rounded-full border border-line bg-raised px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
          >
            {copiedLink ? "Link copied" : "Copy link to this moment"}
          </button>
        </div>
      </div>

      {/* ── panes ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-6">
          <Player meeting={meeting} player={player} />
          <LeftPanel meeting={meeting} player={player} />
        </div>
        <div className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-88px)]">
          <TranscriptPane meeting={meeting} player={player} />
        </div>
      </div>
    </div>
  );
}