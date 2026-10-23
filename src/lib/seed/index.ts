import type { Meeting, Summary } from "@/lib/model";
import { roadmapMeeting } from "./roadmap";
import { soloMeeting } from "./solo";
import { salesMeeting, spicedSummary, salesStandardSummary } from "./sales";
import { interviewMeeting } from "./interview";
import { oneOnOneMeeting, retroMeeting, churnMeeting, upcomingCalendar } from "./team";
import { builder } from "./builder";
import { MEETING_TEMPLATES } from "@/lib/templates";

const atIn = (transcript: ReturnType<ReturnType<typeof builder>["built"]>, sub: string) => {
  const u = transcript.find((x) => x.text.includes(sub));
  if (!u) throw new Error(`no utterance matching: ${sub}`);
  return u.t;
};

// ── Roadmap summaries (Standard + Project update) ───────────────────────────
const roadmapT = roadmapMeeting.transcript;
const roadmapStandard: Summary = {
  template: "standard",
  gist: "Three Q3 bets got real owners. The onboarding revamp moves ahead next sprint, semantic search stays a beta with GA pushed to Nov 12, and the usage-based pricing experiment is killed. Rhea's activation data anchored everything: 44% of new users never invite a second person.",
  sections: [
    {
      heading: "Topics discussed",
      bullets: [
        { text: "Activation dropped four points in Q2, concentrated in week one.", cite: atIn(roadmapT, "activation dropped four points") },
        { text: "The funnel cliff is day three — 44% never invite a second person.", cite: atIn(roadmapT, "cliff is day three") },
        { text: "Onboarding revamp: no team space until invite; hi-fis Wednesday, build next sprint.", cite: atIn(roadmapT, "hi-fi mockups of the activation flow") },
        { text: "Search: internal + design-partner beta late Oct, GA target Nov 12.", cite: atIn(roadmapT, "General availability") },
        { text: "Usage-based pricing killed — net negative with billing complexity.", cite: atIn(roadmapT, "usage-based pricing is dead") },
        { text: "Chloe's CS snag: workspace admin reassignment is missing.", cite: atIn(roadmapT, "The cheap version is maybe two days") },
      ],
    },
    {
      heading: "Key takeaways",
      bullets: [
        { text: "Manage three disappointed prospects rather than launch a broken search engine.", cite: atIn(roadmapT, "disappointed prospects") },
        { text: "Sales gets search demos on the ten pilot workspaces only.", cite: atIn(roadmapT, "On the ten pilot workspaces, yes") },
        { text: "Annual commitment pricing replaces usage-based, pending Rhea's cohort revenue pull.", cite: atIn(roadmapT, "price the annual tiers properly") },
      ],
    },
    {
      heading: "Decisions made",
      bullets: [
        { text: "Search beta only this quarter; GA depends on the 85% eval bar.", cite: atIn(roadmapT, "eval clears 85") },
        { text: "Usage-based pricing is dead.", cite: atIn(roadmapT, "usage-based pricing is dead") },
        { text: "Admin reassignment ships as a two-day hack after workspace scoping.", cite: atIn(roadmapT, "Take the two-day version") },
      ],
    },
    {
      heading: "Your questions",
      bullets: [
        { text: "\"Timeline?\" — put to Maya on the design work.", cite: atIn(roadmapT, "Timeline?") },
        { text: "\"What's the middle ground?\" — on the search delay.", cite: atIn(roadmapT, "What's the middle ground") },
      ],
    },
  ],
};

const roadmapProject: Summary = {
  template: "project-update",
  gist: "Onboarding revamp: on track, design Wed / build next sprint. Search: replanned to beta-only this quarter, GA Nov 12. Pricing: usage-based killed; annual tiers being rebuilt on cohort data. Risk: workspace scoping depends on Dennis freeing up from search.",
  sections: [
    {
      heading: "Onboarding revamp — on track",
      bullets: [
        { text: "Owner Maya, hi-fi mockups Wednesday; Sam starts build next sprint with Dennis after infra.", cite: atIn(roadmapT, "Call it two and a half weeks") },
        { text: "Tom needs the new flow to demo itself — one screen, zero configuration.", cite: atIn(roadmapT, "that's gone, I need the new flow to demo itself") },
      ],
    },
    {
      heading: "Semantic search — replanned",
      bullets: [
        { text: "Retrieval at 71%, GA bar is 85% — ships as beta to internal + 10 design partners.", cite: atIn(roadmapT, "six from a shippable thing") },
        { text: "GA target Nov 12; Jonas brings the date in writing.", cite: atIn(roadmapT, "brings me the date in writing") },
      ],
    },
    {
      heading: "Pricing — decided",
      bullets: [
        { text: "Usage-based dead; annual commitment pricing by team size.", cite: atIn(roadmapT, "Annual commitment pricing") },
        { text: "Rhea's cohort pull due before the pricing page changes.", cite: atIn(roadmapT, "needs to happen before the pricing page") },
      ],
    },
    {
      heading: "Risks & dependencies",
      bullets: [
        { text: "Dennis freed from search is a soft dependency for Sam's workspace work.", cite: atIn(roadmapT, "Dennis being freed by search") },
        { text: "44% activation cliff is the metric this whole plan leans on.", cite: atIn(roadmapT, "never invite a second person") },
      ],
    },
  ],
};

