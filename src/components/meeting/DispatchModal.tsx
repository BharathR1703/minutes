"use client";

import type { ActionItem, Meeting } from "@/lib/model";
import { useEffect, useState } from "react";
import { fmtDate, mmss } from "@/lib/time";

type Format = "email" | "jira";

/**
 * Agentic dispatch: the AI drafts the follow-up (mocked locally, honestly
 * labeled as a draft only you can approve) for one action item — an email or
 * a Jira ticket — and nothing leaves without Approve.
 */
export function DispatchModal({
  meeting,
  action,
  onClose,
  onApproved,
}: {
  meeting: Meeting;
  action: ActionItem;
  onClose: () => void;
  onApproved: () => void;
}) {
  const [phase, setPhase] = useState<"drafting" | "draft" | "approved">("drafting");
  const [format, setFormat] = useState<Format>("email");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // mock drafting latency
  useEffect(() => {
    const t = setTimeout(() => setPhase("draft"), 1400);
    return () => clearTimeout(t);
  }, [action.id]);

  const quote = meeting.transcript.find((u) => u.t <= action.cite && action.cite < u.t + u.dur + 4);
  const ownerFirst = action.ownerName.split(" ")[0];

  const email = [
    `Subject: ${ownerFirst} — follow through on "${shorten(action.text, 48)}"`,
    "",
    `Hi ${ownerFirst},`,
    "",
    `From today's ${meeting.title} (${fmtDate(meeting.startedAt)}) — this one is on you, due ${
      action.due ? fmtDate(action.due) : "this week"
    }:`,
    "",
    `  ${action.text}`,
    "",
    quote ? `Where it was agreed, verbatim:\n\n  “${quote.text}” [${mmss(quote.t)}]` : "",
    "",
    "If the date doesn't hold, reply with the one that does and I'll move the tracker.",
    "",
    "— drafted by Minutes, sending on your approval",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const jira = [
    `Summary:  [${ownerFirst.toUpperCase()}] ${shorten(action.text, 64)}`,
    `Type:     Task · Priority: ${action.due && +new Date(action.due) - Date.now() < 4 * 86_400_000 ? "High" : "Medium"}`,
    `Due:      ${action.due ? fmtDate(action.due) : "—"}   Reported by: Minutes`,
    `Source:   ${meeting.title} @ [${mmss(action.cite)}] (linked recording moment)`,
    "",
    "Description:",
    `  Owner committed on the call. Quote as said:`,
    quote ? `  “${quote.text}” [${mmss(quote.t)}]` : `  ${action.text}`,
    "",
    `  Acceptance: the item is done and confirmed in next week's check-in,`,
    `  else the due date moves with a note.`,
  ].join("\n");

  const draft = format === "email" ? email : jira;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Dispatch action item"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-line bg-raised p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Dispatch this action item</p>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-medium leading-snug tracking-tight">
              {action.text}
            </h2>
            <p className="mt-1 text-[12.5px] text-ink-faint">
              {action.ownerName} · {action.due ? `due ${fmtDate(action.due)}` : "no due date"} ·{" "}
              {meeting.title}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 text-[13px] text-ink-soft hover:text-ink">
            Close
          </button>
        </div>

        {phase === "drafting" && (
          <div className="mt-5 space-y-2" aria-busy="true" aria-label="AI is drafting">
            <p className="text-[13px] text-ink-faint">
              Drafting the {format === "email" ? "email" : "ticket"} from what was actually said…
            </p>
            {[92, 78, 88, 40].map((w, i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded bg-line-soft"
                style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        {phase !== "drafting" && (
          <>
            <div className="mt-4 flex items-center gap-1" role="tablist" aria-label="Draft format">
              {(["email", "jira"] as Format[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={format === f}
                  onClick={() => setFormat(f)}
                  className={
                    "rounded-full px-3 py-1 text-[12.5px] font-medium " +
                    (format === f ? "bg-ink text-paper" : "text-ink-soft hover:bg-line-soft")
                  }
                >
                  {f === "email" ? "Email" : "Jira ticket"}
                </button>
              ))}
              <button
                onClick={() => navigator.clipboard?.writeText(draft)}
                className="ml-auto text-[12.5px] text-record underline underline-offset-2"
              >
                Copy draft
              </button>
            </div>
            <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line-soft bg-paper px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-soft">
              {draft}
            </pre>
            {phase === "draft" ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-[12px] text-ink-faint">
                  Mocked AI — nothing sends in this build, approval is honored in spirit.
                </p>
                <button
                  onClick={() => {
                    setPhase("approved");
                    setTimeout(onApproved, 500);
                  }}
                  className="shrink-0 rounded-full bg-ink px-4.5 py-2 text-[13.5px] font-medium text-paper hover:opacity-90"
                >
                  Approve &amp; send
                </button>
              </div>
            ) : (
              <p className="mt-4 text-[13.5px] font-medium text-ok">
                ✓ Approved — dispatched to {action.ownerName}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function shorten(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}