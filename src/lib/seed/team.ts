import type { Meeting, Speaker } from "@/lib/model";
import { builder } from "./builder";
import { daysAgo, dueIn, daysAhead } from "./dates";

const oneOnOneAt = daysAgo(16, 9, 30);
const retroAt = daysAgo(18, 16, 0);
const churnAt = daysAgo(22, 11, 0);

// ── 1:1 — Maya & You ─────────────────────────────────────────────────────────
const S11: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "maya", name: "Maya Lindqvist", color: "#5C6B34" },
];

const b1 = builder();
{
  const T = b1.built;
  const at1 = (sub: string) => {
    const u = T().find((x) => x.text.includes(sub));
    if (!u) throw new Error(`no utterance matching: ${sub}`);
    return u.t;
  };
  b1.say("you", " How's the activation work landing? You had two weeks on it.");
  b1.say("maya", " The sequencing idea is solid, but I've redrawn the activation screen four times. Something's off and I can't name it yet.");
  b1.say("you", " What's the working theory?");
  b1.say("maya", " Everything looks right and still feels like a form. I might be designing the checklist instead of the moment.");
  b1.say("you", " That's a good sentence — design the moment people invite a friend, not a configuration screen.");
  b1.say("maya", " Can I take Wednesday off the mockups to just sit with five session recordings from the funnel?");
  b1.say("you", " Yes. In fact that's the assignment — mockups Wednesday, and put two of those recordings into your deck. I'd rather see evidence than screens.");
  b1.say("maya", " Okay, that actually relieves something. Mockups Wednesday with receipts.");
  b1.say("you", " One more thing while we have ten minutes — the roadmap call. You'll present design in the core group Wednesday, and there's a Friday crit for everyone. You okay presenting both?");
  b1.say("maya", " The crit nervousness is real, but yes. If the recordings say what I think they say, the story will be short.");
  b1.say("you", " Then that's the plan. Anything from your side — I know the on-call reshuffle touched you?");
  b1.say("maya", " Just that I'd rather not be first in the rotation. Give Sam the opening slot and I'll take one after.");
  b1.say("you", " Consider it done. Good session.");
}

export const oneOnOneMeeting: Meeting = {
  id: "1on1-maya",
  title: "1:1 — Maya",
  platform: "Microsoft Teams",
  startedAt: oneOnOneAt,
  duration: b1.end + 20,
  captureMode: "bot-free",
  status: "recorded",
  speakers: S11,
  transcript: b1.built(),
  highlights: [
    {
      id: "h-oo-1",
      at: (() => {
        const u = b1.built().find((x) => x.text.includes("designing the checklist instead of the moment"));
        return u ? u.t : 0;
      })(),
      title: "Maya: \"I might be designing the checklist instead of the moment\"",
      tag: "moment",
      note: "This sentence should go in the design crit deck.",
    },
  ],
  actionItems: [
    {
      id: "a-oo-1",
      ownerName: "Maya Lindqvist",
      text: "Review five funnel session recordings; mockups Wednesday with two recordings in the deck",
      due: dueIn(oneOnOneAt, 20),
      cite: (() => {
        const u = b1.built().find((x) => x.text.includes("sit with five session recordings"));
        return u ? u.t : 0;
      })(),
    },
    {
      id: "a-oo-2",
      ownerName: "You",
      text: "On-call rotation: give Sam the opening slot, Maya after",
      due: dueIn(oneOnOneAt, 4),
      cite: (() => {
        const u = b1.built().find((x) => x.text.includes("Give Sam the opening slot"));
        return u ? u.t : 0;
      })(),
    },
  ],
  summaries: {},
  defaultTemplate: "one-on-one",
  emailDraft: "",
};

// ── Sprint retro ─────────────────────────────────────────────────────────────
const SR: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "sam", name: "Sam Okafor", color: "#7D4CB2" },
  { id: "priya", name: "Priya Natarajan", color: "#8C4A73" },
  { id: "jonas", name: "Jonas Weber", color: "#B4552D" },
];

