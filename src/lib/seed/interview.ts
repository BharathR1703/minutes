import type { Meeting, Speaker } from "@/lib/model";
import { builder } from "./builder";
import { daysAgo, dueIn } from "./dates";

const interviewAt = daysAgo(9, 10, 0);

const S: Speaker[] = [
  { id: "you", name: "You", color: "#0E7C86", self: true },
  { id: "lena", name: "Lena Hoffmann", color: "#B23A68" },
];

const b = builder();
const T = b.built;
const at = (sub: string) => {
  const u = T().find((x) => x.text.includes(sub));
  if (!u) throw new Error(`no utterance matching: ${sub}`);
  return u.t;
};

// Candidate interview — the call type where a verifiable transcript matters most.
b.say("you", " Lena, thanks for the patience this week. So — Systems TS role, second round. Half the hour is your problem walkthrough, half is questions both ways. Start wherever you like.");
b.say("lena", " Sounds good. The problem I picked is from my current role: we process roughly eleven million telemetry events a day and at peak the ingestion pipeline would fall behind by up to twenty minutes.");
b.say("you", " What was falling behind concretely?");
b.say("lena", " The batching consumer. It flushed every thirty seconds regardless of load, and a single slow partition held the whole flush. The fix that worked was partition-sharded consumers with independent watermarks plus a bounded retry queue per shard.");
b.say("you", " Bounded retry — what bounds it, and what happens when the bound is hit?");
b.say("lena", " Per-shard ring of ten thousand retries; overflow goes to cold storage and a reconciler job replays it. We measured it — the reconcile path handled about four percent of volume at peak.");
b.say("you", " Four percent going through a second system — did you have a cost story for that?");
b.say("lena", " Yes, that was actually the argument that got it approved. Storage is cheap, latency is expensive. The reconcile job ran on spot capacity, so the extra cost was under two hundred dollars a month versus the incident cost we were eating.");
b.say("you", " And what would you do differently now?");
b.say("lena", " I'd challenge the thirty-second flush itself earlier. I spent two weeks fixing the symptom before questioning the cadence. The sharding was right, but the real fix was making flush interval load-aware — that came six months later and removed most of the retry volume.");
b.say("you", " That's a good answer. Take five minutes — I want to see the watermark design on the shared doc, specifically how you'd order events across shards.");
b.gap(180); // candidate writes the design on the shared doc
b.say("lena", " Okay, so each shard owns a key range, watermark per shard, and the consumer emits per-shard checkpoints. Ordering exists only within a shard — cross-shard you get eventual order, which is fine for telemetry.");
b.say("you", " And if a product person needs global ordering for billing events?");
b.say("lena", " I'd route billing to a single ordered stream and keep telemetry sharded. Correctness by routing, not by forcing a global order onto everything.");
b.say("you", " Right answer, and quickly. Let me flip it around before we run out of time — what do you want to ask me?");
b.say("lena", " Two things. One: how much of the on-call burden is the recording infra versus the product itself? Two: what's the ratio of new surfaces to keeping existing ones trustworthy?");
b.say("you", " The recording infra is shared on-call — one week in five. On ratio, we deliberately spent the last half-year on trust — transcripts people can rely on — and less on new surfaces. That's the honest answer.");
b.say("lena", " That's the answer I hoped for, honestly. Recording things people say into their meetings is a trust-heavy product; I like that you're treating it that way.");
b.say("you", " Next step is a systems-design round with Jonas, then references. I'll send both today.");
b.say("lena", " Great, thank you. I enjoyed it.");

export const interviewMeeting: Meeting = {
  id: "interview-lena",
  title: "Interview — Lena Hoffmann (Systems TS)",
  platform: "Zoom",
  startedAt: interviewAt,
  duration: b.end + 30,
  captureMode: "bot",
  status: "recorded",
  speakers: S,
  transcript: b.built(),
  highlights: [
    {
      id: "h-in-1",
      at: at("I'd challenge the thirty-second flush itself earlier"),
      title: "Strong answer: names her own miss unprompted",
      tag: "moment",
      note: "She found the root cause six months later and said the shortcut was hers.",
    },
    {
      id: "h-in-2",
      at: at("Correctness by routing"),
      title: "Design decision: correctness by routing, not global ordering",
      tag: "decision",
    },
  ],
  actionItems: [
    {
      id: "a-in-1",
      ownerName: "You",
      text: "Send Jonas' systems-design round invite to Lena",
      due: dueIn(interviewAt, 0),
      cite: at("Next step is a systems-design round with Jonas"),
    },
    {
      id: "a-in-2",
      ownerName: "You",
      text: "Reference check: two from the telemetry project",
      due: dueIn(interviewAt, 7),
      cite: at("then references"),
    },
  ],
  summaries: {},
  defaultTemplate: "interview",
  emailDraft: "",
};