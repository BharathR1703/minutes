"use client";

import type { Meeting } from "@/lib/model";
import { useEffect } from "react";
import { fmtDate } from "@/lib/time";

/**
 * Clip-share modal — the "share with someone who wasn't on the call" flow.
 * Creates a standalone link that plays just this moment and shows its words.
 */
export function ShareModal({
  meeting,
  highlightId,
  onClose,
}: {
  meeting: Meeting;
  highlightId: string;
  onClose: () => void;
}) {
  const h = meeting.highlights.find((x) => x.id === highlightId);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!h) return null;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${meeting.id}?h=${h.id}`
      : `/share/${meeting.id}?h=${h.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share clip"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-raised p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight">
          Share this clip
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
          Anyone with this link can watch the moment from{" "}
          <span className="font-mono text-[12px] tabular-nums">{fmtClipTime(h.at)}</span> and
          read the words — no account needed. They won&rsquo;t see your other meetings.
        </p>

        <div className="mt-4 rounded-lg border border-line-soft bg-paper p-3">
          <p className="text-[13px] font-medium">{h.title}</p>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            {meeting.title} · {fmtDate(meeting.startedAt)}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 font-mono text-[12px] text-ink-soft"
            aria-label="Shareable link"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={() => navigator.clipboard?.writeText(url)}
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:opacity-90"
          >
            Copy link
          </button>
        </div>
        <div className="mt-3 flex justify-between">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-medium text-record underline underline-offset-2"
          >
            Open what they&rsquo;ll see
          </a>
          <button onClick={onClose} className="text-[13px] text-ink-soft hover:text-ink">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtClipTime(t: number): string {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}