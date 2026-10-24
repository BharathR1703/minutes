import type { Meeting, Upcoming } from "@/lib/model";

// ── Booked demo meetings ─────────────────────────────────────────────────────
// The app has no database, so calls a person books here live in their browser
// (localStorage), under `minutes.demo.v1`. The seed data stays untouched;
// demo sections below the seeded ones are labeled "booked in this browser".
// Everything a seed meeting has — transcript, summary, actions, highlights —
// is composed from a walkthrough script so the whole product is testable on
// the booked call: playback, chat, clips, dispatch, sharing.

export type ScriptId = "discovery" | "standup" | "oneOnOne" | "interview";

export const SCRIPTS: { id: ScriptId; name: string; blurb: string }[] = [
  { id: "discovery", name: "Sales discovery", blurb: "pain, eval commit, pricing touchpoint" },
  { id: "standup", name: "Team standup", blurb: "blockers, owner swaps, a demo" },
  { id: "oneOnOne", name: "One-on-one", blurb: "what's stuck, research day, on-call" },
  { id: "interview", name: "Interview", blurb: "redesign with numbers, self-critique" },
];

/** What was filled in on the booking form. */
export type DemoSpec = {
  script: ScriptId;
  title: string;
  platform: Upcoming["platform"];
  startedAt: string; // ISO, chosen on the form
  captureMode: Upcoming["captureMode"];
  attendees: string[]; // non-self names, first is the lead
};

/** One booked call: the form spec plus whether capture has been run. */
export type DemoEvent = {
  id: string; // "demo-<booking timestamp>"
  spec: DemoSpec;
  status: "armed" | "recorded";
};

export type DemoStore = { events: DemoEvent[]; meetings: Meeting[] };

const KEY = "minutes.demo.v1";

const EMPTY: DemoStore = { events: [], meetings: [] };

export function loadDemoStore(): DemoStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as DemoStore;
    return { events: parsed.events ?? [], meetings: parsed.meetings ?? [] };
  } catch {
    return EMPTY;
  }
}

export function saveDemoStore(s: DemoStore): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function bookMeeting(spec: DemoSpec): DemoEvent {
  const store = loadDemoStore();
  const ev: DemoEvent = {
    id: `demo-${Date.now().toString(36)}`,
    spec,
    status: "armed",
  };
  saveDemoStore({ ...store, events: [...store.events, ev] });
  return ev;
}

/** When the simulated capture ends: the call is now a real meeting. */
export function recordBooking(id: string): Meeting | undefined {
  const store = loadDemoStore();
  const ev = store.events.find((e) => e.id === id);
  if (!ev || ev.status === "recorded") return store.meetings.find((m) => m.id === id);
  const meeting = composeMeeting(ev.spec, ev.id);
  const updated: DemoStore = {
    events: store.events.map((e) => (e.id === id ? { ...e, status: "recorded" as const } : e)),
    meetings: [...store.meetings, meeting],
  };
  return saveDemoStore(updated) ? meeting : undefined;
}

export function getDemoMeeting(id: string): Meeting | undefined {
  return loadDemoStore().meetings.find((m) => m.id === id);
}

