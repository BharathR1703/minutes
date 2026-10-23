# Minutes — a rebuild of Fathom.video, judged in one day

**Minutes** is a meeting-recording product rebuilt from first principles. The brief: use
fathom.video as your reference, not your blueprint — show what you would change, what you
would cut, and how you would make it better.

Everything here ships with **seeded real data** — 7 meetings (an 8-speaker 52-minute roadmap
call, a sales discovery, an interview, three one-on-ones, a bot-free solo test) plus 3
upcoming calendar events. Seed transcripts live in `src/lib/seed/*.ts` and are authored with
a builder that assigns cadence-based timestamps, so every citation in the UI points at a
moment that actually plays.

## The product decisions, in order of conviction

**1. Every claim is a citation.** Summary bullets, action items, and search results all carry
a timestamp chip that jumps the recording to the moment the claim came from. Fathom buries
"Ask Fathom" behind a paid plan; here retrieval-with-playback is the core promise — *nothing
in a Minutes answer can't be played back.*

**2. Action items are free.** Charging for "who owes what by when" charges for the thing you
scrolled past a firehose of notes to find. The action-item list, grouped by owner, with due
dates and citations, costs nothing in this build.

**3. Bot-free capture is a first-class mode, not a hidden setting.** A visible notetaker bot
changes the social texture of a call (guests notice, some decline, some behave). Minutes
records your local system audio and mic instead; the mode is chosen per meeting and shown as
a badge on every row. (The capture layer itself is stubbed in this build — see honesty note.)

**4. Summaries are a starting point.** Templates (Standard, SPICED, Interview, One-on-one,
Retro…) switch per call *after* the fact, and the same citations carry over. Template
switching is one select away, not a workspace setting.

**5. What was cut, deliberately.**
- No "conversation intelligence" dashboards (talk-time percentages, sentiment curves) — nobody
  ever changed their next meeting because of one.
- No paywalled Ask — retrieval is exact-word matching here, honest about its limits, and the
  citations make up for it.
- No CRM-sync theater, no recording-notice compliance module in the demo path.

## What's real, what's stubbed

- **Real:** transcript↔playback sync (rAF clock, seek, speed, `?t=` deep links, auto-scroll
  with user-scroll suppression), per-call summary templates, action items, highlights, clip
  sharing to people who were never on the call (`/share/[meetingId]?h=`), cross-meeting
  search, the speaking graph.
- **Stubbed:** the capture layer — nothing joins Zoom or records system audio. The seed data
  represents what capture would produce, and the UI says so plainly (see the walkthrough).
- The **audio you hear** in playback is a synthesized voice bed (per-speaker pitch), labeled
  as such in the transport — there is no real recording to stream.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind — no database: seed data is code, so the
demo is identical locally and in production, and all seed integrity (every citation anchor)
resolves at build time or throws.

## Dev

```bash
npm install
npm run dev   # localhost:3000
npm run build && npm start
```

## The agent behind it

`.agent-logs/` holds a capture of every prompt and response written to this repository while
it was being built — prompts, responses, and per-session transcripts, committed incrementally
as work progressed (see `.claude/hooks/` for the capture hooks).