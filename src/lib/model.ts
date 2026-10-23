// Minutes — core data model.
// A meeting carries everything the product renders: speakers, the transcript,
// and every artifact that deep-links back to a moment (highlights, action
// items, summary sections, follow-up email draft).

export type Speaker = {
  id: string;
  name: string;
  /** hue used for the speaking graph and transcript labels */
  color: string;
  /** the signed-in user */
  self?: boolean;
};

export type Utterance = {
  /** seconds from recording start */
  t: number;
  /** seconds the utterance lasts (drives the speaking graph) */
  dur: number;
  speaker: string; // speaker id
  text: string;
};

export type Highlight = {
  id: string;
  at: number;
  title: string;
  note?: string;
  /** optional category chosen at capture time */
  tag?: "decision" | "question" | "action" | "moment" | "risk";
};

export type ActionItem = {
  id: string;
  ownerName: string;
  text: string;
  due?: string;
  cite: number; // Utterance t it was extracted from
  done?: boolean;
};

export type SummaryBullet = { text: string; cite: number };

export type Summary = {
  template: string;
  gist: string;
  sections: {
    heading: string;
    bullets: SummaryBullet[];
  }[];
};

export type Meeting = {
  id: string;
  title: string;
  platform: "Zoom" | "Google Meet" | "Microsoft Teams" | "In person";
  startedAt: string; // ISO
  duration: number; // seconds
  captureMode: "bot" | "bot-free";
  status: "recorded";
  speakers: Speaker[];
  transcript: Utterance[];
  highlights: Highlight[];
  actionItems: ActionItem[];
  summaries: Record<string, Summary>; // template id -> rendered summary
  defaultTemplate: string;
  emailDraft: string;
  /** available templates come from summaries' keys, ordered by templates order */
};

/** Events Minutes has read off the calendar but not recorded (yet). */
export type Upcoming = {
  id: string;
  title: string;
  platform: "Zoom" | "Google Meet" | "Microsoft Teams" | "In person";
  startedAt: string;
  attendees: string[]; // names (incl. self)
  captureMode: "bot" | "bot-free"; // how the notetaker will join this one
};