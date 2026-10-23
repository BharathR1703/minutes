"use client";

import type { Meeting } from "@/lib/model";
import { usePlayer } from "@/lib/player";
import { SpeakingGraph } from "@/components/SpeakingGraph";
import { TranscriptPane } from "@/components/meeting/TranscriptPane";
import { useEffect } from "react";
import { mmss } from "@/lib/time";

/**
 * A self-contained player for a shared clip: starts at the clip's start,
 * pauses at start+length, and shows only that slice of the timeline.
 */
export function ClipPlayer({
  meeting,
  start,
  length,
}: {
  meeting: Meeting;
  start: number;
  length: number;
}) {
  const player = usePlayer(meeting, start);

  // stop at the end of the clip window
  useEffect(() => {
    if (player.playing && player.t >= start + length) player.toggle();
  }, [player, start, length]);

  return (
    <div className="rounded-xl border border-line-soft bg-raised p-4">
      <div aria-hidden>
        <SpeakingGraph
          meeting={meeting}
          progress={(player.t / meeting.duration) || 0}
          clip={{ start, length }}
          onSeek={player.seek}
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={player.toggle}
          aria-label={player.playing ? "Pause clip" : "Play clip"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-paper hover:opacity-90"
        >
          {player.playing ? "❚❚" : "▶"}
        </button>
        <span className="font-mono text-[13px] tabular-nums text-ink-soft">
          {mmss(Math.max(0, player.t - start))} / {mmss(length)}
        </span>
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-faint">
          <input
            type="checkbox"
            checked={!player.muted}
            onChange={() => player.setMuted(!player.muted)}
            className="accent-record"
          />
          sound (synthetic)
        </label>
      </div>
      <div className="mt-2">
        <TranscriptPane meeting={meeting} player={player} range={{ start, length }} />
      </div>
    </div>
  );
}