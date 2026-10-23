import { searchMeetings, getMeeting } from "@/lib/data";
import { fmtDate, mmss } from "@/lib/time";
import Link from "next/link";

export const metadata = { title: "Search every call" };

const EXAMPLES = ["pricing", "churn", "Dennis", "follow up", "latency"];

/** Cross-meeting search: one query over every transcript, summary and action item. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const hits = query ? searchMeetings(query) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
        Search every call
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-soft">
        One query across all transcripts, summaries and action items — every result plays the
        moment it came from.
      </p>

      <form
        action="/search"
        method="get"
        role="search"
        className="mt-5 flex max-w-xl gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search everything said…"
          aria-label="Search meetings"
          className="min-w-0 flex-1 rounded-full border border-line bg-raised px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus-visible:outline focus-visible:outline-record"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
        >
          Search
        </button>
      </form>

      {!query && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-[13px] text-ink-faint">Try:</span>
          {EXAMPLES.map((ex) => (
            <Link
              key={ex}
              href={`/search?q=${encodeURIComponent(ex)}`}
              className="rounded-full border border-line bg-raised px-3 py-1 text-[13px] text-ink-soft hover:border-ink-soft hover:text-ink"
            >
              {ex}
            </Link>
          ))}
        </div>
      )}

      {query && (
        <>
          <p className="mt-6 text-[13px] text-ink-faint">
            {hits.length} {hits.length === 1 ? "result" : "results"} for{" "}
            <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span>
          </p>
          <ul className="mt-3 divide-y divide-line-soft border-y border-line-soft">
            {hits.map((h, i) => {
              const m = getMeeting(h.meetingId);
              return (
              <li key={i}>
                <Link
                  href={`/m/${h.meetingId}?t=${h.t}`}
                  className="group flex gap-4 py-3.5 hover:bg-raised/60"
                >
                  <span className="mt-0.5 shrink-0 rounded bg-record-soft px-1.5 py-px font-mono text-[11px] font-medium text-record tabular-nums">
                    {mmss(h.t)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14.5px] leading-snug text-ink">{h.snippet}</p>
                    <p className="mt-1 text-[12.5px] text-ink-faint">
                      {m ? fmtDate(m.startedAt) : ""}
                      <span className="mx-1.5 text-line">|</span>
                      {h.where === "transcript" ? "said by" : h.where === "action" ? "owned by" : ""}
                      <span className="font-medium text-ink-soft"> {h.extra}</span>
                      <span className="mx-1.5 text-line">|</span>
                      {h.where === "summary" ? "in your summary" : h.where === "action" ? "action item" : "transcript"}
                    </p>
                  </div>
                  <span className="ml-auto self-center text-line group-hover:text-ink-soft">→</span>
                </Link>
              </li>
              );
            })}
          </ul>
          {hits.length === 0 && (
            <div className="mt-4 rounded-lg border border-line-soft bg-raised px-4 py-3 text-[13.5px] text-ink-soft">
              Nothing matches. Search is exact-word matching for now — try fewer or shorter words.
            </div>
          )}
        </>
      )}
    </div>
  );
}