"use client";

import type { Meeting } from "@/lib/model";
import { demoEventUpcoming, loadDemoStore, recordBooking, speakersOf, type DemoEvent, type FeedLine } from "@/lib/demo";
import { demoIdForRealEvent } from "@/lib/gcal";
import { CaptureSummary } from "@/components/demo/CaptureSummary";
import { fmtTime, hms, mmss } from "@/lib/time";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * REAL capture, for a real Google Meet call: the user is in the call, Minutes
 * listens to the shared Meet tab's audio in this browser and transcribes it
 * live (browser speech recognition), attributing each utterance to the
 * speaker chip selected. On stop, the same extraction as any call runs and
 * the full meeting — playback, chat, clips, dispatch — is built from the
 * real words. No server sees the audio; nothing joins Meet headlessly (a web
 * page can't, and Google blocks bots at the door anyway).
 */

// minimal structural types for the Web Speech API (non-standard in lib.dom)
type SRResultItem = { isFinal: boolean; 0: { transcript: string } };
type SREvent = { resultIndex: number; results: { length: number; [index: number]: SRResultItem } };
type SRLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SRCtor = new () => SRLike;

function speechCtor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function RealCapture({ id }: { id: string }) {
  const [phase, setPhase] = useState<"loading" | "armed" | "live" | "done" | "missing">("loading");
  const [ev, setEv] = useState<DemoEvent | null>(null);
  const [simSec, setSimSec] = useState(0);
  const [feeds, setFeeds] = useState<FeedLine[]>([]);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [sttError, setSttError] = useState<string | null>(null);
  const [sp, setSp] = useState<number | "self">(0);
  const [result, setResult] = useState<Meeting | null>(null);

  const recRef = useRef<SRLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const startedAtRef = useRef(0);
  const recRecording = useRef(false);
  const spRef = useRef<number | "self">(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    spRef.current = sp;
  }, [sp]);

  useEffect(() => {
    const mapId = id.startsWith("real-") ? id.slice("real-".length) : id;
    const demoId = demoIdForRealEvent(mapId);
    const found = demoId ? loadDemoStore().events.find((e) => e.id === demoId) : null;
    if (found) {
      setEv(found);
      setPhase("armed");
    } else {
      setPhase("missing");
    }
  }, [id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [feeds, interim]);

  // real clock while capturing
  const [recording, setRecording] = useState(false);
  useEffect(() => {
    recRecording.current = recording;
    if (!recording) return;
    const started = Date.now();
    startedAtRef.current = started;
    const timer = setInterval(() => setSimSec((Date.now() - started) / 1000), 500);
    return () => clearInterval(timer);
  }, [recording]);

  // stop everything when the page goes away mid-capture
  useEffect(
    () => () => {
      recRecording.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* already stopped */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const words = feeds.reduce((n, l) => n + l.text.trim().split(/\s+/).length, 0);

  async function startCapture() {
    if (!ev) return;
    setSttError(null);
    // 1. tab/screen audio — the honest in-browser path; the user picks the Meet tab
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      setSttError(
        "Tab sharing was cancelled or is unavailable — Minutes needs the Meet tab, with “share tab audio” on.",
      );
      return;
    }
    streamRef.current = stream;
    stream.getVideoTracks().forEach((t) => t.stop()); //Minutes only needs audio
    setRecording(true);
    setPhase("live");

    // 2. live level meter — a dead bar means the tab was shared without audio
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const read = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        rafRef.current = requestAnimationFrame(read);
      };
      rafRef.current = requestAnimationFrame(read);
    } catch {
      /* meter is best-effort */
    }

    // 3. browser speech recognition over the tab audio
    const Ctor = speechCtor();
    if (!Ctor) {
      setSttError(
        "This browser has no speech recognition — capture a real call in Chrome or Edge.",
      );
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let draft = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript.trim();
        if (!text) continue;
        if (r.isFinal) {
          setFeeds((f) => [
            ...f,
            { sp: spRef.current, text, t: (Date.now() - startedAtRef.current) / 1000 },
          ]);
          draft = "";
        } else {
          draft += " " + text;
        }
      }
      setInterim(draft.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setSttError("Recognition was refused — grant the speech permission and start the capture again.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setSttError(`Recognition hiccup (${e.error}) — still listening.`);
      }
    };
    // Chrome ends long sessions on its own — start again while capture holds
    rec.onend = () => {
      if (recRecording.current) {
        try {
          rec.start();
        } catch {
          /* already restarting */
        }
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      /* already started */
    }
  }

  function stopCapture() {
    if (!ev || feeds.length === 0) return;
    recRecording.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(rafRef.current);
    setRecording(false);
    const meeting = recordBooking(ev.id, feeds);
    if (meeting) setResult(meeting);
    setPhase("done");
  }

  // ── states ────────────────────────────────────────────────────────────────

  if (phase === "loading") return null;

  if (phase === "missing")
    return (
      <div className="mx-auto max-w-3xl px-4 pt-14">
        <div className="pane p-6">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium">
            This real event isn&rsquo;t armed in this browser
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
            Arm it from{" "}
            <Link href="/book" className="underline underline-offset-2">
              the booking page
            </Link>{" "}
            (connect Google Calendar → Arm Minutes on your real event) — the armed link belongs
            to the browser that armed it.
          </p>
          <Link href="/" className="mt-4 inline-block text-[13.5px] text-ink-soft hover:text-ink">
            Back to meetings
          </Link>
        </div>
      </div>
    );

  if (!ev) return null;
  const event = demoEventUpcoming(ev);
  const speakers = speakersOf(ev.spec);
  const meetLink = ev.spec.meetLink;

  if (phase === "done" && result)
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <CaptureSummary
          event={event}
          preview={{
            summary: result.summaries[result.defaultTemplate],
            actionItems: result.actionItems,
            highlights: result.highlights,
          }}
          capturedLabel={hms(Math.round(simSec))}
          capturedNote="of real audio, captured"
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      {/* ── header ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">
            {event.platform} · starts {fmtTime(event.startedAt)}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
            {event.title}
          </h1>
        </div>
        <span className="rounded-full bg-record-soft px-2.5 py-1 text-[12.5px] font-medium text-record">
          real call — captured in this browser
        </span>
      </div>

      {phase === "armed" && (
        <div className="pane p-6">
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Minutes is armed for the real {event.platform} call. Join the call in another tab,
            start the capture here, and pick <strong>that tab with “share tab audio” on</strong> —
            Minutes listens, transcribes live, and writes the minutes when you end the capture.
            Nothing joins Meet headlessly (a browser page can&rsquo;t); this is the system-audio
            path the real desktop product takes, in-tab instead.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={startCapture}
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
            >
              ▶ Start capture
            </button>
            {meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line bg-raised px-4 py-2.5 text-[13.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
              >
                Open the Google Meet call ↗
              </a>
            )}
            <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
              Back to meetings
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-ink-faint">
            On the call: {[...speakers.filter((s) => !s.self).map((s) => s.name)].join(", ") ||
              "no attendees booked"}
            {" "}· best in Chrome or Edge · this event is on your real calendar.
          </p>
        </div>
      )}

      {phase === "live" && (
        <div>
          {/* status bar */}
          <div className="pane flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span className="flex items-center gap-2 text-[13.5px] font-medium">
              <span className="rec-dot size-2 rounded-full bg-record" aria-hidden />
              Capturing
            </span>
            <span className="font-mono text-[13.5px] tabular-nums text-ink">
              {mmss(Math.floor(simSec))}
            </span>
            <span className="flex items-center gap-2" title="Audio level from the shared tab">
              <span className="text-[12px] text-ink-faint">audio</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line-soft">
                <span
                  className="block h-full rounded-full bg-record transition-[width] duration-100"
                  style={{ width: `${Math.round(level * 100)}%` }}
                />
              </span>
            </span>
            <span className="text-[12.5px] text-ink-faint">
              {words.toLocaleString()} words · {feeds.length} turn{feeds.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={stopCapture}
              disabled={feeds.length === 0}
              className="ml-auto rounded-full border border-line bg-raised px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink disabled:opacity-40"
              title={feeds.length === 0 ? "Nothing transcribed yet" : "Minutes writes the minutes"}
            >
              End capture — Minutes writes it ⏭
            </button>
          </div>

          {sttError && (
            <p className="mt-2 rounded-lg border border-line bg-line-soft/60 px-4 py-2 text-[13px] text-ink-soft">
              {sttError}
            </p>
          )}

          {/* speaker attribution — tap the chip when each person speaks */}
          <div className="pane mt-4 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] text-ink-faint">Tag who&rsquo;s speaking:</span>
              {speakers.map((s) => {
                const isSelf = !!s.self;
                const idx: number | "self" = isSelf ? "self" : Number(s.id.replace("g", "")) || 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSp(idx)}
                    aria-pressed={sp === idx}
                    className={
                      "rounded-full px-3 py-1 text-[12.5px] font-medium " +
                      (sp === idx
                        ? "text-paper"
                        : "border border-line bg-raised text-ink-soft hover:text-ink")
                    }
                    style={sp === idx ? { background: s.color } : { boxShadow: `inset 3px 0 0 ${s.color}` }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[12px] text-ink-faint">
              Browser recognition can&rsquo;t tell voices apart — tap a speaker&rsquo;s chip while
              they talk and Minutes attributes each transcribed line to them.
            </p>
          </div>

          {/* live transcript */}
          <div ref={listRef} className="pane mt-4 h-72 overflow-y-auto" aria-label="Live transcript">
            {feeds.length === 0 && !interim ? (
              <p className="px-4 pt-14 text-center text-[13px] text-ink-faint">
                Listening to the shared tab — speak in the Meet call and lines land here.
              </p>
            ) : (
              <ul>
                {feeds.map((l, i) => {
                  const isSelf = l.sp === "self";
                  const s = speakers.find((x) => (l.sp === "self") === !!x.self);
                  return (
                    <li key={i} className="border-b border-line-soft px-4 py-2.5">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span
                          className="text-[12.5px] font-semibold"
                          style={{ color: isSelf ? undefined : s?.color }}
                        >
                          {isSelf ? "You" : s?.name ?? "?"}
                        </span>
                        <span className="font-mono text-[11px] text-ink-faint">
                          {mmss(Math.floor(l.t ?? 0))}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-ink-soft">{l.text}</p>
                    </li>
                  );
                })}
                {interim && (
                  <li className="px-4 py-2.5">
                    <p className="text-[14px] italic leading-relaxed text-ink-faint">{interim}…</p>
                  </li>
                )}
              </ul>
            )}
          </div>
          <p className="mt-2 text-right text-[12px] text-ink-faint">
            real audio from the shared tab · transcription runs in this browser · timestamps are
            the real call&rsquo;s
          </p>
        </div>
      )}
    </div>
  );
}