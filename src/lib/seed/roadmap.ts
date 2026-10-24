import type { Meeting, Speaker } from "@/lib/model";
import { builder } from "./builder";
import { daysAgo, dueIn } from "./dates";

const roadmapAt = daysAgo(3, 17, 0);

const S: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "priya", name: "Priya Natarajan", color: "#8C4A73" },
  { id: "jonas", name: "Jonas Weber", color: "#B4552D" },
  { id: "maya", name: "Maya Lindqvist", color: "#5C6B34" },
  { id: "sam", name: "Sam Okafor", color: "#7D4CB2" },
  { id: "rhea", name: "Rhea Menon", color: "#A2751B" },
  { id: "tom", name: "Tom Whitmore", color: "#44546A" },
  { id: "chloe", name: "Chloe Kim", color: "#B23A68" },
];

const b = builder();
const T = b.built;
// anchor lookups so every cite/highlight points at the exact utterance
const at = (sub: string) => {
  const u = T().find((x) => x.text.includes(sub));
  if (!u) throw new Error(`no utterance matching: ${sub}`);
  return u.t;
};

// ── the call ────────────────────────────────────────────────────────────────
b.say("you", " Okay, I think everyone's here. Eight of us — quick check, can you all hear me?");
b.say("priya", " Loud and clear.");
b.say("tom", " Yep.");
b.gap(15);
b.say("you", " Great. Agenda is the three Q3 bets: onboarding revamp, semantic search, and the pricing experiment. Priya, want to set the stage?");
b.say("priya", " Sure. Quick Q2 recap — activation was the weak spot. Trial-to-paid held at 21%, but activation dropped four points and it's concentrated in week one.");
b.say("rhea", " Screensharing now — this is the activation funnel. The cliff is day three. People create a workspace, drop in the first meeting, and 44% of them never invite a second person. After that they basically don't come back.");
b.say("jonas", " The single-player workspace problem again.");
b.say("rhea", " Exactly. The product is a multiplayer product and the funnel treats it like a solo one.");
b.say("you", " Okay, so bet one: the onboarding revamp. Maya, where are we?");
b.say("maya", " I've been carrying this for two weeks. The core rework: no shared 'team space' until you invite someone. You get a private workspace, Minutes-style, and the product only asks for an invite after your first real meeting — not during signup.");
b.say("jonas", " I like the sequencing. Does that kill the team picker flow that Sales demoed last round?");
b.say("maya", " It moves it. The picker shows up on invite, which for new workspaces is basically day zero of team mode.");
b.say("tom", " From my side — demoing the old flow costs me about four minutes of every call, and it never lands well. If that's gone, I need the new flow to demo itself.");
b.gap(120);
b.say("maya", " That's the goal. One screen, zero configuration.");
b.say("you", " Timeline?");
b.say("maya", " I can have hi-fi mockups of the activation flow by Wednesday. Build is another question — Sam?");
b.say("sam", " The front-of-funnel changes are small. It's the workspace-scoping change underneath that's real work — invites, permissions, the team API. Call it two and a half weeks if we start next sprint.");
b.say("jonas", " You'd own it end to end?");
b.gap(90);
b.say("sam", " Yeah. Might pull Dennis in for the permissions layer.");
b.say("jonas", " Dennis is on infra for the first half of the sprint. After that he's yours, if the search beta doesn't eat him first — which segues nicely.");
b.gap(720); // Rhea's funnel screen share: cohort tables, two pull-ups, arguable slides, debate
b.say("you", " Bet two then. Jonas, semantic search — you had a demo going into this meeting.");
b.say("jonas", " I did, and I'm going to talk you out of shipping it this quarter.");
b.say("sam", " Interesting.");
b.say("jonas", " Retrieval quality on our own corpus is at 71% on the eval set. The bar for 'not embarrassing in front of a customer' is 85. We're two weeks from a good demo, six from a shippable thing. Shipping a mediocre search engine is worse than shipping none — people try it once, get a wrong answer, and never trust it again.");
b.say("tom", " I hear you, but three prospects asked for cross-meeting search this month alone. It's the single most requested thing in our pipeline.");
b.say("jonas", " I know. And they'd get it three months early and broken.");
b.say("you", " What's the middle ground?");
b.say("jonas", " Ship it to internal + the ten design partners we already have in the beta program in late October. General availability when the eval clears 85. Realistic date is mid-November.");
b.gap(600);
b.say("chloe", " Design partners are forgiving if you frame it as an experiment — I can hand-hold the first week.");
b.say("tom", " Can I demo it live on sales calls at least? Half of what those prospects want is seeing it work once.");
b.say("jonas", " On the ten pilot workspaces, yes — after late October. Not on arbitrary customer data.");
b.say("tom", " Fine. That's an upgrade conversation anyway.");
b.say("priya", " I'd rather manage three disappointed prospects than one broken launch. I'm good with GA moving.");
b.say("you", " Let's make it real: search stays in beta this quarter, GA targeted November 12. Jonas owns replanning it and brings me the date in writing. Next bet: pricing.");
b.gap(150);
b.say("you", " Rhea set up the usage-based pricing experiment last month. Where did it land?");
b.say("rhea", " Flat. Three cohorts, twelve weeks. Usage-based seats converted 1.8% better on price-sensitive segments and 2.1% *worse* everywhere else. Net across the book: slightly negative, plus real complexity in billing and forecasting.");
b.say("tom", " And from the Sales side it's poison. Every enterprise deal now opens a conversation about metering. I've had two procurement teams slow down over it in October alone.");
b.say("you", " Then this is the rare experiment where we got our answer early. I'm calling it: usage-based pricing is dead.");
b.say("priya", " Good. What do we actually do with the finding?");
b.say("tom", " Annual commitment pricing, team-wide. Flat per-seat, bigger discount at 12 and 24 months. That's what the mid-market keeps asking for anyway.");
b.say("rhea", " I can pull cohort revenue per team-size to price the annual tiers properly — a week of my time, needs to happen before the pricing page changes.");
b.gap(180);
b.say("you", " Agreed. Rhea owns the cohort pull, Tom and I own the tiers once it lands. That's bet three done — Chloe, you had something on Customer Success?");
b.gap(240);
b.say("chloe", " Yeah, small but annoying. Every renewing account this month has hit the same snag: the admin who set up the workspace left, and nobody can invite people anymore. We spent 40 minutes with Helmar Clinic on that last Tuesday. It's an ownership transfer feature that doesn't exist.");
b.say("jonas", " How deep is that — genuinely a transfer flow?");
b.say("chloe", " The cheap version is an admin reassignment from settings. I'd take that.");
b.say("sam", " The cheap version is maybe two days for me. The real flow with audit trail is a sprint.");
b.say("priya", " Take the two-day version. It's churn insurance on our ten biggest accounts.");
b.say("you", " Sam, add it after the workspace scoping work, not before. Okay — five minutes left, let me make sure what we decided actually lands where it should…");
b.gap(480);
b.say("you", " Recap: Maya, hi-fi mockups Wednesday. Sam owns workspace scoping, starts next sprint, Dennis joins after infra. Jonas replans search — beta ships late October, GA November twelfth, eval at 85%. Rhea's pricing cohort lands next week. Tom, you get search on pilot workspaces for demos. Chloe gets the admin reassignment hack. Anything I missed?");
b.say("maya", " Design review — should the mockups go to everyone or just the core group?");
b.say("priya", " Core group Wednesday, whole team Friday in design crit.");
b.say("maya", " Works for me.");
b.say("sam", " One thing — if I'm taking workspace scoping AND the admin transfer, Dennis being freed by search matters more than it sounds. If search runs late, I run late. Flagging it now.");
b.say("jonas", " Fair. I'll try to release Dennis early in that case.");
b.say("you", " Noted — I'm putting a soft dependency marker on the replan doc. Thanks all, good call tonight.");
b.say("priya", " Bye everyone.");
b.say("chloe", " Thanks!");
b.gap(25); // goodbyes wrap