export function clearDemo(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/* ── meeting composition ────────────────────────────────────────────────────── */

const GUEST_COLORS = ["#5C6B34", "#5B5E6B", "#B4552D", "#4A6C8C", "#6B4A6E"];

type Utterance = Meeting["transcript"][number];
type Line = { sp: number | "self"; text: string };
type Draft = {
  gist: string;
  sections: { heading: string; bullets: { sub: string; text: string }[] }[];
  highlights: { sub: string; title: string; tag: Meeting["highlights"][number]["tag"]; note?: string }[];
  actions: { sub: string; owner: number | "self"; text: string; dueIn: number }[];
};

/** Each script's cite anchors are substrings of its own lines (`sub`). */
const SCRIPTS_BODY: Record<ScriptId, { lines: Line[]; draft: Draft }> = {
  discovery: {
    lines: [
      { sp: "self", text: " Thanks for making time, {A0} — I'll keep this to twenty minutes." },
      { sp: 0, text: " Appreciate it. Quick context: we run ops for about two hundred stores, and I'd bet a third of what gets decided in calls never reaches a ticket." },
      { sp: "self", text: " Where does the rest of it go?" },
      { sp: 0, text: " Someone's notebook. {A1} writes up every call by hand — assuming the call gets written up at all." },
      { sp: 1, text: " It's true. Friday afternoons are my handwriting ritual." },
      { sp: "self", text: " And the failure mode when it doesn't get written?" },
      { sp: 0, text: " Disputes. \"You said Thursday.\" \"No, the other Thursday.\" Last month a misheard date cost us a full day of delivery." },
      { sp: "self", text: " So the eval: five real calls this week through Minutes, {A1} fully hands-off, and a check-in end of the week." },
      { sp: 0, text: " That works. Send the recap and the security packet." },
      { sp: "self", text: " It'll be in your inbox tonight. Talk end of week." },
    ],
    draft: {
      gist:
        "Ops for ~200 stores loses a third of in-call decisions to hand-written notes. They commit to a five-call eval this week with {A1} hands-off, recap and security packet out tonight, check-in end of week.",
      sections: [
        {
          heading: "Topics discussed",
          bullets: [
            { sub: "about two hundred stores", text: "~200 stores; a third of in-call decisions never reaches a ticket." },
            { sub: "misheard date cost us", text: "A misheard date on a call cost a full day of delivery last month." },
          ],
        },
        {
          heading: "Key takeaways",
          bullets: [
            { sub: "five real calls this week", text: "Eval = five real calls this week, {A1} fully hands-off." },
            { sub: "recap and the security packet", text: "Recap + security packet sent from this call." },
          ],
        },
      ],
      highlights: [
        { sub: "misheard date cost us", title: "Compelling event: a misheard date cost a day of delivery", tag: "moment", note: "Use this clip in the follow-up." },
        { sub: "five real calls this week", title: "Eval committed: five real calls, hands-off", tag: "decision" },
      ],
      actions: [
        { sub: "recap and the security packet", owner: "self", text: "Send recap + security packet", dueIn: 0 },
        { sub: "five real calls this week", owner: 0, text: "Nominate the five weekly calls for the eval", dueIn: 3 },
      ],
    },
  },

  standup: {
    lines: [
      { sp: "self", text: " Quick standup — blockers first." },
      { sp: 0, text: " The migration landed. One flaky test left, it's on the board with a repro." },
      { sp: 1, text: " I'm blocked on the API shape review — can we pair today after the build?" },
      { sp: "self", text: " Yes, I'll have the doc up by ten. Anything else?" },
      { sp: 0, text: " The demo for Friday is ready a day early — two customers asked to see it." },
      { sp: "self", text: " Then we're clear. {A0}, watch that flaky test today and flag it if it flaps twice." },
      { sp: 0, text: " Will do — escalation rotation if it does." },
    ],
    draft: {
      gist:
        "Migration is down and the Friday demo is ready early. API-shape pairing lands after the build today; the last flaky test stays on {A0}'s board with a repro and an escalation rule.",
      sections: [
        {
          heading: "Topics discussed",
          bullets: [
            { sub: "The migration landed", text: "Migration landed; one flaky test remains with a repro." },
            { sub: "demo for Friday is ready", text: "Friday demo ready a day early; two customers want in." },
          ],
        },
        {
          heading: "Key takeaways",
          bullets: [
            { sub: "doc up by ten", text: "API shape review pairs right after the build — doc up by ten." },
            { sub: "flag it if it flaps twice", text: "Flaky test gets watched today; twice = escalate." },
          ],
        },
      ],
      highlights: [
        { sub: "demo for Friday is ready", title: "Friday demo ready early — two customers want in", tag: "moment" },
        { sub: "doc up by ten", title: "API shape pairing set after the build", tag: "decision" },
      ],
      actions: [
        { sub: "doc up by ten", owner: "self", text: "Post the API shape doc before 10:00 for the pairing", dueIn: 0 },
        { sub: "flag it if it flaps twice", owner: 0, text: "Watch the flaky test; escalate on a second flap", dueIn: 0 },
      ],
    },
  },

  oneOnOne: {
    lines: [
      { sp: "self", text: " How's the work landing this week, {A0}?" },
      { sp: 0, text: " It's moving, honestly — but I'm on the third redraw of the same screen." },
      { sp: "self", text: " What's off about it?" },
      { sp: 0, text: " It looks right and still feels like a form. I think I'm designing the checklist instead of the moment." },
      { sp: "self", text: " That's the sentence for the crit deck. Take a research day: five session recordings, then an evidence deck." },
      { sp: 0, text: " That actually relieves something. Evidence deck, not screens." },
      { sp: "self", text: " One more thing — on-call. I'd like to move you out of the first rotation slot." },
      { sp: 0, text: " Please. Later slot, zero complaints." },
    ],
    draft: {
      gist:
        "{A0} calls out designing-the-checklist instead of the moment — a research day on session recordings replaces the fourth redraw, deck with evidence Wednesday. On-call: moves out of the first rotation slot.",
      sections: [
        {
          heading: "What's going well",
          bullets: [
            { sub: "It's moving, honestly", text: "Work is moving; the third redraw is the stuck point, not the plan." },
          ],
        },
        {
          heading: "What's in the way",
          bullets: [
            { sub: "designing the checklist instead of the moment", text: "\"Designing the checklist instead of the moment\" — third redraw." },
            { sub: "out of the first rotation slot", text: "First on-call slot was unwanted — moved." },
          ],
        },
      ],
      highlights: [
        { sub: "designing the checklist instead of the moment", title: "\"Designing the checklist instead of the moment\"", tag: "moment", note: "This sentence goes in the crit deck." },
        { sub: "research day", title: "Research day over the redraw — evidence deck Wednesday", tag: "decision" },
      ],
      actions: [
        { sub: "five session recordings", owner: 0, text: "Research day: five session recordings, then the evidence deck", dueIn: 2 },
        { sub: "out of the first rotation slot", owner: "self", text: "Move the on-call slot out of the first rotation", dueIn: 1 },
      ],
    },
  },

  interview: {
    lines: [
      { sp: "self", text: " Take it away — the redesign you shipped last quarter." },
      { sp: 0, text: " I sharded the consumers by route and bounded the retries. End latency went from five seconds at the 90th percentile to under one." },
      { sp: "self", text: " What did you get wrong on the first attempt?" },
      { sp: 0, text: " I flushed every thirty seconds — the ordering bug was mine, and I should have challenged my own fix order earlier." },
      { sp: "self", text: " How do you keep cost in the picture when designing?" },
      { sp: 0, text: " I profiled the spot capacity path — it stayed under two hundred dollars a month, measured, not guessed." },
      { sp: "self", text: " Good. Next round is a systems-design hour with another panel lead." },
    ],
    draft: {
      gist:
        "Load-shaped redesign with real numbers: latency from 90th-percentile 5s down to under 1s. Owns misses unprompted and is cost-aware with measured figures. Recommend the systems-design round.",
      sections: [
        {
          heading: "Strengths observed",
          bullets: [
            { sub: "challenged my own fix order", text: "Owns misses unprompted — challenges their own earlier fix order." },
            { sub: "under two hundred dollars a month", text: "Cost-aware: profiled and measured, under $200/mo." },
          ],
        },
        {
          heading: "Next step",
          bullets: [
            { sub: "systems-design hour", text: "Proceed to the systems-design round." },
          ],
        },
      ],
      highlights: [
        { sub: "ordering bug was mine", title: "Owns the miss unprompted", tag: "moment" },
        { sub: "systems-design hour", title: "Recommend systems-design round", tag: "decision" },
      ],
      actions: [
        { sub: "systems-design hour", owner: "self", text: "Schedule the systems-design round", dueIn: 1 },
      ],
    },
  },
};

/**
 * Compose a full meeting from a booked spec: script lines get the attendee
 * names woven in, every artifact cites its line by substring anchor, so chat,
 * clips, dispatch and search all behave exactly as on seeded calls.
 */
export function composeMeeting(spec: DemoSpec, id: string): Meeting {
  const script = SCRIPTS_BODY[spec.script];
  const attendees = spec.attendees.filter((n) => n.trim());
  const speakers = [
    { id: "you", name: "You", color: "#0E7C86", self: true },
    ...attendees.map((att, i) => ({
      id: `g${i}`,
      name: att.includes("(") ? att : att,
      color: GUEST_COLORS[i % GUEST_COLORS.length],
    })),
  ];
  // a script line meant for a missing attendee falls to the first guest
  const resolve = (sp: number | "self") =>
    sp === "self" ? "you" : `g${Math.min(sp, Math.max(0, attendees.length - 1))}`;

  // transcript with {A0}/{A1} woven into the attendee's first name
  const filled = script.lines.map((l) => ({
    sp: l.sp,
    text: l.text.replace(/\{A0\}/g, attendees[0] ?? "there").replace(/\{A1\}/g, attendees[1] ?? attendees[0] ?? "your first attendee"),
  }));

  // timestamps follow the same cadence as the seed builder (~2.6 words/sec)
  let t = 0;
  const transcript: Utterance[] = filled.map((l) => {
    const speaker = resolve(l.sp);
    const words = l.text.trim().split(/\s+/).length;
    const dur = Math.max(1.8, Math.round((words / 2.6) * 10) / 10);
    const u = { t: Math.round(t), dur, speaker, text: l.text };
    t += dur + 0.9;
    return u;
  });
  const end = Math.round(t);

  const at = (sub: string) => {
    const u = transcript.find((x) => x.text.includes(sub));
    return u ? u.t : -1;
  };

  const first = (n: string) => n.trim().split(/\s+/)[0];
  const a0 = attendees[0] ?? "the attendee";

  const gist = script.draft.gist
    .replace(/\{A0\}/g, first(a0))
    .replace(/\{A1\}/g, attendees[1] ? first(attendees[1]) : first(a0));

  const summary = {
    template: "standard",
    gist,
    sections: script.draft.sections.map((sec) => ({
      heading: sec.heading,
      bullets: sec.bullets.map((bl) => {
        const t0 = at(bl.sub);
        return {
          text: bl.text.replace(/\{A0\}/g, first(a0)).replace(/\{A1\}/g, attendees[1] ? first(attendees[1]) : first(a0)),
          cite: t0,
        };
      }),
    })),
  };

  const highlights = script.draft.highlights.map((h, i) => ({
    id: `hd-${id}-${i + 1}`,
    at: at(h.sub),
    title: h.title,
    tag: h.tag,
    note: h.note,
  }));

  const actionItems = script.draft.actions.map((a, i) => {
    const owner = a.owner === "self" ? "You" : attendees[a.owner] ?? a0;
    const due = new Date(spec.startedAt);
    due.setDate(due.getDate() + a.dueIn);
    return {
      id: `ad-${id}-${i + 1}`,
      ownerName: owner,
      text: a.text.replace(/\{A0\}/g, first(a0)).replace(/\{A1\}/g, attendees[1] ?? a0),
      due: due.toISOString().slice(0, 10),
      cite: at(a.sub),
    };
  });

  const email = [
    `Hi all —`,
    ``,
    `Quick recap of ${spec.title.toLowerCase()} from ${new Date(spec.startedAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}:`,
    ``,
    gist,
    ``,
    `Action items:`,
    ``,
    ...actionItems.map((a) => `- ${a.text} (${a.ownerName})`),
    ``,
    `Recording and full transcript shared in Minutes.`,
    `Anything I got wrong or missed, reply to this note.`,
    `— Sent from Minutes`,
  ].join("\n");

  return {
    id,
    title: spec.title,
    platform: spec.platform,
    startedAt: spec.startedAt,
    duration: end + 20,
    captureMode: spec.captureMode,
    status: "recorded",
    speakers,
    transcript,
    highlights,
    actionItems,
    summaries: { standard: summary },
    defaultTemplate: "standard",
    emailDraft: email,
  };
}

/** The Upcoming row the armed-list sections render for a booked call. */
export function demoEventUpcoming(e: DemoEvent): Upcoming {
  return {
    id: e.id,
    title: e.spec.title,
    platform: e.spec.platform,
    startedAt: e.spec.startedAt,
    attendees: ["You", ...e.spec.attendees],
    captureMode: e.spec.captureMode,
  };
}