const b2 = builder();
{
  const T = b2.built;
  const at2 = (sub: string) => {
    const u = T().find((x) => x.text.includes(sub));
    if (!u) throw new Error(`no utterance matching: ${sub}`);
    return u.t;
  };
  b2.say("you", " Sprint 24 retro. Format: what worked, what hurt, one experiment for next sprint. Priya starts.");
  b2.say("priya", " Worked: the spec-first experiment we piloted. Two features went through written specs and rework dropped. Hurt: the Tuesday deploy freeze collided with the customer demo. Someone deploys Friday morning and then we spend Tuesday apologizing.");
  b2.say("sam", " That was me, and I own it — I shipped a hotfix Friday because staging was red and I didn't escalate.");
  b2.say("jonas", " The process gap is that 'staging red' has no owner on weekends. Let's give the rotation an explicit escalation channel instead of blaming the person.");
  b2.say("you", " Agreed — the fix is a weekend escalation rotation, not a heroic Monday explanation. What else hurt?");
  b2.say("sam", " The permissions change took three review rounds. Each round was a full day. We keep re-litigating the same conventions.");
  b2.say("jonas", " Then let's write the conventions down — the API shape doc has been a draft since August.");
  b2.say("you", " Experiment for next sprint: I'll take the API conventions doc from draft to published, and we review against it instead of arguing taste. What worked besides specs?");
  b2.say("priya", " Demo Fridays are sticking. Three customers watched last week's demo and two asked to be in the next beta.");
  b2.say("sam", " I'd also keep the pairing session from Wednesday. The permissions work went twice as fast the second half because Dennis and I paired.");
  b2.say("you", " Good. Experiments for next sprint then: published API doc for reviews, weekend escalation rotation, and one deliberate pairing block on anything with Dennis.");
}

export const retroMeeting: Meeting = {
  id: "sprint-24-retro",
  title: "Sprint 24 retro",
  platform: "Google Meet",
  startedAt: retroAt,
  duration: b2.end + 20,
  captureMode: "bot",
  status: "recorded",
  speakers: SR,
  transcript: b2.built(),
  highlights: [
    {
      id: "h-re-1",
      at: (() => {
        const u = b2.built().find((x) => x.text.includes("staging red' has no owner"));
        return u ? u.t : 0;
      })(),
      title: "Process fix: weekend escalation rotation instead of heroic deploys",
      tag: "decision",
    },
  ],
  actionItems: [
    {
      id: "a-re-1",
      ownerName: "You",
      text: "Publish the API conventions doc (from draft) and review against it next sprint",
      due: dueIn(retroAt, 7),
      cite: (() => {
        const u = b2.built().find((x) => x.text.includes("API conventions doc from draft to published") || x.text.includes("from draft to published"));
        return u ? u.t : 0;
      })(),
    },
    {
      id: "a-re-2",
      ownerName: "Jonas Weber",
      text: "Set up weekend escalation rotation",
      due: dueIn(retroAt, 4),
      cite: (() => {
        const u = b2.built().find((x) => x.text.includes("give the rotation an explicit escalation channel"));
        return u ? u.t : 0;
      })(),
    },
    {
      id: "a-re-3",
      ownerName: "Sam Okafor",
      text: "One deliberate pairing block with Dennis next sprint",
      due: dueIn(retroAt, 7),
      cite: (() => {
        const u = b2.built().find((x) => x.text.includes("one deliberate pairing block"));
        return u ? u.t : 0;
      })(),
    },
  ],
  summaries: {},
  defaultTemplate: "retro",
  emailDraft: "",
};

// ── Customer success check-in ────────────────────────────────────────────────
const SC: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "helmar", name: "Dr. Amara Osei (Helmar)", color: "#A2751B" },
  { id: "chloe", name: "Chloe Kim", color: "#B23A68" },
];

