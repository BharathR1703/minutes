"use client";

import type { Meeting } from "@/lib/model";
import type { usePlayer } from "@/lib/player";
import { hms } from "@/lib/time";
import { SpeakingGraph, TimeMarkers } from "@/components/SpeakingGraph";

export function Player({
  meeting,
  player,
}: {
  meeting: Meeting;
  player: ReturnType<typeof usePlayer>;
}) {
  const progress = player.t / meeting.duration;
  const active = player.activeIdx >= 0 ? meeting.transcript[player.activeIdx] : null;
  const activeSpeaker = meeting.speakers.find((s) => s.id === active?.speaker);

  function scrub(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    player.seek(((e.clientX - rect.left) / rect.width) * meeting.duration);
  }

  return (
    <section className="pane p-4" aria-label="Recording playback">
      <div
        className="mb-1 cursor-pointer"
        onClick={scrub}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(player.t)}
        aria-valuemin={0}
        aria-valuemax={meeting.duration}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") player.seek(player.t + 10);
          if (e.key === "ArrowLeft") player.seek(player.t - 10);
        }}
      >
        <SpeakingGraph meeting={meeting} progress={progress} height={44} className="h-11 w-full" />
      </div>
      <TimeMarkers duration={meeting.duration} />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={player.toggle}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper hover:opacity-90"
          aria-label={player.playing ? "Pause" : "Play"}
        >
          {player.playing ? (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden>
              <rect x="1" y="1" width="3.4" height="12" rx="1" />
              <rect x="7.6" y="1" width="3.4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="13" height="14" viewBox="0 0 13 14" fill="currentColor" aria-hidden>
              <path d="M2 1.6c0-.9 1-1.5 1.8-1L12 6c.8.5.8 1.6 0 2.1L3.8 13.4C3 13.9 2 13.3 2 12.4V1.6Z" />
            </svg>
          )}
        </button>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-medium text-ink tabular-nums">
            {hms(Math.floor(player.t))}
          </span>
          <span className="font-mono text-xs text-ink-faint tabular-nums">
            / {hms(meeting.duration)}
          </span>
        </div>

        {active && activeSpeaker ? (
          <p className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">
            <span className="font-medium" style={{ color: activeSpeaker.color }}>
              {activeSpeaker.name}
            </span>
            <span className="mx-1.5 text-line">|</span>
            {active.text}
          </p>
        ) : (
          <p className="min-w-0 flex-1 text-[13px] text-ink-faint italic">
            {player.t === 0 && !player.playing ? "Not started" : "Silence"}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => player.setSpeed(player.speed === 1 ? 1.75 : player.speed === 1.75 ? 2 : 1)}
            className="rounded-full border border-line px-2.5 py-1 font-mono text-xs tabular-nums hover:border-ink-soft"
            aria-label="Playback speed"
          >
            {player.speed}×
          </button>
          <button
            onClick={() => player.setMuted(!player.muted)}
            className={
              "rounded-full border px-2.5 py-1 text-xs " +
              (player.muted
                ? "border-line text-ink-faint hover:border-ink-soft"
                : "border-record bg-record-soft text-record")
            }
            aria-label={player.muted ? "Unmute voice bed" : "Mute voice bed"}
            title={
              player.muted
                ? "Sound is a synthesized voice bed (no real capture in this build)"
                : "Synthesized voice bed on"
            }
          >
            {player.muted ? "sound off" : "sound on"}
          </button>
        </div>
      </div>
    </section>
  );
}