// ── Remaining summaries ──────────────────────────────────────────────────────
const interviewT = interviewMeeting.transcript;
const interviewSummary: Summary = {
  template: "interview",
  gist: "Lena presented a load-shaped ingestion redesign (sharded consumers, bounded retries) with real numbers and a clear account of what she'd do differently. Recommendation: proceed to the systems-design round with Jonas.",
  sections: [
    {
      heading: "Strengths observed",
      bullets: [
        { text: "Owns her misses unprompted — challenged her own earlier fix order.", cite: atIn(interviewT, "challenge the thirty-second flush") },
        { text: "Correct-by-routing instinct on ordering, arrived at fast.", cite: atIn(interviewT, "Correctness by routing") },
        { text: "Cost-awareness in design decisions (spot capacity, measured 4%).", cite: atIn(interviewT, "under two hundred dollars a month") },
      ],
    },
    {
      heading: "Probe and assess",
      bullets: [
        { text: "Ask harder on cross-shard failure modes in the design round.", cite: atIn(interviewT, "how you'd order events across shards") },
      ],
    },
    {
      heading: "Candidate's questions",
      bullets: [
        { text: "On-call burden split between recording infra and product.", cite: atIn(interviewT, "on-call burden is the recording infra") },
        { text: "Ratio of new surfaces vs. hardening existing ones.", cite: atIn(interviewT, "ratio of new surfaces") },
      ],
    },
    {
      heading: "Next step",
      bullets: [{ text: "Systems-design round with Jonas; references after.", cite: atIn(interviewT, "systems-design round with Jonas") }],
    },
  ],
};

const oneOnOneT = oneOnOneMeeting.transcript;
const oneOnOneSummary: Summary = {
  template: "one-on-one",
  gist: "Maya is stuck redrawing an activation screen — her own read is that she's designing a checklist, not the moment. Wednesday becomes a research day with session recordings, mockups due after. Also handled: on-call slot preference.",
  sections: [
    {
      heading: "What's going well",
      bullets: [{ text: "Sequencing idea for activation is solid; crit slot Friday agreed.", cite: atIn(oneOnOneT, "sequencing idea is solid") }],
    },
    {
      heading: "What's in the way",
      bullets: [
        { text: "\"Designing the checklist instead of the moment\" — four redraws.", cite: atIn(oneOnOneT, "checklist instead of the moment") },
        { text: "Would rather not be first in on-call rotation.", cite: atIn(oneOnOneT, "rather not be first in the rotation") },
      ],
    },
    {
      heading: "Agreed actions",
      bullets: [
        { text: "Wed = session recordings day, evidence deck after; Sam gets the opening on-call slot.", cite: atIn(oneOnOneT, "two of those recordings into your deck") },
      ],
    },
  ],
};

const retroT = retroMeeting.transcript;
const retroSummary: Summary = {
  template: "retro",
  gist: "What worked: spec-first (rework down), demo Fridays, pairing blocks. What hurt: weekend deploys with no escalation owner, and the same API conventions re-litigated in review. Three experiments going into next sprint.",
  sections: [
    {
      heading: "Keep doing",
      bullets: [
        { text: "Spec-first piloted — rework dropped.", cite: atIn(retroT, "went through written specs and rework dropped") },
        { text: "Demo Fridays — two customers asked into the next beta.", cite: atIn(retroT, "asked to be in the next beta") },
        { text: "Pairing — permissions went twice as fast the second half.", cite: atIn(retroT, "twice as fast the second half") },
      ],
    },
    {
      heading: "Fix",
      bullets: [
        { text: "Staging-red has no weekend owner — add an escalation rotation.", cite: atIn(retroT, "has no owner on weekends") },
        { text: "Publish the API conventions doc; review against it.", cite: atIn(retroT, "has been a draft since August") },
      ],
    },
    {
      heading: "Experiments next sprint",
      bullets: [
        { text: "Published API doc for reviews, weekend escalation rotation, one pairing block with Dennis.", cite: atIn(retroT, "one deliberate pairing block") },
      ],
    },
  ],
};

