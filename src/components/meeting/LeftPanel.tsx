"use client";

import type { Meeting, Summary } from "@/lib/model";
import type { usePlayer } from "@/lib/player";
import { MEETING_TEMPLATES } from "@/lib/templates";
import { fmtDate } from "@/lib/time";
import { useState } from "react";
import { ShareModal } from "./ShareModal";
import { AskPanel } from "./AskPanel";

type TabId = "summary" | "actions" | "moments" | "email" | "ask";

export function LeftPanel({
  meeting,
  player,
}: {
  meeting: Meeting;
  player: ReturnType<typeof usePlayer>;
}) {
  const tabOrder: { id: TabId; label: string; count?: number }[] = [
    { id: "summary", label: "Summary" },
    { id: "actions", label: "Action items", count: meeting.actionItems.length },
    { id: "moments", label: "Moments", count: meeting.highlights.length },
    { id: "email", label: "Follow-up" },
    { id: "ask", label: "Ask this call" },
  ];
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-1" role="tablist" aria-label="Meeting artifacts">
        {tabOrder.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={
              "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors " +
              (tab === tb.id
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-line-soft hover:text-ink")
            }
          >
            {tb.label}
            {tb.count !== undefined && (
              <span className={"ml-1.5 font-mono text-[11px] " + (tab === tb.id ? "text-paper/70" : "text-ink-faint")}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pane p-5" role="tabpanel" aria-label={tab}>
        {tab === "summary" && <SummaryPanel meeting={meeting} player={player} />}
        {tab === "actions" && <ActionItems meeting={meeting} player={player} />}
        {tab === "moments" && <HighlightsPanel meeting={meeting} player={player} />}
        {tab === "email" && <EmailPanel meeting={meeting} />}
        {tab === "ask" && <AskPanel meeting={meeting} player={player} />}
      </div>
    </div>
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────
function SummaryPanel({ meeting, player }: { meeting: Meeting; player: ReturnType<typeof usePlayer> }) {
  const templates = MEETING_TEMPLATES.filter((t) => meeting.summaries[t.id]);
  const [template, setTemplate] = useState(meeting.defaultTemplate);
  const summary: Summary = meeting.summaries[template] ?? meeting.summaries[meeting.defaultTemplate];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-faint">
          {fmtDate(meeting.startedAt)} · drafted by Minutes, every line cites the moment
        </p>
        {/* template switcher — per-call summary style */}
        <label className="relative z-10 flex items-center gap-1.5 text-[12px] text-ink-soft">
          <span className="hidden sm:inline">Summary type</span>
          <select
            value={summary.template}
            onChange={(e) => setTemplate(e.target.value)}
            className="rounded-md border border-line bg-paper px-2 py-1 text-[12.5px] font-medium text-ink focus:outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-5 font-[family-name:var(--font-display)] text-[17px] leading-relaxed tracking-tight">
        {summary.gist}
      </p>

      <div className="space-y-5">
        {summary.sections.map((sec) => (
          <div key={sec.heading}>
            <h3 className="eyebrow mb-2">{sec.heading}</h3>
            <ul className="space-y-2">
              {sec.bullets.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-[14.5px] leading-relaxed">
                  <button
                    onClick={() => player.seek(b.cite)}
                    className="mt-[3px] shrink-0 rounded bg-record-soft px-1.5 py-px font-mono text-[11px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
                    title="Jump to this moment"
                    aria-label={`Jump to ${Math.floor(b.cite / 60)}:${String(Math.floor(b.cite % 60)).padStart(2, "0")}`}
                  >
                    {String(Math.floor(b.cite / 60)).padStart(2, "0")}:{String(Math.floor(b.cite % 60)).padStart(2, "0")}
                  </button>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Action items ─────────────────────────────────────────────────────────────
function ActionItems({ meeting, player }: { meeting: Meeting; player: ReturnType<typeof usePlayer> }) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  function byOwner() {
    const map = new Map<string, typeof meeting.actionItems>();
    for (const a of meeting.actionItems) {
      if (!map.has(a.ownerName)) map.set(a.ownerName, []);
      map.get(a.ownerName)!.push(a);
    }
    return map;
  }

  const speakers = meeting.speakers;

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-faint">
        Extracted with the owner and the moment they were committed — grouped by person.
      </p>
      <div className="space-y-5">
        {[...byOwner().entries()].map(([owner, items]) => {
          const sp = speakers.find((s) => s.name === owner);
          return (
            <div key={owner}>
              <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-semibold">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: sp?.color ?? "#8e9095" }}
                  aria-hidden
                />
                {owner}
              </h3>
              <ul className="space-y-2">
                {items.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-2.5 rounded-lg border border-line-soft bg-paper px-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={!!done[a.id]}
                      onChange={() => setDone((d) => ({ ...d, [a.id]: !d[a.id] }))}
                      className="mt-0.5 size-4 accent-[var(--ok)]"
                      aria-label={`Mark done: ${a.text}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={"text-[14px] leading-snug " + (done[a.id] ? "text-ink-faint line-through" : "")}>
                        {a.text}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[12px] text-ink-faint">
                        <span className="flex items-center gap-1">
                          <span aria-hidden className="text-[10px]">⏎</span>
                          due {a.due ? fmtDate(a.due) : "—"}
                        </span>
                        <button
                          onClick={() => player.seek(a.cite)}
                          className="rounded bg-record-soft px-1.5 py-px font-mono text-[10.5px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
                          aria-label="Jump to the moment this was said"
                        >
                          {String(Math.floor(a.cite / 60)).padStart(2, "0")}:{String(Math.floor(a.cite % 60)).padStart(2, "0")}
                        </button>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Highlights / Moments ─────────────────────────────────────────────────────
function HighlightsPanel({ meeting, player }: { meeting: Meeting; player: ReturnType<typeof usePlayer> }) {
  const [share, setShare] = useState<string | null>(null);

  if (meeting.highlights.length === 0)
    return (
      <p className="text-sm text-ink-faint">
        No moments were flagged during this call. Highlight anything during capture — or from the transcript afterwards — and it lands here as a shareable clip.
      </p>
    );

  const tagColor: Record<string, string> = {
    decision: "bg-ok-soft text-ok",
    risk: "bg-record-soft text-record",
    question: "bg-line-soft text-ink-soft",
    action: "bg-line-soft text-ink-soft",
    moment: "bg-line-soft text-ink-soft",
  };

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-faint">
        Flagged during the call. Each one is a clip you can hand to someone who wasn&rsquo;t there.
      </p>
      <ul className="space-y-3">
        {meeting.highlights.map((h) => (
          <li key={h.id} className="rounded-lg border border-line-soft bg-paper p-3.5">
            <div className="mb-1 flex items-center gap-2">
              <button
                onClick={() => player.seek(h.at)}
                className="rounded bg-record-soft px-1.5 py-px font-mono text-[11px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
              >
                {String(Math.floor(h.at / 60)).padStart(2, "0")}:{String(Math.floor(h.at % 60)).padStart(2, "0")}
              </button>
              {h.tag && (
                <span className={"rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide " + (tagColor[h.tag] ?? "bg-line-soft text-ink-soft")}>
                  {h.tag}
                </span>
              )}
              <button
                onClick={() => setShare(h.id)}
                className="ml-auto rounded-full border border-line bg-raised px-2.5 py-1 text-[12px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
              >
                Share clip
              </button>
            </div>
            <p className="text-[14.5px] font-medium leading-snug">{h.title}</p>
            {h.note && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{h.note}</p>}
          </li>
        ))}
      </ul>
      {share && (
        <ShareModal
          meeting={meeting}
          highlightId={share}
          onClose={() => setShare(null)}
        />
      )}
    </div>
  );
}

// ── Follow-up email ──────────────────────────────────────────────────────────
function EmailPanel({ meeting }: { meeting: Meeting }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(meeting.emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-ink-faint">Drafted the moment the call ended — paste-ready.</p>
        <button
          onClick={copy}
          className="rounded-full border border-line bg-raised px-3 py-1.5 text-[13px] font-medium hover:border-ink-soft"
        >
          {copied ? "Copied" : "Copy email"}
        </button>
      </div>
      <pre className="scrollpane max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line-soft bg-paper p-4 font-[family-name:var(--font-ui)] text-[13.5px] leading-relaxed text-ink-soft">
        {meeting.emailDraft}
      </pre>
    </div>
  );
}