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

**5. The deal room is a record, not a pipeline widget.** `/deal/[id]` stitches every call
with one client into a single page: a deal brief written from what the calls established, a
risk tracker whose counts are literally the playable citations beneath them (the incumbent
vendor "mentioned 3×" is three chips, each one a moment in the check-in), and commitments
unified across calls in due-date order.

**6. Agentic follow-through asks, never sends.** Any action item can be dispatched: the
assistant drafts an email or a Jira ticket out of what was actually said (verbatim commitment
quote and its citation included), and nothing happens without Approve — the build says so.

**7. What was cut, deliberately.**
- No "conversation intelligence" dashboards (talk-time percentages, sentiment curves) — nobody
  ever changed their next meeting because of one.
- No paywalled Ask — retrieval is exact-word matching here, honest about its limits, and the
  citations make up for it.
- No CRM-sync theater, no recording-notice compliance module in the demo path.

## What's real, what's stubbed

- **Real:** transcript↔playback sync (rAF clock, seek, speed, `?t=` deep links, auto-scroll
  with user-scroll suppression), per-call summary templates, action items, highlights, clip
  sharing to people who were never on the call (`/share/[meetingId]?h=`), cross-meeting
  search, the speaking graph, the deal room (`/deal/ridgeline-foods`) with its citation-backed
  risk tracker, the "chat with the call" retrieval that answers only in quotes, and the
  dispatch draft→approve→toast flow.
- **Stubbed:** the capture layer — nothing joins Zoom or records system audio. The seed data
  represents what capture would produce, and the UI says so plainly (see the walkthrough).
- **Real Google Calendar + real Meet calls** (the one integration that isn't simulated):
  `/book` offers a real Google sign-in (OAuth in `src/app/api/auth/google/*`; the client
  secret stays in server env, tokens in the consenting browser only). Once connected
  Minutes lists your **real upcoming events** with their real Meet links ("Arm Minutes" on
  any of them), and **"Book for real"** creates a real calendar event with a real Google
  Meet conference link via the Calendar API — Google emails the attendee invitations. The
  capture of a real call is real too: Minutes listens to the shared Meet **tab audio in the
  browser** (getDisplayMedia), transcribes it live with the browser's speech engine and a
  level meter, tags speakers via chips (browser STT can't diarize), and on stop writes the
  same minutes every call gets. This is the same system-audio path Fathom's desktop app
  takes on Meet; nothing joins Meet headlessly (Google blocks that for web apps). What is
  still stubbed: joining others' calls as a headless bot.
- **Real accounts (Supabase)**: `/signin` is a working sign-up AND sign-in — **email +
  password only, nothing ever mailed** (you create the account with a password and that
  same password signs you in). Sessions live in the browser; when
  signed in, bookings and captured minutes write through to per-user rows in Postgres
  (`minutes_rows`, `minutes_recordings` — schema in `scripts/supabase-schema.sql`), protected
  by row-level security so each account sees only its own rows, and sync back down on any
  other browser (`src/lib/db.ts`, `src/lib/store-sync.ts`, `src/components/StoreSync.tsx`).
  Signed out, everything still works locally in localStorage as before — the cloud layer is
  a mirror, not a dependency.
- **Recordings → minutes** (`/record`): give Minutes a recording you already have — an mp3,
  wav, m4a — and it decodes and resamples it **in the browser** and transcribes it with
  Whisper (transformers.js, ONNX/WebAssembly, ~45 MB model downloaded once — no API key, no
  server round-trip, audio never leaves the tab). You tag each segment with the person who
  spoke (browser transcription can't separate voices), and Minutes then runs the same
  extraction it runs on captured calls: cite-backed summary and bullets, action items,
  flagged moments — and the whole app (playback, chat, clips, search, dispatch) runs on the
  result. Signed in, the recording file itself attaches to the account via Supabase Storage
  (per-user folder). Verified end-to-end with real spoken audio.
- **Book a call in the app** (`/book`): the booking form arms a capture run like a seeded
  call — run the simulation and a full meeting is generated (transcript, summary, actions,
  highlights, clips, chat, dispatch). Two modes: a **walkthrough script** (the script's
  dialogue is captured) or **your own call** — during the live capture *you* feed what's
  said, line by line (type or paste it), speaker by speaker, and Minutes extracts the
  summary, action items and highlights from your words, every line citing the moment, then
  the whole app (playback, chat, clips, dispatch, follow-up) runs on your content. Attendees
  are booked with **name + email**; emails go onto a downloadable **.ics calendar file**
  (RFC 5545, real `ATTENDEE;mailto:` lines — add it to any calendar app) and into the
  follow-up draft's `To:` line. With no database, bookings live in the booking browser's
  localStorage only and say so in the UI; seed data is untouched.
- **Real corpus meetings on board**: three real meetings imported from the public AMI Meeting
  Corpus (`edinburghcstr/ami`, ihm/test, via Hugging Face datasets-server —
  `scripts/fetch-ami.mjs` → generated `src/lib/seed/ami-raw.ts`). Real utterances, real
  timestamps, dataset speaker ids. The corpus carries no calendar dates (dates shown are
  labeled placeholders from the corpus year), and Minutes' summary/highlights/actions on
  these are heuristic extractions from the real transcript, every line citing the moment.
  The dashboard lists them under "Imported — real meetings" with the caveat spelled out.
- The **AI is mocked**: chat answers, generated clips, and dispatch drafts are retrieval +
  hand-woven text streamed token-by-token — no model call, the code says so in its footnote.
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