"use client";

import type { ActionItem, Highlight, Meeting, Summary } from "@/lib/model";
import { fmtTime, hms, mmss } from "@/lib/time";
import Link from "next/link";

/** The "Minutes wrote" report shown when a capture ends — identical for
 * typed calls (OwnCapture) and real calls (RealCapture). */
export function CaptureSummary({
  event,
  preview,
  capturedLabel,
  capturedNote,
}: {
  event: { id: string; captureMode: string };
  preview: { summary: Summary; actionItems: ActionItem[]; highlights: Highlight[] };
  capturedLabel: string;
  /** extra provenance tag next to the captured time, e.g. "of real audio" */
  capturedNote?: string;
}) {
  return (
    <div>
      <div className="pane flex items-center gap-3 px-4 py-3">
        <span className="rec-dot size-2 rounded-full bg-record" aria-hidden />
        <span className="text-[14px] font-medium">Capture ended</span>
        <span className="font-mono text-[13px] tabular-nums text-ink-faint">
          {capturedLabel} {capturedNote ?? "captured"}
        </span>
      </div>
      <div className="pane mt-4 p-5">
        <p className="eyebrow mb-2">Minutes wrote, as the call ended</p>
        <p className="font-[family-name:var(--font-display)] text-xl leading-snug">
          {preview.summary.gist}
        </p>
        <ul className="mt-4 space-y-2.5">
          {preview.summary.sections[0]?.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
              <span className="shrink-0 rounded bg-record-soft px-1 font-mono text-[11.5px] font-medium text-record">
                [{mmss(b.cite)}]
              </span>
              {b.text}
            </li>
          ))}
        </ul>
        {preview.highlights.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="eyebrow mb-2">Flagged moments</p>
            <ul>
              {preview.highlights.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center gap-2 border-t border-line-soft py-1.5 text-[14px] text-ink-soft first:border-0 first:pt-0"
                >
                  {h.tag && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium uppercase text-ink-soft"
                      style={{ background: "#efeadf" }}
                    >
                      {h.tag}
                    </span>
                  )}
                  <span className="font-mono text-[11.5px] text-ink-faint">{mmss(h.at)}</span>
                  <span>{h.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {preview.actionItems.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="eyebrow mb-2">Actions</p>
            <ul className="space-y-1.5">
              {preview.actionItems.map((a) => (
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
          href={`/m/${event.id}`}
          className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
        >
          Open the full meeting →
        </Link>
        <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
          Back to meetings
        </Link>
      </div>
      <p className="mt-4 text-[12.5px] text-ink-faint">
        The extraction is heuristic in this build — now live in the meeting with playback, chat,
        clips and dispatch, all citing these moments.
      </p>
    </div>
  );
}