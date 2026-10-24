import type { ActionItem, Highlight, Summary, Utterance } from "@/lib/model";

/**
 * Minutes' extraction heuristics, shared by imported corpus meetings and
 * booked "own call" captures: given a transcript, produce the summary,
 * highlights and action items Minutes writes as the call ends. Every bullet
 * cites the exact utterance it came from; nothing is invented, which is why
 * the summary heading says "extractive".
 */

const ACTION_RE = /\b(i'll|we'll|let's|i can|can you|could you|i need|we need|you should|i should|we should|i'm going|we're going|make sure|follow up|deal with|go ahead)\b/i;
const DECISION_RE = /\b(agreed|agreement|decision|decide|decided|we'll go with|let's go with|what we'll do|move to|confirm|settle)\b/i;
const RISK_RE = /\b(problem|issue|concern|worry|behind|delay|mistake|wrong|failed|error|breakable|danger)\b/i;
const QUESTION_RE = /\b(what if|how about|should we|can we|wonder|do you think|why don't)\b/i;
// filler-led turns aren't useful extractions
const FILLER_RE = /^(yeah|okay|yep|mm-hmm|uh|um|ah|oh|so)\b/i;

export function fragment(u: Utterance, words: number): string {
  const clean = u.text.replace(/^\W+/, "").replace(/\s+/g, " ").trim();
  const parts = clean.split(" ").slice(0, words).join(" ");
  return parts.charAt(0).toUpperCase() + parts.slice(1) + (words < clean.split(" ").length ? "…" : "");
}

/**
 * Extractive scoring: count how often each content word occurs across the
 * meeting; an utterance scores by the rarity-weighted density of its content
 * words. Used for gist/takeaway selection without any model call.
 */
export function contentScores(utts: Utterance[]): Map<Utterance, number> {
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

export function extractArtifacts(
  utts: Utterance[],
  opts: { idPrefix: string; nameOf: (sid: string) => string },
): { highlights: Highlight[]; actionItems: ActionItem[]; summary: Summary } {
  const scores = contentScores(utts);

  // action items: commitment-shaped utterances, at most two per speaker
  const actionUtts = utts
    .filter((u) => ACTION_RE.test(u.text) && !FILLER_RE.test(u.text))
    .sort((a, b) => scores.get(b)! - scores.get(a)!);
  const perSpeaker = new Map<string, number>();
  const actionItems: ActionItem[] = [];
  for (const u of actionUtts) {
    if (actionItems.length >= 4) break;
    const soFar = perSpeaker.get(u.speaker) ?? 0;
    if (soFar >= 2) continue;
    perSpeaker.set(u.speaker, soFar + 1);
    actionItems.push({
      id: `ad-${opts.idPrefix}-${actionItems.length}`,
      ownerName: opts.nameOf(u.speaker),
      text: fragment(u, 14),
      cite: u.t,
    });
  }

  // highlights: decision / risk / question shaped moments
  const highlights: Highlight[] = [];
  const tags: ["decision" | "risk" | "question", RegExp][] = [
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
        id: `hd-${opts.idPrefix}-${highlights.length}`,
        at: u.t,
        title: fragment(u, 8),
        tag: tag === "question" ? "question" : tag,
      });
    }
  }

  // summary: extractive — every bullet IS a transcript utterance, so cites are exact
  const top = utts
    .filter((u) => !FILLER_RE.test(u.text) && u.text.split(" ").length >= 8)
    .sort((a, b) => scores.get(b)! - scores.get(a)!)
    .slice(0, 3)
    .sort((a, b) => a.t - b.t);

  const summary: Summary = {
    template: "standard",
    gist:
      top.length > 0
        ? top.slice(0, 2).map((u) => fragment(u, 18)).join(" ")
        : `${utts.length} turns captured across ${new Set(utts.map((u) => u.speaker)).size} speakers.`,
    sections: [
      {
        heading: "Extractive takeaways",
        bullets: top.map((u) => ({ text: fragment(u, 16), cite: u.t })),
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

  return { highlights: highlights.sort((a, b) => a.at - b.at), actionItems, summary };
}