const b3 = builder();
{
  const T = b3.built;
  const at3 = (sub: string) => {
    const u = T().find((x) => x.text.includes(sub));
    if (!u) throw new Error(`no utterance matching: ${sub}`);
    return u.t;
  };
  b3.say("you", " Dr. Osei, Chloe from our support team is joining us. You renewed last month and flagged a couple of things, so let's hear them.");
  b3.say("helmar", " Well, first, our intake meetings — the ones with the families — those transcripts have genuinely changed how we document. That part works. The problem is the admin who set up our workspace left in August, and since then nobody at Helmar can add a clinician.");
  b3.say("chloe", " We hit that with you last Tuesday — it's an ownership transfer flow we don't have yet. In the meantime I can add people manually on my side. I should say that out loud.");
  b3.say("helmar", " And I appreciate the manual help, but we interviewed four candidates over September and I couldn't get any of them into the workspace — you had to set them up one by one.");
  b3.say("you", " That's on us, and it's fixed within two weeks — there's an admin reassignment coming, and the full transfer flow this quarter. I'll put the date in writing in the recap.");
  b3.say("helmar", " Okay. Second thing, and this is the one that matters clinically: the summary sometimes invents the action items. Last week we had a follow-up that attributed a task to a doctor who said no such thing.");
  b3.say("you", " That's the most serious thing anyone's said to me this month. Chloe, can we pull that call this afternoon?");
  b3.say("chloe", " Yes — I have the recording reference. We'll trace the summary line to the transcript and see how it was extracted.");
  b3.say("helmar", " I want to be fair: most summaries are right. But with families' follow-ups, one invented task is one too many. We need to see where the task came from.");
  b3.say("you", " You will — next release every extracted task carries a citation into the recording, so you can click it and check the moment yourself. If we can't prove it, it shouldn't be a task at all.");
  b3.say("helmar", " If you ship that, I'm a believer.");
  b3.say("chloe", " I'll trace this call today and report back this week, and the citation feature request is going in as P1.");
}

export const churnMeeting: Meeting = {
  id: "helmar-checkin",
  title: "CS check-in — Helmar Clinic",
  platform: "Google Meet",
  startedAt: churnAt,
  duration: b3.end + 20,
  captureMode: "bot",
  status: "recorded",
  speakers: SC,
  transcript: b3.built(),
  highlights: [
    {
      id: "h-ch-1",
      at: (() => {
        const u = b3.built().find((x) => x.text.includes("invented the action items") || x.text.includes("invent"));
        return u ? u.t : 0;
      })(),
      title: "Helmar hit a fabricated action item attributed to a doctor",
      tag: "risk",
      note: "The trust problem — this is why citations ship next release.",
    },
  ],
  actionItems: [
    {
      id: "a-ch-1",
      ownerName: "Chloe Kim",
      text: "Trace the invented task on Helmar's Sept call; report this week; file citation feature as P1",
      due: dueIn(churnAt, 5),
      cite: (() => {
        const u = b3.built().find((x) => x.text.includes("trace the summary line"));
        return u ? u.t : 0;
      })(),
    },
    {
      id: "a-ch-2",
      ownerName: "You",
      text: "Ship per-task citations next release; put admin reassignment date in writing",
      due: dueIn(churnAt, 29),
      cite: (() => {
        const u = b3.built().find((x) => x.text.includes("every extracted task carries a citation"));
        return u ? u.t : 0;
      })(),
    },
  ],
  summaries: {},
  defaultTemplate: "standard",
  emailDraft: "",
};

export const upcomingCalendar = [
  {
    id: "up-1",
    title: "Product roadmap — Q3 bets",
    platform: "Zoom" as const,
    startedAt: daysAhead(0, 17, 0),
    attendees: ["You", "Priya", "Jonas", "Maya", "Sam", "Rhea", "Tom", "Chloe"],
    captureMode: "bot" as const,
  },
  {
    id: "up-2",
    title: "1:1 — Maya",
    platform: "Microsoft Teams" as const,
    startedAt: daysAhead(1, 14, 0),
    attendees: ["You", "Maya"],
    captureMode: "bot-free" as const,
  },
  {
    id: "up-3",
    title: "Sprint 24 retro",
    platform: "Google Meet" as const,
    startedAt: daysAhead(3, 10, 30),
    attendees: ["You", "Priya", "Sam", "Jonas"],
    captureMode: "bot" as const,
  },
];