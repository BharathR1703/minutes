import type { Meeting, Speaker, Summary } from "@/lib/model";
import { builder } from "./builder";

const S: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "dana", name: "Dana Reyes (Ridgeline)", color: "#8C4A73" },
  { id: "marc", name: "Marc Dubois (Ridgeline)", color: "#44546A" },
];

const b = builder();
const T = b.built;
const at = (sub: string) => {
  const u = T().find((x) => x.text.includes(sub));
  if (!u) throw new Error(`no utterance matching: ${sub}`);
  return u.t;
};

// Discovery call with a mid-market prospect. Deliberately rendered in two
// templates to show template switching on a sales-shaped call.
b.say("you", " Dana, Marc — thanks for making time. I know you're mid-rollout on something else, so I'll try to keep this to twenty-five minutes.");
b.say("dana", " Appreciate that. So quick context: Ridgeline runs food distribution for about 400 independent grocers. My ops team lives in meetings with warehouse managers, and we estimate a third of what gets decided in those calls never makes it into a ticket.");
b.say("you", " What happens to the rest of it?");
b.say("marc", " It lives in someone's notebook. If we're lucky the same person owns the route that day.");
b.say("you", " So walk me into a typical Monday call. Warehouse manager, district lead, what does the output look like today?");
b.say("dana", " A call, then Marc writes a summary by hand, then it goes into Slack and someone makes tasks from it. Two to three people-hours per team per week, and it still depends on the mood Marc is in.");
b.say("marc", " It's true. Friday afternoons I write meeting notes like it's 2014.");
b.say("you", " And what's the failure mode when it doesn't get written?");
b.say("dana", " Disputes. 'You said Thursday.' 'No I said the following Thursday.' We keep transcripts of exactly this kind of thing because it costs real money — we had a misrouted pallet situation in March that was literally a misheard date.");
b.gap(20);
b.say("you", " Okay, so Success means: every ops call produces decisions and tasks without Marc doing transcription. What does the first week of the eval look like for you?");
b.say("marc", " Honestly if I just stop writing Friday notes, we've won. The summary quality question is: can it tell a decision from chatter?");
b.say("you", " That's the part we should pressure-test together — I'd rather run that trial on five real calls than answer it from a slide. On pricing, you're 14 seats-ish today?");
b.say("dana", " Twelve ops, six if we add the supply team. Something per-seat.");
b.say("you", " Yes — flat per seat, annual, team-wide. No metering.");
b.say("marc", " And the security review, that's procurement's favorite game.");
b.say("you", " SOC 2 Type II, recordings encrypted at rest, you can set retention. I'll send the security packet with the recap.");
b.say("dana", " Good. Marc, thoughts before we lock the eval?");
b.say("marc", " The only thing I'd change: give a couple warehouse managers the app, not just ops. If the tasks go out without their input they'll distrust it on sight.");
b.say("you", " That's a good addition — warehouse leads in the eval group. Then here's what I heard as the plan…");
b.gap(15);
b.say("you", " Five real Monday calls this coming week, Minutes on every one, Marc stops handwriting on Friday. Warehouse leads included. Check-in next Thursday, decision on rollout after that.");
b.say("dana", " That works. Send the recap with the security packet.");
b.say("you", " It'll be in your inbox in two minutes. Talk Thursday.");

