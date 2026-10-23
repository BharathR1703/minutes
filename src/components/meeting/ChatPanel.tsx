"use client";

import type { Meeting } from "@/lib/model";
import type { usePlayer } from "@/lib/player";
import { useEffect, useRef, useState } from "react";
import { mmss } from "@/lib/time";

/* ── answer synthesis ─────────────────────────────────────────────────────────
 * This build mocks the AI: answers are retrieved from the transcript, then
 * streamed token-by-token like a real model. Text and citation tokens
 * alternate, so citations land inline exactly where a model puts [04:23].
 * -------------------------------------------------------------------------- */

type Cite = { t: number };
type Token = { text: string } | { cite: Cite };

const STOP = new Set([
  "what","was","the","did","who","how","why","is","are","we","our","a","an","to","for","said",
  "about","think","when","of","on","in","with","that","this","they","their","have","has","and",
]);

function termsOf(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9% ]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function composeAnswer(meeting: Meeting, query: string, spName: (id: string) => string): Token[] {
  const terms = termsOf(query);
  if (terms.length === 0) {
    return [
      {
        text:
          "I need a few real words to search this call — try phrasing it the way someone said it, like a product name or a decision. Everything I answer is made of quotes you can play.",
      },
    ];
  }

  const scored = meeting.transcript
    .map((u) => ({
      u,
      score: terms.reduce((n, term) => n + (u.text.toLowerCase().includes(term) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.u.t - b.u.t);

  // action items that share terms get woven in
  const actions = meeting.actionItems.filter((a) =>
    terms.some(
      (term) => a.text.toLowerCase().includes(term) || a.ownerName.toLowerCase().includes(term)
    )
  );

  const summary = meeting.summaries[meeting.defaultTemplate];
  const bullets = (summary?.sections ?? [])
    .flatMap((s) => s.bullets)
    .filter((b) => terms.some((term) => b.text.toLowerCase().includes(term)))
    .slice(0, 1);

  const top = scored.slice(0, Math.min(3, scored.length));
  const tokens: Token[] = [];

  if (bullets.length > 0) {
    tokens.push({ text: bullets[0].text + " " });
    tokens.push({ cite: { t: bullets[0].cite } });
    if (top.length > 0) tokens.push({ text: "\n\nAnd in the caller's words:\n" });
  }

  if (top.length === 0) {
    tokens.push({
      text:
        "I couldn't find that in this call. Try words someone actually said, or use cross-meeting Search to look through every meeting at once.",
    });
    return tokens;
  }

  if (top.length === 1) {
    tokens.push({ text: `${spName(top[0].u.speaker)} said it directly:\n\n“${top[0].u.text}” ` });
    tokens.push({ cite: { t: top[0].u.t } });
  } else {
    if (bullets.length === 0) tokens.push({ text: "What was said, in the order it came up:\n" });
    top.forEach((s, j) => {
      tokens.push({ text: `${j > 0 ? "\n" : ""}· ${spName(s.u.speaker)}: “${s.u.text}” ` });
      tokens.push({ cite: { t: s.u.t } });
    });
  }

  if (actions.length > 0) {
    const a = actions[0];
    tokens.push({
      text: `\nThat turned into an action item: ${a.ownerName} — ${a.text}${a.due ? ` (due ${a.due})` : ""} `,
    });
    tokens.push({ cite: { t: a.cite } });
  }
  return tokens;
}

/* ── chat panel ─────────────────────────────────────────────────────────────── */

type Turn = {
  q: string;
  tokens: Token[];
  /** characters of the flattened token stream revealed so far */
  revealed: number;
  total: number;
};

function tokenChars(tk: Token): number {
  return "cite" in tk ? 6 : tk.text.length;
}

export function ChatPanel({
  meeting,
  player,
  className,
}: {
  meeting: Meeting;
  player: ReturnType<typeof usePlayer>;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const spName = (id: string) => meeting.speakers.find((s) => s.id === id)?.name ?? "Unknown";
  const last = turns[turns.length - 1];
  const busy = !!last && !turnDone(last);

  function ask(question: string) {
    const query = question.trim();
    if (!query || busy) return;
    const tokens = composeAnswer(meeting, query, spName);
    const total = tokens.reduce((n, tk) => n + tokenChars(tk), 0);
    setTurns((t) => [...t, { q: query, tokens, revealed: 0, total }]);
    setQ("");
  }

  // stream the newest turn
  useEffect(() => {
    const lastTurn = turns[turns.length - 1];
    if (!lastTurn || turnDone(lastTurn)) return;
    const timer = setInterval(() => {
      setTurns((ts) => {
        const l = ts[ts.length - 1];
        if (!l || turnDone(l)) return ts;
        const revealed = Math.min(l.total, l.revealed + 3);
        return [...ts.slice(0, -1), { ...l, revealed }];
      });
    }, 16);
    return () => clearInterval(timer);
  }, [turns]);

  // keep the stream pinned to the bottom
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns]);

  const suggestions =
    meeting.id === "q3-roadmap"
      ? ["What did we decide about pricing?", "Why is activation dropping?", "What does Maya own?"]
      : ["What did we commit to?", "Any risks mentioned?", "Who owns what?"];

  return (
    <div className={"flex h-full min-h-0 flex-col " + (className ?? "")}>
      <div ref={listRef} className="scrollpane min-h-0 flex-1 overflow-y-auto">
        {turns.length === 0 && (
          <div className="px-4 py-4">
            <p className="text-[12.5px] leading-relaxed text-ink-faint">
              Ask anything about this call in plain words. Nothing is invented — every answer is
              made of quotes you can play back.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-line bg-raised px-2.5 py-1 text-[12.5px] text-ink-soft hover:border-ink-soft hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <ul className="space-y-4 px-4 py-4">
          {turns.map((tn, i) => (
            <li key={i}>
              <p className="mb-1 rounded-lg bg-line-soft px-3 py-1.5 text-[13.5px] leading-relaxed text-ink">
                {tn.q}
              </p>
              <AnswerStream turn={tn} onSeek={player.seek} streaming={!turnDone(tn)} />
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex gap-2 border-t border-line px-3 py-3"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask this call…"
          aria-label="Ask this call"
          className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-[14px] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function turnDone(t: Turn): boolean {
  return t.revealed >= t.total;
}

/** Renders one turn's answer as it streams: text reveals left→right, citations become chips. */
function AnswerStream({
  turn,
  onSeek,
  streaming,
}: {
  turn: Turn;
  onSeek: (t: number) => void;
  streaming: boolean;
}) {
  const parts: React.ReactNode[] = [];
  let budget = turn.revealed;
  turn.tokens.forEach((tk, i) => {
    if ("cite" in tk) {
      if (budget >= tokenChars(tk)) {
        parts.push(
          <button
            key={i}
            onClick={() => onSeek(tk.cite.t)}
            aria-label={`Play from ${mmss(tk.cite.t)}`}
            className="mx-0.5 inline-block translate-y-[-1px] rounded bg-record-soft px-1 font-mono text-[11.5px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
          >
            [{mmss(tk.cite.t)}]
          </button>
        );
        budget -= tokenChars(tk);
      }
    } else {
      const shown = tk.text.slice(0, Math.max(0, budget));
      budget -= tk.text.length;
      if (shown.length === 0) return;
      parts.push(<span key={i}>{shown}</span>);
    }
  });

  return (
    <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-soft">
      {parts}
      {streaming && (
        <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-record align-text-bottom" />
      )}
    </p>
  );
}