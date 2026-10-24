"use client";

import { getDemoMeeting } from "@/lib/demo";
import { MeetingView } from "@/components/meeting/MeetingView";
import Link from "next/link";
import { useEffect, useState } from "react";

/** `/m/<id>` for a call booked in this browser — same view as any seeded call. */
export function LocalMeetingView({ id }: { id: string }) {
  const [state, setState] = useState<"loading" | "missing">("loading");
  const [meeting, setMeeting] = useState<null | Parameters<typeof MeetingView>[0]["meeting"]>(null);

  useEffect(() => {
    const m = getDemoMeeting(id);
    if (m) setMeeting(m);
    else setState("missing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (meeting) return <MeetingView meeting={meeting} initialTime={0} />;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-14">
      <div className="pane p-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium">Meeting not found</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          This call isn&rsquo;t in the seeded meetings, and nothing is booked under this address
          in this browser.
          {state === "loading" ? "" : " If you booked it here, run its capture first."}
        </p>
        <div className="mt-4 flex gap-4">
          <Link
            href="/book"
            className="rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper hover:opacity-90"
          >
            Book a call
          </Link>
          <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
            Back to meetings
          </Link>
        </div>
      </div>
    </div>
  );
}