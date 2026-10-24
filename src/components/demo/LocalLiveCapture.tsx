"use client";

import { composeMeeting, demoEventUpcoming, loadDemoStore, recordBooking, speakersOf } from "@/lib/demo";
import { LiveCapture } from "@/components/live/LiveCapture";
import { OwnCapture } from "@/components/demo/OwnCapture";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Capture simulation for a call booked in this browser — the booking's spec
 * lives in localStorage. Scripted calls replay their walkthrough; "your own"
 * calls hand control to the scribe composer (OwnCapture). Both record the
 * meeting when the simulated call ends.
 */
export function LocalLiveCapture({ id }: { id: string }) {
  const [state, setState] = useState<"loading" | "found" | "missing">("loading");
  const [ev, setEv] = useState<ReturnType<typeof loadDemoStore>["events"][number] | null>(null);

  useEffect(() => {
    const found = loadDemoStore().events.find((e) => e.id === id);
    if (found) {
      setEv(found);
      setState("found");
    } else {
      setState("missing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state === "missing")
    return (
      <div className="mx-auto max-w-3xl px-4 pt-14">
        <div className="pane p-6">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium">
            This booking isn&rsquo;t in this browser
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
            Booked calls live in the browser that booked them (this build has no database).{" "}
            <Link href="/book" className="underline underline-offset-2">
              Book this one here
            </Link>{" "}
            and the capture run will follow.
          </p>
          <Link href="/" className="mt-4 inline-block text-[13.5px] text-ink-soft hover:text-ink">
            Back to meetings
          </Link>
        </div>
      </div>
    );

  if (state !== "found" || !ev) return null;

  if (ev.spec.script === "blank")
    return (
      <OwnCapture
        booking={ev}
        speakers={speakersOf(ev.spec)}
        onDone={(feeds) => recordBooking(ev.id, feeds)}
      />
    );

  return (
    <LiveCapture
      event={demoEventUpcoming(ev)}
      meeting={composeMeeting(ev.spec, ev.id)}
      onDone={() => recordBooking(ev.id)}
    />
  );
}