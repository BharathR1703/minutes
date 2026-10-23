import type { Meeting, Speaker } from "@/lib/model";
import { builder } from "./builder";

const you: Speaker = { id: "you", name: "You", color: "#0E7C86", self: true };

// The two-minute solo test call that proves the pipeline end to end.
const b = builder();
const T = b.built;
const at = (sub: string) => {
  const u = T().find((x) => x.text.includes(sub));
  if (!u) throw new Error(`no utterance matching: ${sub}`);
  return u.t;
};

b.say("you", " Okay, test call. Two minutes, just me, checking the notetaker works end to end before tomorrow's team sync.");
b.gap(4);
b.say("you", " First check — if Minutes picks this up, the transcription should show this exact sentence. Hello, pipeline.");
b.say("you", " Second check, highlights. I'm tagging this moment as a decision to see where it lands on the recording afterward.");
b.gap(6);
b.say("you", " Third check is the summary. When the call ends it should produce a short summary and a couple of action items — one of them being, review this test recording before the team sync.");
b.say("you", " That's the whole test. If all three checks pass, capture, highlights and summarizing all work together. Signing off.");
b.gap(3);

export const soloMeeting: Meeting = {
  id: "solo-test",
  title: "Notetaker test call",
  platform: "Google Meet",
  startedAt: "2026-10-22T08:41:00Z",
  duration: b.end + 10,
  captureMode: "bot-free",
  status: "recorded",
  speakers: [you],
  transcript: b.built(),
  highlights: [
    {
      id: "h-solo-1",
      at: at("tagging this moment as a decision"),
      title: "Highlight test — this moment should land as a decision flag",
      tag: "decision",
    },
  ],
  actionItems: [
    {
      id: "a-solo-1",
      ownerName: "You",
      text: "Review this test recording before the team sync",
      due: "2026-10-22",
      cite: at("review this test recording before the team sync"),
    },
  ],
  summaries: {},
  defaultTemplate: "standard",
  emailDraft: "",
};