export const roadmapMeeting: Meeting = {
  id: "q3-roadmap",
  title: "Product roadmap — Q3 bets",
  platform: "Zoom",
  startedAt: roadmapAt,
  duration: b.end + 40,
  captureMode: "bot",
  status: "recorded",
  speakers: S,
  transcript: b.built(),
  highlights: [
    {
      id: "h-rm-1",
      at: at("cliff is day three"),
      title: "Activation cliff at day three — 44% never invite a second person",
      tag: "risk",
      note: "Rhea's funnel share. The single-player workspace problem.",
    },
    {
      id: "h-rm-2",
      at: at("late October. General availability"),
      title: "Search beta ships late Oct, GA moves to Nov 12 — eval bar is 85%",
      tag: "decision",
      note: "Jonas argued the demo, not the ship. Priya backed moving GA.",
    },
    {
      id: "h-rm-3",
      at: at("usage-based pricing is dead"),
      title: "Usage-based pricing experiment is dead — net negative plus billing complexity",
      tag: "decision",
      note: "Tom: procurement slowdowns in two enterprise deals this month.",
    },
    {
      id: "h-rm-4",
      at: at("Dennis being freed by search"),
      title: "Sam flags the real dependency: Dennis freed from search unblocks workspace work",
      tag: "risk",
    },
  ],
  actionItems: [
    {
      id: "a-rm-1",
      ownerName: "Maya Lindqvist",
      text: "Hi-fi mockups of the activation flow",
      due: dueIn(roadmapAt, 7),
      cite: at("hi-fi mockups of the activation flow"),
    },
    {
      id: "a-rm-2",
      ownerName: "Sam Okafor",
      text: "Workspace scoping changes (invites, permissions, team API), Dennis joins after infra",
      due: dueIn(roadmapAt, 16),
      cite: at("Call it two and a half weeks"),
    },
    {
      id: "a-rm-3",
      ownerName: "Jonas Weber",
      text: "Replan search beta: internal + 10 design partners late Oct, written GA date Nov 12",
      due: dueIn(roadmapAt, 3),
      cite: at("GA targeted November 12"),
    },
    {
      id: "a-rm-4",
      ownerName: "Rhea Menon",
      text: "Cohort revenue pull by team size to price annual tiers",
      due: dueIn(roadmapAt, 7),
      cite: at("needs to happen before the pricing page"),
    },
    {
      id: "a-rm-5",
      ownerName: "You",
      text: "Pricing tiers with Tom after Rhea's cohort lands; soft-dependency note in replan doc",
      due: dueIn(roadmapAt, 12),
      cite: at("Rhea owns the cohort pull, Tom and I own the tiers"),
    },
    {
      id: "a-rm-6",
      ownerName: "Sam Okafor",
      text: "Two-day admin reassignment (post workspace scoping)",
      due: dueIn(roadmapAt, 20),
      cite: at("The cheap version is maybe two days"),
    },
  ],
  summaries: {},
  defaultTemplate: "standard",
  emailDraft: "",
};