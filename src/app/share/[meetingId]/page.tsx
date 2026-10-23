import { getMeeting } from "@/lib/data";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ClipPlayer } from "@/components/share/ClipPlayer";
import { fmtDate } from "@/lib/time";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ meetingId: string }>;
  searchParams: Promise<{ h?: string }>;
}) {
  const { meetingId } = await params;
  const { h } = await searchParams;
  const m = getMeeting(meetingId);
  const hl = m?.highlights.find((x) => x.id === h);
  return {
    title: hl ? `${hl.title} — a clip from ${m!.title}` : `A clip from ${m?.title ?? "a meeting"}`,
    description: hl ? `${fmtDate(m!.startedAt)} · shared via Minutes` : "Shared via Minutes",
  };
}

/** A clip page is served to people who were never on the call — no account, no other meetings. */
export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ meetingId: string }>;
  searchParams: Promise<{ h?: string }>;
}) {
  await connection();
  const { meetingId } = await params;
  const { h: highlightId } = await searchParams;
  const meeting = getMeeting(meetingId);
  if (!meeting) notFound();
  const hl = meeting.highlights.find((x) => x.id === highlightId);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <p className="mb-8 text-right text-[13px] text-ink-soft">A clip was shared with you</p>

      {hl ? (
        <article>
          <p className="eyebrow mb-2">
            {fmtDate(meeting.startedAt)} · {fmtClipLen(hl)}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium leading-tight tracking-tight">
            {hl.title}
          </h1>
          {hl.note && <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{hl.note}</p>}
          <div className="mt-6">
            <ClipPlayer meeting={meeting} start={hl.at} length={30} />
          </div>
          <p className="mt-8 rounded-lg border border-line-soft bg-raised px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            This clip is all you can see — the rest of the meeting stays with{" "}
            {meeting.speakers.filter((s) => s.self).at(0)?.name ?? "the host"}
            . Recording and full transcript are available to people who were on the call.
          </p>
        </article>
      ) : (
        <p className="text-ink-faint">This clip link is missing or was revoked.</p>
      )}

      <footer className="mt-10 border-t border-line pt-4 text-[12px] text-ink-faint">
        Synthesized audio bed — this demo build stubs the capture layer (see the walkthrough).
      </footer>
    </div>
  );
}

function fmtClipLen(hl: { at: number }): string {
  return `starts ${Math.floor(hl.at / 60)}:${String(Math.floor(hl.at % 60)).padStart(2, "0")}`;
}