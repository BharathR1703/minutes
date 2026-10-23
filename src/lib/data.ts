import type { Meeting, Utterance } from "@/lib/model";
import { MEETINGS, UPCOMING } from "@/lib/seed";

export function getMeeting(id: string): Meeting | undefined {
  return MEETINGS.find((m) => m.id === id);
}

export function allMeetings(): Meeting[] {
  return MEETINGS;
}

export function upcomingEvents() {
  return UPCOMING;
}

export function speakerOf(meeting: Meeting, id: string) {
  return meeting.speakers.find((s) => s.id === id);
}

/** Utterances active at time t (speaking graph buckets). */
export function speakersAt(meeting: Meeting, t: number): Utterance[] {
  return meeting.transcript.filter((u) => t >= u.t && t < u.t + u.dur);
}

export function utteranceAt(meeting: Meeting, t: number): number {
  // index of the utterance that contains t (or the last one before it)
  let lo = 0;
  const tr = meeting.transcript;
  while (lo < tr.length && tr[lo].t <= t) lo++;
  return Math.max(0, lo - 1);
}

export type SearchHit = {
  meetingId: string;
  meetingTitle: string;
  t: number;
  snippet: string; // matched text
  where: "transcript" | "summary" | "action";
  extra?: string; // e.g. speaker name
};

export function searchMeetings(q: string): SearchHit[] {
  const qLower = q.trim().toLowerCase();
  if (!qLower) return [];
  const terms = qLower.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];

  for (const m of MEETINGS) {
    // transcripts
    for (const u of m.transcript) {
      const l = u.text.toLowerCase();
      if (terms.every((t) => l.includes(t))) {
        const idx = l.indexOf(terms[0]);
        hits.push({
          meetingId: m.id,
          meetingTitle: m.title,
          t: u.t,
          snippet: u.text,
          where: "transcript",
          extra: m.speakers.find((s) => s.id === u.speaker)?.name,
        });
        void idx;
      }
    }
    // summaries
    for (const key of Object.keys(m.summaries)) {
      for (const sec of m.summaries[key].sections) {
        for (const b of sec.bullets) {
          const l = b.text.toLowerCase();
          if (terms.every((t) => l.includes(t))) {
            hits.push({
              meetingId: m.id,
              meetingTitle: m.title,
              t: b.cite,
              snippet: b.text,
              where: "summary",
              extra: sec.heading,
            });
          }
        }
      }
    }
    // action items
    for (const a of m.actionItems) {
      const l = (a.ownerName + " " + a.text).toLowerCase();
      if (terms.every((t) => l.includes(t))) {
        hits.push({
          meetingId: m.id,
          meetingTitle: m.title,
          t: a.cite,
          snippet: a.text,
          where: "action",
          extra: a.ownerName,
        });
      }
    }
  }
  return hits.slice(0, 60);
}