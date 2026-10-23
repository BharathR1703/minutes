"use client";

import type { Meeting } from "@/lib/model";
import type { usePlayer } from "@/lib/player";
import { hms, mmss } from "@/lib/time";
import { useEffect, useRef, useState } from "react";

/**
 * Transcript pane: speaker turns, auto-scroll synced to playback, click any
 * line to seek. Highlight markers land inline, in the moment they were made.
 * Search filters the pane in place.
 */
export function TranscriptPane({
  meeting,
  player,
  range,
}: {
  meeting: Meeting;
  player: ReturnType<typeof usePlayer>;
  /** for shared clips: show only this slice of the transcript */
  range?: { start: number; length: number };
}) {
  const [inThis, setInThis] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const lastUserScroll = useRef(0);

  const hlAt = (t: number) => meeting.highlights.filter((h) => h.at <= t && t < h.at + 2);

  const q = inThis.trim().toLowerCase();
  const visible = meeting.transcript.filter(
    (u) =>
      (!q || u.text.toLowerCase().includes(q)) &&
      (!range || (u.t + u.dur > range.start - 1 && u.t < range.start + range.length + 1))
  );

  // auto-scroll to active utterance while playing (unless user scrolled recently)
  useEffect(() => {
    if (!player.playing || !activeRef.current) return;
    if (performance.now() - lastUserScroll.current > 2500) {
      activeRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [player.activeIdx, player.playing]);

  function onUserScroll() {
    lastUserScroll.current = performance.now();
  }

  function seekUtterance(i: number) {
    const u = meeting.transcript[i];
    player.seek(u.t);
    if (!player.playing) player.toggle();
  }

  return (
    <section
      className="flex h-full min-h-0 flex-col pane"
      aria-label="Transcript"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <h2 className="eyebrow">Transcript</h2>
        <span className="font-mono text-[11px] text-ink-faint tabular-nums">
          {range ? `${visible.length} turns in clip` : `${meeting.transcript.length} turns`}
        </span>
        <input
          value={inThis}
          onChange={(e) => setInThis(e.target.value)}
          placeholder="Find in transcript…"
          aria-label="Find in transcript"
          className="ml-auto w-36 rounded-full border border-line bg-paper px-3 py-1 text-xs focus:outline-none sm:w-44"
        />
      </div>

      <div
        ref={listRef}
        onWheel={onUserScroll}
        onTouchMove={onUserScroll}
        className="scrollpane min-h-0 flex-1 overflow-y-auto"
      >
        <ul>
          {visible.map((u) => {
            const i = meeting.transcript.indexOf(u);
            const sp = meeting.speakers.find((s) => s.id === u.speaker);
            const isActive = i === player.activeIdx && !q;
            const marks = hlAt(u.t);
            return (
              <li
                key={i}
                ref={isActive ? activeRef : undefined}
                data-active={isActive}
                className="transcript-utterance border-b border-line-soft px-4 py-2.5"
              >
                <button
                  onClick={() => seekUtterance(i)}
                  className="block w-full text-left"
                  aria-label={`Play from ${mmss(u.t)}`}
                >
                  <div className="mb-0.5 flex items-baseline gap-2">
                    <span className="font-mono text-[11px] text-ink-faint tabular-nums">
                      {mmss(u.t)}
                    </span>
                    <span
                      className={
                        "text-[12.5px] font-semibold " +
                        (sp?.self ? "text-ink" : "")
                      }
                      style={!sp?.self ? { color: sp?.color } : undefined}
                    >
                      {sp?.name}
                    </span>
                    {marks.map((h) => (
                      <span
                        key={h.id}
                        className="rounded bg-record-soft px-1.5 py-px text-[10px] font-medium text-record"
                      >
                        {h.tag ?? "highlight"}
                      </span>
                    ))}
                  </div>
                  <p
                    className={
                      "text-[14px] leading-relaxed " +
                      (q ? "text-ink-soft" : isActive ? "text-ink" : "text-ink-soft")
                    }
                  >
                    {u.text}
                  </p>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-ink-faint">
              Nothing in this transcript matches &ldquo;{inThis}&rdquo;.{" "}
              <button className="text-record underline underline-offset-2" onClick={() => setInThis("")}>
                Clear
              </button>
            </li>
          )}
        </ul>
        <div className="px-4 py-3 text-center text-xs text-ink-faint">
          {range
            ? `End of clip · ${mmss(Math.min(range.length, meeting.duration - range.start))} shared`
            : `End of transcript · ${hms(meeting.duration)} recorded`}
        </div>
      </div>
    </section>
  );
}