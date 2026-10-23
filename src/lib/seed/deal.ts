import type { Deal, Meeting, Speaker, Summary } from "@/lib/model";
import type { RiskCite } from "@/lib/model";
import { builder } from "./builder";
import { salesAt } from "./sales";

// ── Eval check-in — the call the discovery meeting set up ────────────────────
// Discovery (Oct 17) promised: five real Monday calls through Minutes, a
// check-in the following Thursday. This is that check-in, eight days later.
// The deal room at /deal/ridgeline-foods aggregates both calls.

const S: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "dana", name: "Dana Reyes (Ridgeline)", color: "#8C4A73" },
  { id: "marc", name: "Marc Dubois (Ridgeline)", color: "#44546A" },
  { id: "tosh", name: "Tosh Okafor (Ridgeline)", color: "#7A6A2F" },
];

const b = builder();
const at = (sub: string) => {
  const u = b.built().find((x) => x.text.includes(sub));
  if (!u) throw new Error(`no utterance matching: ${sub}`);
  return u.t;
};

b.say("you", " Dana, Marc — and Tosh, good, you in the room is exactly what I asked for. Five calls, one week. Let's take it call by call.");
b.say("dana", " Quick frame before Tosh goes: this is the eval we set up last Friday. All five Monday ops calls ran through Minutes, Marc hands-off, warehouse leads in the app like you agreed.");
b.say("marc", " Then let me start with my favorite fact: on Friday I didn't write notes. I didn't write notes, Dana. I read the summary, ticked it against what I remembered, pushed it to Slack. Ten minutes.");
b.say("dana", " And the disputes line — zero since Tuesday. Two \"you said Thursday\" arguments a week before this. This week, nothing, because both sides just play the clip.");
b.say("you", " Where did it not work? I'd rather hear that from the room than from a dashboard.");
b.say("tosh", " Route 4 didn't open the app until Wednesday. Tasks were landing with the district lead's name and no quote behind them — my people don't take direction from nowhere.");
b.say("you", " That's the feedback we build against. Every task in Minutes carries the moment it came from — you tap it, the call plays from that second, the quote is there.");
b.say("tosh", " Which is what saved it, to be fair. Wednesday I sat with two leads and played the clip of Marc committing to the pallet audit. Once it was Marc's voice and not a robot memo, they were in. Route 4's at eleven tasks this morning.");
b.gap(18);
b.say("dana", " Full transparency before Thursday: procurement keeps a Loopnote file from last spring's demo. They'll ask us for a comparison.");
b.say("you", " They should — do it on real calls, not a staged demo. That's the one pitch I'd make to your procurement team.");
b.say("marc", " I saw Loopnote's demo summary last spring. It read beautifully on a staged call. Our calls are three dialects and a forklift alarm in the background — staged doesn't survive that.");
b.say("tosh", " We piloted Loopnote on one route last year. It lasted two weeks — the crew couldn't tell a task from a memo.");
b.say("dana", " So Thursday the 29th, the rollout decision: twelve ops seats now, six supply later if the pilot holds. Bring the plan to that call and procurement gets the comparison sheet.");
b.say("you", " You'll have the plan Monday. Rollout phased: ops first — dispatch, task feed, clips — supply team in after the pilot holds. And I'll attach the security packet procurement already has coming.");
b.say("marc", " One condition carried over from Friday: when we expand, warehouse leads get the app before the supply team does. They earned it this week.");
b.say("dana", " Agreed. Tosh, last word?");
b.say("tosh", " Keep the clips. The crew watches those more than anything we've ever sent them.");

const checkin: Meeting = {
  id: "ridgeline-checkin",
  title: "Eval check-in — Ridgeline Foods",
  platform: "Google Meet",
  startedAt: "2026-10-22T15:00:00Z",
  duration: b.end + 15,
  captureMode: "bot",
  status: "recorded",
  speakers: S,
  transcript: b.built(),
  highlights: [
    {
      id: "h-dl-1",
      at: at("on Friday I didn't write notes"),
      title: "Success metric hit: Marc stopped handwriting Friday notes",
      tag: "decision",
      note: "This was the eval's core goal — ten minutes instead of two hours.",
    },
    {
      id: "h-dl-2",
      at: at("didn't open the app until Wednesday"),
      title: "Adoption wobble: Route 4 distrusted tasks without quotes",
      tag: "risk",
      note: "Fixed by playing the moment back — this is why every task cites.",
    },
    {
      id: "h-dl-3",
      at: at("keeps a Loopnote file"),
      title: "Procurement holds a Loopnote file — comparison requested",
      tag: "moment",
      note: "Bring the side-by-side to Thursday's decision call.",
    },
  ],
  actionItems: [
    {
      id: "a-dl-1",
      ownerName: "You",
      text: "Draft the phased rollout plan (12 ops seats, supply team deferred) for Thursday's decision call",
      due: "2026-10-26",
      cite: at("You'll have the plan Monday"),
    },
    {
      id: "a-dl-2",
      ownerName: "Tosh Okafor (Ridgeline)",
      text: "Run lead pairing sessions on Route 4 before Thursday's standup",
      due: "2026-10-28",
      cite: at("sat with two leads and played the clip"),
    },
    {
      id: "a-dl-3",
      ownerName: "Dana Reyes (Ridgeline)",
      text: "Send procurement the Loopnote comparison sheet",
      due: "2026-10-27",
      cite: at("procurement gets the comparison sheet"),
    },
    {
      id: "a-dl-4",
      ownerName: "Marc Dubois (Ridgeline)",
      text: "Tick the five Monday summaries against his own before forwarding",
      due: "2026-10-24",
      cite: at("ticked it against what I remembered"),
    },
  ],
  summaries: {},
  defaultTemplate: "spiced",
  emailDraft: "",
};