const churnT = churnMeeting.transcript;
const churnSummary: Summary = {
  template: "standard",
  gist: "Helmar Clinic: transcripts of family-intake meetings are genuinely working. Two gaps — workspace admin transfer (they couldn't seat four new clinicians) and an invented action item attributed to a doctor. Citations per task go out next release.",
  sections: [
    {
      heading: "Topics discussed",
      bullets: [
        { text: "Admin who set up the workspace left in August; no one can add clinicians.", cite: atIn(churnT, "left in August") },
        { text: "A follow-up task was attributed to a doctor who never said it.", cite: atIn(churnT, "doctor who said no such thing") },
      ],
    },
    {
      heading: "Key takeaways",
      bullets: [
        { text: "\"One invented task is one too many\" — extraction needs to be verifiable.", cite: atIn(churnT, "one invented task is one too many") },
        { text: "Chloe's manual seat-adds are a stopgap, not a fix.", cite: atIn(churnT, "add people manually on my side") },
      ],
    },
    {
      heading: "Next steps",
      bullets: [
        { text: "Chloe traces the Sept call today; P1 citation request filed.", cite: atIn(churnT, "trace the summary line to the transcript") },
        { text: "Per-task citations ship next release; admin reassignment within two weeks.", cite: atIn(churnT, "within two weeks") },
      ],
    },
  ],
};

const soloT = soloMeeting.transcript;
const soloSummary: Summary = {
  template: "standard",
  gist: "Two-minute pipeline test — capture, highlights and summarizing all verified. All three checks passed; review the recording before the 17:00 team sync.",
  sections: [
    {
      heading: "Checks run",
      bullets: [
        { text: "Transcription — this sentence appears verbatim in the transcript.", cite: atIn(soloT, "Hello, pipeline") },
        { text: "Highlights — a decision-tagged moment saved mid-call.", cite: atIn(soloT, "tagging this moment as a decision") },
        { text: "Summary — produced after the call with action items.", cite: atIn(soloT, "review this test recording") },
      ],
    },
    {
      heading: "Next steps",
      bullets: [{ text: "Review this recording before the team sync.", cite: atIn(soloT, "before tomorrow's team sync") }],
    },
  ],
};

// ── Email drafts (shown verbatim in the follow-up panel) ─────────────────────
function emailDraft(m: Meeting, summary: Summary): string {
  const when = new Date(m.startedAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const lines = [
    `Hi all —`,
    ``,
    `Quick recap of ${m.title.toLowerCase()} from ${when}:`,
    ``,
    summary.gist,
    ``,
  ];
  if (m.actionItems.length) {
    lines.push(`Action items:`, ``);
    for (const a of m.actionItems.slice(0, 4)) {
      lines.push(`- ${a.text} (${a.ownerName})`);
    }
    lines.push(``);
  }
  lines.push(
    `Recording and full transcript: https://minutes.app/m/${m.id}#t=${summary.sections[0]?.bullets[0]?.cite ?? 0}`,
    ``,
    `Anything I got wrong or missed, reply to this note.`,
    `— Sent from Minutes`
  );
  return lines.join("\n");
}

// assemble meetings with their summaries + drafts
const meetings: Meeting[] = (
  [
    {
      ...roadmapMeeting,
      summaries: {
        standard: roadmapStandard,
        "project-update": roadmapProject,
      },
    },
    { ...soloMeeting, summaries: { standard: soloSummary } },
    {
      ...salesMeeting,
      summaries: { spiced: spicedSummary, standard: salesStandardSummary },
    },
    { ...interviewMeeting, summaries: { interview: interviewSummary } },
    { ...oneOnOneMeeting, summaries: { "one-on-one": oneOnOneSummary } },
    { ...retroMeeting, summaries: { retro: retroSummary } },
    { ...churnMeeting, summaries: { standard: churnSummary } },
  ] as Meeting[]
).map((m) => ({
  ...m,
  emailDraft: emailDraft(m, m.summaries[m.defaultTemplate]),
}));

export const MEETINGS: Meeting[] = meetings.sort(
  (a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)
);

export const UPCOMING = upcomingCalendar;