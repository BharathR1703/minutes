"use client";

import { clearDemo, demoEventUpcoming, loadDemoStore } from "@/lib/demo";
import { fmtDate, fmtTime, hms } from "@/lib/time";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Booked-in-this-browser sections of the meetings page: armed bookings join
 * the seeded armed list, recorded bookings form their own section. Rendered
 * client-side only — nothing here exists on the server.
 */

function useBooked() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? loadDemoStore() : { events: [], meetings: [] };
}

export function DemoArmedSection() {
  const booked = useBooked();
  const armed = booked.events.filter((e) => e.status === "armed");
  if (armed.length === 0) return null;
  return (
    <section aria-label="Booked in this browser" className="mb-10">
      <h2 className="eyebrow mb-3">Armed — booked in this browser</h2>
      <ul className="pane divide-y divide-line-soft">
        {armed.map((e) => {
          const u = demoEventUpcoming(e);
          return (
            <li key={e.id} className="flex items-center gap-4 px-4 py-3">
              <span aria-hidden className="rec-dot size-2 rounded-full bg-record opacity-60" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/live/${e.id}`}
                  className="text-[15px] font-medium hover:text-record hover:underline underline-offset-2"
                >
                  {e.spec.title}
                </Link>
                <span className="ml-2 text-[13px] text-ink-soft">
                  {e.spec.platform} · {fmtDate(u.startedAt)} {fmtTime(u.startedAt)}
                </span>
              </div>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs font-medium " +
                  (e.spec.captureMode === "bot" ? "bg-line-soft text-ink-soft" : "bg-ok-soft text-ok")
                }
              >
                {e.spec.captureMode === "bot" ? "bot joins" : "bot-free capture"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[13px] text-ink-faint">
        Booked here, so these stay in this browser only.
      </p>
    </section>
  );
}

export function DemoRecordedSection() {
  const booked = useBooked();
  if (booked.meetings.length === 0) return null;

  return (
    <section aria-label="Booked calls" className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="eyebrow">Booked calls — completed here</h2>
        <button
          onClick={() => clearDemo()}
          className="shrink-0 text-[12.5px] text-ink-faint underline underline-offset-2 hover:text-record"
        >
          Forget these (clears the browser store)
        </button>
      </div>
      <ul className="pane divide-y divide-line">
        {booked.meetings.map((m) => (
          <li key={m.id}>
            <Link href={`/m/${m.id}`} className="group flex items-center gap-4 px-4 py-3.5 hover:bg-line-soft/40">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-[family-name:var(--font-display)] text-[16.5px] font-medium tracking-tight group-hover:underline decoration-line-soft decoration-2 underline-offset-4">
                  {m.title}
                </h3>
                <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-ink-soft">
                  {fmtDate(m.startedAt)} {fmtTime(m.startedAt)} · {hms(m.duration)} ·{" "}
                  {m.actionItems.length} action item{m.actionItems.length === 1 ? "" : "s"} ·{" "}
                  {m.platform}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-ok-soft px-2.5 py-0.5 text-[11.5px] font-medium text-ok">
                {m.captureMode === "bot" ? "bot recorded" : "bot-free capture"}
              </span>
              <span className="hidden shrink-0 text-[13px] text-ink-faint group-hover:text-ink sm:block">
                Open ↗
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}