// SPICED, as a mid-eval check-in renders it
export const checkinSpiced: Summary = {
  template: "spiced",
  gist: "Ridgeline's eval week held: Marc stopped handwriting Friday notes, dispute arguments fell to zero, and Route 4 adopted once tasks carried playable quotes. Procurement holds a Loopnote file — demo-comparison requested for Thursday's Oct 29 rollout decision (12 ops seats, supply deferred).",
  sections: [
    {
      heading: "Situation",
      bullets: [
        {
          text: "Five Monday ops calls ran through Minutes, Marc hands-off, warehouse leads in the app.",
          cite: at("All five Monday ops calls ran through Minutes"),
        },
        {
          text: "Tosh Okafor (Route 4 warehouse) joined this check-in — the eval's field voice.",
          cite: at("you in the room is exactly what I asked for"),
        },
      ],
    },
    {
      heading: "Pain addressed",
      bullets: [
        {
          text: "Friday notes handwriting was the eval's core success metric — hit at ten minutes per week.",
          cite: at("I didn't write notes, Dana"),
        },
        {
          text: "\"You said Thursday\" disputes fell to zero since Tuesday; both sides play the clip instead.",
          cite: at("zero since Tuesday"),
        },
      ],
    },
    {
      heading: "Impact",
      bullets: [
        {
          text: "Route 4 at eleven tasks by Wednesday morning after clips carried Marc's voice to the crew.",
          cite: at("Route 4's at eleven tasks this morning"),
        },
      ],
    },
    {
      heading: "Critical event",
      bullets: [
        {
          text: "Rollout decision Thursday Oct 29: 12 ops seats now, 6 supply later, procurement gets the comparison.",
          cite: at("Thursday the 29th, the rollout decision"),
        },
      ],
    },
    {
      heading: "Decision next",
      bullets: [
        {
          text: "Rollout phased ops-first; warehouse leads get the app before the supply team does.",
          cite: at("warehouse leads get the app before the supply team"),
        },
      ],
    },
  ],
};

export const checkinStandard: Summary = {
  template: "standard",
  gist: checkinSpiced.gist,
  sections: [
    {
      heading: "Topics discussed",
      bullets: [
        { text: "Eval week ran clean: five calls, Marc hands-off, warehouse leads active in the app.", cite: at("All five Monday ops calls ran through Minutes") },
        { text: "Route 4 wobble: crew distrusted tasks without quotes; solved by playing the moment.", cite: at("didn't open the app until Wednesday") },
        { text: "Loopnote history: procurement file from last spring, a failed route pilot last year.", cite: at("piloted Loopnote on one route last year") },
      ],
    },
    {
      heading: "Key takeaways",
      bullets: [
        { text: "Citations are the adoption story — \"it's Marc's voice, not a robot memo\" closed Route 4.", cite: at("not a robot memo, they were in") },
        { text: "Clips are the one artifact the warehouse crew actually watches.", cite: at("Keep the clips") },
      ],
    },
    {
      heading: "Next steps",
      bullets: [
        { text: "Phased rollout plan due Monday for the Oct 29 decision call.", cite: at("You'll have the plan Monday") },
        { text: "Procurement receives the Loopnote comparison sheet Wednesday.", cite: at("procurement gets the comparison sheet") },
      ],
    },
  ],
};

// ── The deal: one client, many calls ─────────────────────────────────────────

function ct(meetingId: string, sub: string): RiskCite {
  return { meetingId, t: at(sub) };
}

export const ridgelineDeal: Deal = {
  id: "ridgeline-foods",
  client: "Ridgeline Foods",
  stage: "Eval done — decision Oct 29",
  value: "$21,600 est. ACV (18 seats)",
  champion: "Dana Reyes (Ridgeline)",
  closeTarget: "2026-10-29",
  brief:
    "Ridgeline Foods distributes for 400 independent grocers, and a third of what their ops calls decide never reaches a ticket — outcomes live in Marc's Friday notebook. The Oct 17 discovery set up an eval on real Monday calls; the Oct 22 check-in says it held: Marc is hands-off, dispute arguments are at zero, and Route 4's warehouse crew adopted once tasks carried playable quotes. Procurement keeps a Loopnote file from last spring and will ask for a side-by-side. Decision call Thursday Oct 29: 12 ops seats now, 6 supply later, phased ops-first.",
  nextStep: "Rollout decision — Thursday Oct 29 with Dana, Marc and procurement",
  risks: [
    {
      id: "r-loopnote",
      label: "Loopnote (incumbent vendor) mentioned",
      severity: "watch",
      note: "Procurement holds a demo file from last spring — expect a side-by-side on Thursday.",
      cites: [ct("ridgeline-checkin", "keeps a Loopnote file"), ct("ridgeline-checkin", "piloted Loopnote on one route"), ct("ridgeline-checkin", "Loopnote's demo summary")],
    },
    {
      id: "r-adoption",
      label: "Warehouse-lead adoption wobble",
      severity: "risk",
      note: "Route 4 didn't open the app until Wednesday — quotes carrying the human voice is what closed it.",
      cites: [ct("ridgeline-checkin", "didn't open the app until Wednesday"), { meetingId: "ridgeline-discovery", t: salesAt("warehouse managers the app, not just ops") }],
    },
    {
      id: "r-security",
      label: "Security review outstanding",
      severity: "watch",
      note: "Packet went with the Oct 17 recap; procurement owns the timing.",
      cites: [ct("ridgeline-checkin", "security packet procurement already has coming")],
    },
  ],
  meetingIds: ["ridgeline-checkin", "ridgeline-discovery"],
};

export const checkinMeeting = checkin;

export const DEALS: Deal[] = [ridgelineDeal];