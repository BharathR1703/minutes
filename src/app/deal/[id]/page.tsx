import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeal, getMeeting } from "@/lib/data";
import { SpeakingGraph } from "@/components/SpeakingGraph";
import { fmtDate, hms, mmss } from "@/lib/time";
import type { Deal, Meeting } from "@/lib/model";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) return { title: "Deal room" };
  return { title: `${deal.client} — deal room` };
}

// The deal room is request-time rendered like the rest of the app — one
// source of seeded calls, stitched together under a single client.
export default async function DealRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) notFound();
  const meetings = deal.meetingIds
    .map(getMeeting)
    .filter((m): m is Meeting => Boolean(m));

  // unified action items across every call in the deal
  const actions = meetings
    .flatMap((m) => m.actionItems.map((a) => ({ m, a })))
    .sort((x, y) => (x.a.due ?? "9999").localeCompare(y.a.due ?? "9999"));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      {/* ── header ─────────────────────────────────────────────────────── */}
      <p className="eyebrow mb-2">Deal room — every call, one client, one record</p>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight">
            {deal.client}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="rounded-full bg-ok-soft px-2.5 py-1 font-medium text-ok">
              {deal.stage}
            </span>
            <span className="rounded-full bg-line-soft px-2.5 py-1 text-ink-soft">
              {deal.value}
            </span>
            <span className="rounded-full bg-line-soft px-2.5 py-1 text-ink-soft">
              Champion · {deal.champion}
            </span>
          </div>
        </div>
        <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-faint">
          Stitched from {meetings.length} recorded call{meetings.length === 1 ? "" : "s"} —
          every risk and commitment links to the moment it was said.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ── left: brief · risks · calls ─────────────────────────────── */}
        <div className="min-w-0 space-y-8">
          <section aria-label="Deal brief">
            <h2 className="eyebrow mb-3">Deal brief</h2>
            <div className="pane p-5">
              <p className="font-[family-name:var(--font-display)] text-[17.5px] leading-relaxed tracking-tight text-ink">
                {deal.brief}
              </p>
              <p className="rule mt-4 pt-3 text-[13.5px]">
                <span className="font-medium">Next in this deal →</span>{" "}
                <span className="text-ink-soft">{deal.nextStep}</span>
              </p>
            </div>
          </section>

          <section aria-label="Risk tracker">
            <h2 className="eyebrow mb-3">Risk tracker</h2>
            <div className="pane divide-y divide-line-soft">
              {deal.risks.map((r) => (
                <RiskRow key={r.id} risk={r} meetings={meetings} />
              ))}
            </div>
          </section>

          <section aria-label="Calls in this deal">
            <h2 className="eyebrow mb-3">The calls</h2>
            <div className="pane divide-y divide-line-soft">
              {meetings.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.id}`}
                  className="group flex flex-wrap items-center gap-4 px-4 py-3.5 transition-colors hover:bg-line-soft/40"
                >
                  <div className="hidden w-40 md:block">
                    <SpeakingGraph meeting={m} height={26} className="h-[26px] w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-[family-name:var(--font-display)] text-[16px] font-medium tracking-tight group-hover:underline decoration-line-soft decoration-2 underline-offset-4">
                      {m.title}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">
                      {fmtDate(m.startedAt)} · {hms(m.duration)} ·{" "}
                      {m.actionItems.length} commitments, {" "}
                      {m.highlights.length} flagged moments
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] text-ink-faint group-hover:text-ink">
                    Open ↗
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ── right: unified action items ─────────────────────────────── */}
        <aside className="lg:sticky lg:top-[72px]">
          <section aria-label="Unified action items">
            <h2 className="eyebrow mb-3">Commitments across {meetings.length} calls</h2>
            <div className="pane divide-y divide-line-soft">
              {actions.map(({ m, a }) => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2 shrink-0 rounded-full"
                      style={{
                        background:
                          m.speakers.find((s) => s.name === a.ownerName)?.color ?? "#8e9095",
                      }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate text-[13px] font-medium">
                      {a.ownerName.startsWith("You") ? "You" : a.ownerName.split(" ")[0]}
                    </span>
                    <span className="shrink-0 text-[11.5px] text-ink-faint">
                      {a.due ? `due ${fmtDate(a.due)}` : "no due date"}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] leading-snug">{a.text}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-faint">
                    <Link
                      href={`/m/${m.id}?t=${a.cite}`}
                      className="rounded bg-record-soft px-1.5 py-px font-mono text-[10.5px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
                    >
                      {mmss(a.cite)}
                    </Link>
                    <span className="truncate">from {m.title}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-ink-faint">
              Dispatch, drafts and toasts live where each commitment was made — inside its call.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function RiskRow({ risk, meetings }: { risk: Deal["risks"][number]; meetings: Meeting[] }) {
  const meetingTitle = (mid: string) =>
    meetings.find((m) => m.id === mid)?.title.split("—")[0].trim();
  return (
    <div className="px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide " +
            (risk.severity === "risk" ? "bg-record-soft text-record" : "bg-line-soft text-ink-soft")
          }
        >
          {risk.severity}
        </span>
        <span className="text-[14.5px] font-medium">{risk.label}</span>
        <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] font-medium text-paper tabular-nums">
          {risk.cites.length}×
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{risk.note}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {risk.cites.map((c, i) => (
          <Link
            key={i}
            href={`/m/${c.meetingId}?t=${c.t}`}
            className="rounded bg-record-soft px-1.5 py-px font-mono text-[10.5px] font-medium text-record tabular-nums hover:bg-record hover:text-paper"
          >
            {mmss(c.t)}
            <span className="ml-1 font-[family-name:var(--font-ui)] text-[10px] opacity-70">
              {meetingTitle(c.meetingId)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}