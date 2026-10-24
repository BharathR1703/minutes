import { notFound } from "next/navigation";
import { upcomingEvents, getMeeting } from "@/lib/data";
import { LiveCapture } from "@/components/live/LiveCapture";
import { LocalLiveCapture } from "@/components/demo/LocalLiveCapture";

export const metadata = { title: "Live capture" };

/**
 * Each armed calendar event maps to the meeting the capture will produce, so
 * the simulated session can end on the real, shareable artifact. Booked-in-
 * browser calls ("demo-…") find theirs on the client instead.
 */
const LIVE_SOURCE: Record<string, string> = {
  "up-1": "q3-roadmap",
  "up-2": "1on1-maya",
  "up-3": "sprint-24-retro",
};

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.startsWith("demo-")) return <LocalLiveCapture id={id} />;
  const event = upcomingEvents().find((u) => u.id === id);
  if (!event) notFound();
  const meeting = getMeeting(LIVE_SOURCE[id]);
  if (!meeting) notFound();
  return <LiveCapture event={event} meeting={meeting} />;
}