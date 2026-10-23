"use client";

import type { Meeting } from "@/lib/model";
import type { usePlayer } from "@/lib/player";
import { useState } from "react";
import { mmss } from "@/lib/time";

type Entry = {
  q: string;
  answer: string;
  cites: { t: number; text: string; who: string; color: string }[];
};

const STOP = new Set(["what", "was", "the", "did", "who", "how", "why", "is", "are", "we", "our", "a", "an", "to", "for", "said", "about", "decide", "decided", "think", "when", "of", "on", "in", "with", "@"]);

/**
 * "Ask this call" — retrieval over the transcript. Every claim in the answer is
 * a citation chip that jumps the recording to the exact moment, which is the
 * feature this build refuses to hide behind a paywall.
 */
export function AskPanel({
  meeting,
  player,
}: {
  meeting: Meeting;
  player: ReturnType<typeof usePlayer>;
}) {
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);

  function ask(qu: string) {
    const query = qu.trim();
    if (!query || busy) return;
    setBusy(true);
    // retrieval: score utterances by term overlap
    const terms = query
      .toLowerCase()
      .replace(/[^a-z0-9% ]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w));
    const scored = meeting.transcript
      .map((u) => {
        const l = u.text.toLowerCase();
        let score = 0;
        for (const term of terms) if (l.includes(term)) score += 1;
        return { u, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const sp = (id: string) => meeting.speakers.find((s) => s.id === id);
    setTimeout(() => {
      if (scored.length === 0) {
        setEntries((e) => [
          ...e,
          {
            q: query,
            answer:
              "Nothing in this call matches that. Try a phrase someone actually said — or switch to cross-meeting Search, which reads every call.",
            cites: [],
          },
        ]);
      } else {
        const answer =
          "Here's what was said, closest first:" +
          scored
            .map((s) => ` ${s.u.text}`)
            .join("")
            .replace(/\. /g, ". ")
            .slice(0, 0); // answer is rendered as the citation list itself
        void answer;
        setEntries((e) => [
          ...e,
          {
            q: query,
            answer: scored.length > 1 ? "What was said, closest first — every line plays from where it was said:" : "What was said — it plays from that moment:",
            cites: scored.map((s) => ({
              t: s.u.t,
              text: s.u.text,
              who: sp(s.u.speaker)?.name ?? "Unknown",
              color: sp(s.u.speaker)?.color ?? "#888",
            })),
          },
        ]);
      }
      setBusy(false);
      setQ("");
    }, 350);
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-ink-faint">
        Ask anything about this call in plain words. Answers are retrieved from the transcript — nothing is generated that can&rsquo;t be played back.
      </p>

      {entries.length > 0 && (
        <ul className="mb-4 space-y-4">
          {entries.map((en, i) => (
            <li key={i}>
              <p className="mb-1.5 text-[13.5px] font-semibold">{en.q}</p>
              <p className="mb-2 text-[13.5px] text-ink-soft">{en.answer}</p>
              <ul className="space-y-2">
                {en.cites.map((c, j) => (
                  <li key={j} className="flex gap-2.5 rounded-lg border border-line-soft bg-paper px-3 py-2">
                    <button
                      onClick={() => player.seek(c.t)}
                      className="mt-px h-fit shrink-0 rounded bg-record-soft px-1.5 py-px font-mono text-[11px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
                    >
                      {mmss(c.t)}
                    </button>
                    <p className="text-[13.5px] leading-snug text-ink-soft">
                      <span className="font-semibold" style={{ color: c.color }}>
                        {c.who}
                      </span>
                      <span className="mx-1 text-line">—</span>
                      {c.text}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            meeting.id === "q3-roadmap"
              ? "e.g. what did we decide about pricing?"
              : "Ask about what was said…"
          }
          className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-[14px] focus:outline-none"
          aria-label="Ask this call"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Looking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}