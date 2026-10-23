import { notFound } from "next/navigation";
import { connection } from "next/server";
import { allMeetings, getMeeting } from "@/lib/data";
import { MeetingView } from "@/components/meeting/MeetingView";

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  // request-time render: `?t=` deep links read searchParams
  await connection();
  const { id } = await params;
  const { t } = await searchParams;
  const meeting = getMeeting(id);
  if (!meeting) notFound();
  const initialTime = t ? Math.max(0, Math.min(meeting.duration, Math.floor(Number(t) || 0))) : 0;
  return <MeetingView meeting={meeting} initialTime={initialTime} />;
}