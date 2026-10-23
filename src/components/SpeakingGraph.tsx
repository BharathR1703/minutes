import type { Meeting } from "@/lib/model";
import { hms } from "@/lib/time";

/**
 * The speaking graph — a compressed bar of the whole call where a colored
 * block means that person was talking. This is the product's visual identity:
 * every meeting row and every player carries one. Height encodes loudness of
 * participation (utterance length), color encodes who.
 */
export function SpeakingGraph({
  meeting,
  progress,
  clip,
  onSeek,
  height = 36,
  className,
}: {
  meeting: Meeting;
  /** 0..1 playhead marker */
  progress?: number;
  clip?: { start: number; length: number };
  onSeek?: (t: number) => void;
  height?: number;
  className?: string;
}) {
  const W = 640;
  const dur = meeting.duration || 1;
  const colorOf = Object.fromEntries(meeting.speakers.map((s) => [s.id, s.color]));
  // bucket into ~214 columns
  const cols = Math.min(214, Math.max(48, Math.floor(W / 3)));
  const per = new Array<{ c: string; w: number; n: number }[]>(cols);
  for (let i = 0; i < cols; i++) per[i] = [];
  for (const u of meeting.transcript) {
    const startB = Math.floor((u.t / dur) * cols);
    const endB = Math.max(startB, Math.floor(((u.t + u.dur) / dur) * cols));
    for (let b = startB; b <= endB && b < cols; b++) {
      per[b].push({ c: colorOf[u.speaker] ?? "#888", w: u.dur, n: hashNum(u.speaker) });
    }
  }
  const rectW = W / cols;
  const inClip = (sec: number) =>
    clip === undefined || (sec >= clip.start && sec < clip.start + clip.length);
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className={className}
      onClick={
        onSeek
          ? (e) => {
              const frac = (e.clientX - e.currentTarget.getBoundingClientRect().left) /
                e.currentTarget.clientWidth;
              onSeek(Math.floor(frac * dur));
            }
          : undefined
      }
      role="img"
      aria-label={`Speaking graph for ${meeting.title}`}
      preserveAspectRatio="none"
    >
      {per.map((seg, i) =>
        seg.map((s0, j) => {
          const h = Math.min(height - 1, 4 + (s0.w / 24) * (height - 6));
          const y = height - h - j * 0.7;
          return (
            <rect
              key={`${i}-${j}`}
              x={i * rectW}
              y={Math.max(0, y)}
              width={rectW - 0.6}
              height={h}
              fill={s0.c}
              opacity={
                inClip((i / cols) * dur) ? (j === 0 ? 1 : 0.55) : 0.15
              }
              rx={0.6}
            />
          );
        })
      )}
      {progress !== undefined && (
        <rect
          className="playhead"
          x={Math.max(0, Math.min(W - 2, progress * W - 1))}
          y={0}
          width={2}
          height={height}
          fill="var(--record)"
          opacity={0.85}
        />
      )}
    </svg>
  );
}

export function TimeMarkers({ duration }: { duration: number }) {
  const marks = [0, 0.25, 0.5, 0.75];
  return (
    <div className="flex justify-between font-mono text-[10px] text-ink-faint tabular-nums">
      {marks.map((f) => (
        <span key={f}>{hms(Math.floor(duration * f))}</span>
      ))}
      <span>{hms(duration)}</span>
    </div>
  );
}

function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 5;
}