import type { Meeting } from "@/lib/model";
import { extractArtifacts } from "@/lib/extract";
import { AMI_RAW } from "./ami-raw";

/**
 * Imported real meetings: public AMI Meeting Corpus (edinburghcstr/ami,
 * ihm/test split, fetched via Hugging Face datasets-server — see
 * scripts/fetch-ami.mjs). Transcript is real; the corpus carries no calendar
 * dates, so the dates shown are labeled placeholders from the corpus year.
 *
 * Everything Minutes produces on top — summary, highlights, action items — is
 * heuristic extraction from the real transcript (shared @/lib/extract), and
 * every bullet cites the exact utterance it came from. No invented facts.
 */

// hue pool for imported speakers (distinct from the seeded cast)
const COLORS = ["#4A6C8C", "#8A5A2B", "#5C6B34", "#6B4A6E", "#B4552D", "#5B5E6B", "#2F6E63", "#6E2F3A"];

let cache: Meeting[] | null = null;

export function amiMeetings(): Meeting[] {
  if (cache) return cache;
  cache = AMI_RAW.map((raw) => {
    const utts = raw.utterances;
    const speakerIds = [...new Set(utts.map((u) => u.speaker))];
    const speakers = speakerIds.map((id, i) => ({
      id,
      name: id, // dataset speaker ids, shown as-is
      color: COLORS[i % COLORS.length],
    }));
    const nameOf = (sid: string) => speakers.find((s) => s.id === sid)?.name ?? sid;
    const duration = Math.max(...utts.map((u) => u.t + u.dur)) + 5;

    const { highlights, actionItems, summary } = extractArtifacts(utts, {
      idPrefix: `ami-${raw.id}`,
      nameOf,
    });

    const gist = summary.gist;

    const emailDraft = [
      "Hi all —",
      "",
      `Recap of AMI ${raw.id} (real corpus meeting):`,
      "",
      gist,
      "",
      ...(actionItems.length
        ? ["Action items:", "", ...actionItems.map((a) => `- ${a.text} (${a.ownerName})`), ""]
        : []),
      "Transcript imported from the public AMI Meeting Corpus; recap extracted heuristically from the transcript.",
      "— Sent from Minutes",
    ].join("\n");

    const meeting: Meeting = {
      id: `ami-${raw.id.toLowerCase()}`,
      title: `AMI ${(raw.id).toUpperCase()} — imported corpus call`,
      platform: "In person",
      startedAt: raw.meetingDate,
      duration,
      captureMode: "bot-free",
      status: "recorded",
      speakers,
      transcript: utts,
      highlights,
      actionItems,
      summaries: { standard: summary },
      defaultTemplate: "standard",
      emailDraft,
    };
    return meeting;
  });
  return cache;
}