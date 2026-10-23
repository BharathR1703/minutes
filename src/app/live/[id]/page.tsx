import { notFound } from "next/navigation";
import { upcomingEvents, getMeeting } from "@/lib/data";
import { LiveCapture } from "@/components/live/LiveCapture";

export const metadata = { title: "Live capture" };

/**
 * Each armed calendar event maps to the meeting the capture will produce, so
 * the simulated session can end on the real, shareable artifact.
 */
const LIVE_SOURCE: Record<string, string> = {
  "up-1": "q3-roadmap",
  "up-2": "1on1-maya",
  "up-3": "sprint-24-retro",
};

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = upcomingEvents().find((u) => u.id === id);
  if (!event) notFound();
  const meeting = getMeeting(LIVE_SOURCE[id]);
  if (!meeting) notFound();
  return <LiveCapture event={event} meeting={meeting} />;
}