import Link from "next/link";
import { connection } from "next/server";
import { allMeetings, upcomingEvents } from "@/lib/data";
import { SpeakingGraph } from "@/components/SpeakingGraph";
import { dayBucket, fmtDate, fmtTime, hms } from "@/lib/time";
import type { Meeting, Upcoming } from "@/lib/model";

// day buckets ("Today"/"Yesterday") are relative to now, so render at request time
export default async function MeetingsPage() {
  await connection();
  const meetings = allMeetings();
  const upcoming = upcomingEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight">
            Your meetings
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Every call, transcribed and turned into moments you can click.{" "}
            <span className="text-ink-faint">
              Google Calendar connected — the notetaker handles what&rsquo;s next.
            </span>
          </p>
        </div>
        <Link
          href="/settings"
          className="hidden shrink-0 rounded-full border border-line bg-raised px-4 py-2 text-sm font-medium hover:border-ink-soft sm:block"
        >
          How Minutes joins your calls
        </Link>
      </div>

      <UpcomingSection upcoming={upcoming} />

      <section aria-label="Recorded meetings">
        {meetings.map((m) => (
          <MeetingRow key={m.id} id={m.id} bucket={dayBucket(m.startedAt)} inner={row(m)} />
        ))}
      </section>
    </div>
  );
}

function MeetingRow({
  id,
  bucket,
  inner,
}: {
  id: string;
  bucket: string;
  inner: React.ReactNode;
}) {
  return (
    <Link href={`/m/${id}`} className="block">
      <div className="group rule flex items-center gap-4 py-5 transition-colors first:pt-0 hover:bg-line-soft/40">
        <div className="w-16 shrink-0">
          <div className="font-[family-name:var(--font-display)] text-[13px] text-ink-soft">
            {bucket}
          </div>
        </div>
        {inner}
      </div>
    </Link>
  );
}

function row(m: Meeting) {
  const speakers = m.speakers.filter((s) => !s.self);
  const dots = speakers.slice(0, 6);
  const openTasks = m.actionItems.length;
  return (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h2 className="truncate font-[family-name:var(--font-display)] text-[19px] font-medium tracking-tight group-hover:underline decoration-line-soft decoration-2 underline-offset-4">
            {m.title}
          </h2>
          <span className="shrink-0 font-mono text-xs text-ink-faint tabular-nums">
            {fmtTime(m.startedAt)} · {hms(m.duration)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-soft">
          <span className="inline-flex -space-x-1.5" aria-hidden>
            {dots.map((s) => (
              <span
                key={s.id}
                title={s.name}
                className="inline-block size-2.5 rounded-full ring-2 ring-paper"
                style={{ background: s.color }}
              />
            ))}
          </span>
          <span className="truncate">
            {m.speakers.length === 1
              ? "solo test"
              : speakers.length + (m.speakers.length - 1 === speakers.length ? " speaker" : ` speakers`)}
          </span>
          <span aria-hidden>·</span>
          <span>{m.platform}</span>
          {m.captureMode === "bot-free" && (
            <>
              <span aria-hidden>·</span>
              <span className="text-ink-faint">bot-free capture</span>
            </>
          )}
        </div>
      </div>
      <div className="hidden w-52 shrink-0 md:block">
        <SpeakingGraph meeting={m} height={30} className="h-[30px] w-full" />
      </div>
      {openTasks > 0 && (
        <div className="hidden w-24 shrink-0 text-right text-[13px] text-ink-soft sm:block">
          {openTasks} task{openTasks === 1 ? "" : "s"}
        </div>
      )}
    </>
  );
}

function UpcomingSection({ upcoming }: { upcoming: Upcoming[] }) {
  if (upcoming.length === 0) return null;
  return (
    <section aria-label="Notetaker armed" className="mb-10">
      <h2 className="eyebrow mb-3">Armed — the notetaker will join</h2>
      <ul className="pane divide-y divide-line-soft">
        {upcoming.map((u) => (
          <li key={u.id} className="flex items-center gap-4 px-4 py-3">
            <span
              aria-hidden
              className="rec-dot size-2 rounded-full bg-record opacity-60"
            />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-[15px]">{u.title}</span>
              <span className="ml-2 text-[13px] text-ink-soft">
                {u.platform} · {fmtDate(u.startedAt)} {fmtTime(u.startedAt)}
              </span>
            </div>
            <div className="hidden -space-x-1.5 sm:flex" aria-label="attendees">
              {u.attendees.slice(0, 8).map((a, i) => (
                <span
                  key={i}
                  className="size-2.5 rounded-full ring-2 ring-raised"
                  style={{
                    background: a === "You" ? "#0E7C86" : "#c4c0b4",
                  }}
                />
              ))}
            </div>
            <span
              className={
                "rounded-full px-2.5 py-1 text-xs font-medium " +
                (u.captureMode === "bot"
                  ? "bg-line-soft text-ink-soft"
                  : "bg-ok-soft text-ok")
              }
            >
              {u.captureMode === "bot" ? "bot joins" : "bot-free capture"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] text-ink-faint">
        Three events pulled off your calendar automatically.{" "}
        <Link href="/settings" className="underline underline-offset-2 hover:text-ink">
          Change how Minutes joins
        </Link>
      </p>
    </section>
  );
}

