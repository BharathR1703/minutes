import type { ActionItem, Highlight, Meeting, Summary, Utterance } from "@/lib/model";
import { AMI_RAW } from "./ami-raw";

/**
 * Imported real meetings: public AMI Meeting Corpus (edinburghcstr/ami,
 * ihm/test split, fetched via Hugging Face datasets-server — see
 * scripts/fetch-ami.mjs). Transcript is real; the corpus carries no calendar
 * dates, so the dates shown are labeled placeholders from the corpus year.
 *
 * Everything Minutes produces on top — summary, highlights, action items — is
 * heuristic extraction from the real transcript (this file), and every bullet
 * cites the exact utterance it came from. No invented facts.
 */

// hue pool for imported speakers (distinct from the seeded cast)
const COLORS = ["#4A6C8C", "#8A5A2B", "#5C6B34", "#6B4A6E", "#B4552D", "#5B5E6B", "#2F6E63", "#6E2F3A"];

const ACTION_RE = /\b(i'll|we'll|let's|i can|can you|could you|i need|we need|you should|i should|we should|i'm going|we're going|make sure|follow up|deal with|go ahead)\b/i;
const DECISION_RE = /\b(agreed|agreement|decision|decide|decided|we'll go with|let's go with|what we'll do|move to|confirm|settle)\b/i;
const RISK_RE = /\b(problem|issue|concern|worry|behind|delay|mistake|wrong|failed|error|breakable|danger)\b/i;
const QUESTION_RE = /\b(what if|how about|should we|can we|wonder|do you think|why don't)\b/i;
// filler-led turns aren't useful extractions
const FILLER_RE = /^(yeah|okay|yep|mm-hmm|uh|um|ah|oh|so)\b/i;

function sentenceCaseFragment(u: Utterance, words: number): string {
  const clean = u.text.replace(/^\W+/, "").replace(/\s+/g, " ").trim();
  const parts = clean.split(" ").slice(0, words).join(" ");
  return parts.charAt(0).toUpperCase() + parts.slice(1) + (words < clean.split(" ").length ? "…" : "");
}

/**
 * Extractive scoring: count how often each content word occurs across the
 * meeting; an utterance scores by the rarity-weighted density of its content
 * words. Used for gist/takeaway selection without any model call.
 */
function contentScores(utts: Utterance[]): Map<Utterance, number> {
  const STOP = new Set([
    "the","a","an","and","or","but","if","then","so","it","its","that","this","these","those","is","are","was","were","be","been","to","of","in","on","for","with","at","by","from","as","i","you","he","she","we","they","me","him","her","us","them","my","your","our","their","have","has","had","do","does","did","not","no","yes","yeah","okay","ok","well","just","like","know","think","gonna","would","could","should","can","will","shall","might","must","there","here","what","when","where","which","who","how","why",
  ]);
  const freq = new Map<string, number>();
  for (const u of utts) {
    for (const w of u.text.toLowerCase().split(/[^a-z']+/)) {
      if (w.length > 3 && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  const score = new Map<Utterance, number>();
  for (const u of utts) {
    const words = u.text.toLowerCase().split(/[^a-z']+/);
    let s = 0;
    for (const w of words) {
      if (w.length > 3 && !STOP.has(w)) s += 1 / (freq.get(w) ?? 1);
    }
    score.set(u, s / Math.sqrt(Math.max(4, words.length)));
  }
  return score;
}

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

    const scores = contentScores(utts);

    // ── action items: commitment-shaped utterances, one per speaker first ──
    const actionUtts = utts
      .map((u) => ({ u, hit: u.text.match(ACTION_RE)?.[0] }))
      .filter((x): x is { u: Utterance; hit: string } => !!x.hit && !FILLER_RE.test(x.u.text))
      .sort((a, b) => scores.get(b.u)! - scores.get(a.u)!);
    // ── action items: commitment-shaped utterances, at most two per speaker ──
    const perSpeaker = new Map<string, number>();
    const actionItems: ActionItem[] = [];
    for (const { u } of actionUtts) {
      if (actionItems.length >= 4) break;
      const soFar = perSpeaker.get(u.speaker) ?? 0;
      if (soFar >= 2) continue;
      perSpeaker.set(u.speaker, soFar + 1);
      actionItems.push({
        id: `ad-ami-${raw.id}-${actionItems.length}`,
        ownerName: nameOf(u.speaker),
        text: sentenceCaseFragment(u, 14),
        cite: u.t,
      });
    }

    // ── highlights: decision / risk / question shaped moments ──
    const highlights: Highlight[] = [];
    const tags: ["decision" | "risk" | "question" | "moment", RegExp][] = [
      ["decision", DECISION_RE],
      ["risk", RISK_RE],
      ["question", QUESTION_RE],
    ];
    for (const [tag, re] of tags) {
      const hits = utts
        .filter((u) => re.test(u.text) && !FILLER_RE.test(u.text) && u.text.split(" ").length >= 6)
        .sort((a, b) => scores.get(b)! - scores.get(a)!)
        .slice(0, 2);
      for (const u of hits) {
        if (highlights.length >= 5) break;
        highlights.push({
          id: `hd-ami-${raw.id}-${highlights.length}`,
          at: u.t,
          title: sentenceCaseFragment(u, 8),
          tag: tag === "moment" ? undefined : tag,
        });
      }
    }

    // ── summary: extractive — every bullet IS a transcript utterance (or a
    //    commitment line already cited above), so cites are exact by design ──
    const top = utts
      .filter((u) => !FILLER_RE.test(u.text) && u.text.split(" ").length >= 8)
      .sort((a, b) => scores.get(b)! - scores.get(a)!)
      .slice(0, 3)
      .sort((a, b) => a.t - b.t);

    const gist = top.length > 0
      ? top.slice(0, 2).map((u) => sentenceCaseFragment(u, 18)).join(" ")
      : `${utts.length} turns captured across ${speakerIds.length} speakers.`;

    const summary: Summary = {
      template: "standard",
      gist,
      sections: [
        {
          heading: "Extractive takeaways",
          bullets: top.map((u) => ({ text: sentenceCaseFragment(u, 16), cite: u.t })),
        },
        ...(actionItems.length
          ? [
              {
                heading: "Commitments made",
                bullets: actionItems.map((a) => ({ text: `${a.ownerName}: ${a.text}`, cite: a.cite })),
              },
            ]
          : []),
      ],
    };

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
      highlights: highlights.sort((a, b) => a.at - b.at),
      actionItems,
      summaries: { standard: summary },
      defaultTemplate: "standard",
      emailDraft,
    };
    return meeting;
  });
  return cache;
}