export const salesMeeting: Meeting = {
  id: "ridgeline-discovery",
  title: "Discovery — Ridgeline Foods",
  platform: "Google Meet",
  startedAt: "2026-10-17T14:30:00Z",
  duration: b.end + 25,
  captureMode: "bot",
  status: "recorded",
  speakers: S,
  transcript: b.built(),
  highlights: [
    {
      id: "h-sa-1",
      at: at("misheard date"),
      title: "Compelling event: the March pallet misroute — a misheard date",
      tag: "moment",
      note: "Use this clip in the follow-up. It's why they want a transcript.",
    },
    {
      id: "h-sa-2",
      at: at("if I just stop writing Friday notes"),
      title: "Success criteria: Marc stops handwriting Friday notes",
      tag: "decision",
    },
    {
      id: "h-sa-3",
      at: at("warehouse managers the app, not just ops"),
      title: "Marc's addition: warehouse leads must be in the eval",
      tag: "risk",
      note: "Adoption risk — tasks going out without their input.",
    },
  ],
  actionItems: [
    {
      id: "a-sa-1",
      ownerName: "You",
      text: "Send recap + security packet to Dana",
      due: "2026-10-17",
      cite: at("Send the recap with the security packet"),
    },
    {
      id: "a-sa-2",
      ownerName: "You",
      text: "Set up eval workspace with warehouse leads included",
      due: "2026-10-20",
      cite: at("warehouse managers the app, not just ops"),
    },
    {
      id: "a-sa-3",
      ownerName: "Dana Reyes (Ridgeline)",
      text: "Nominate five Monday ops calls for the eval week",
      due: "2026-10-20",
      cite: at("Five real Monday calls this coming week"),
    },
  ],
  summaries: {},
  defaultTemplate: "spiced",
  emailDraft: "",
};

// SPICED is the shipped sales template; Standard gets derived sections below.
export const spicedSummary: Summary = {
  template: "spiced",
  gist: "Ridgeline Foods loses a third of ops-call decisions because outcomes live in hand-written notes. They'll run five real Monday calls through Minutes this week, with warehouse leads included, and decide on rollout Thursday.",
  sections: [
    {
      heading: "Situation",
      bullets: [
        {
          text: "400 independent grocers; ops team meets warehouse managers weekly.",
          cite: at("runs food distribution for about 400"),
        },
        {
          text: "Marc writes all call summaries by hand — 2–3 people-hours per team per week.",
          cite: at("A call, then Marc writes a summary by hand"),
        },
      ],
    },
    {
      heading: "Pain",
      bullets: [
        {
          text: "\"You said Thursday\" disputes — a misheard date caused a misrouted pallet in March.",
          cite: at("misheard date"),
        },
        {
          text: "Decision capture depends on Marc actually writing notes on Fridays.",
          cite: at("depends on the mood Marc is in"),
        },
      ],
    },
    {
      heading: "Impact",
      bullets: [
        {
          text: "Kill the Friday handwriting ritual first; summary quality measured on real calls, not slides.",
          cite: at("if I just stop writing Friday notes"),
        },
      ],
    },
    {
      heading: "Critical event",
      bullets: [
        {
          text: "Five eval calls next week, warehouse leads included; rollout decision Thursday after.",
          cite: at("Five real Monday calls this coming week"),
        },
      ],
    },
    {
      heading: "Decision next",
      bullets: [
        {
          text: "12 ops seats now, +6 supply team later; flat annual per-seat, no metering.",
          cite: at("Twelve ops, six if we add the supply team"),
        },
        {
          text: "Security packet (SOC 2 II, retention controls) goes with the recap.",
          cite: at("I'll send the security packet with the recap"),
        },
      ],
    },
  ],
};

export const salesStandardSummary: Summary = {
  template: "standard",
  gist: spicedSummary.gist,
  sections: [
    {
      heading: "Topics discussed",
      bullets: [
        { text: "Ridgeline's ops calls lose about a third of decisions to hand-written notes.", cite: at("never makes it into a ticket") },
        { text: "March misroute incident traced to a misheard date — they keep wanting a reliable transcript.", cite: at("misheard date") },
        { text: "Pricing: 12–18 seats, flat annual per-seat with no metering; SOC 2 packet requested.", cite: at("Twelve ops, six if we add the supply team") },
      ],
    },
    {
      heading: "Key takeaways",
      bullets: [
        { text: "Success = Marc stops writing Friday notes; quality check is live, on five real calls.", cite: at("if I just stop writing Friday notes") },
        { text: "Warehouse managers must be in the eval or they'll distrust it on sight.", cite: at("warehouse managers the app, not just ops") },
      ],
    },
    {
      heading: "Next steps",
      bullets: [
        { text: "Recap + security packet sent from this call; eval workspace ready Monday.", cite: at("Send the recap with the security packet") },
        { text: "Thursday check-in; rollout decision follows the eval week.", cite: at("decision on rollout after that") },
      ],
    },
  ],
};