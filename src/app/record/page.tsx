"use client";

import { bookMeeting, recordBooking, getDemoMeeting, type Attendee } from "@/lib/demo";
import { CaptureSummary } from "@/components/demo/CaptureSummary";
import { fmtDate, fmtTime, mmss } from "@/lib/time";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Give Minutes a RECORDING — a recording, not a live call. The audio never
 * leaves the browser: it's decoded here, resampled, and transcribed by a
 * Whisper model (transformers.js, ONNX/WebAssembly — no API key, no server
 * round-trip, no per-minute cost). Segments land with real timestamps; you
 * tag who spoke in the editor; Minutes then runs the same extraction it runs
 * on captured calls and writes the full report — summary, actions, flagged
 * moments, clips, cited chat, dispatch.
 *
 * The recording stays right where it is, in this browser.
 */

type Segment = { sp: number; text: string; t: number };

type Stage =
  | { kind: "idle" }
  | { kind: "decoding" }
  | { kind: "model"; pct: number }
  | { kind: "transcribing"; done: number; count: number }
  | { kind: "review" }
  | { kind: "error"; message: string };

const GUEST_COLORS = ["#5C6B34", "#5B5E6B", "#B4552D", "#4A6C8C", "#6B4A6E"];

export default function RecordPage() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [people, setPeople] = useState("Priya Mohan, Tom Osei");
  // segment editor state (one entry per transcribed line: sp index, editable text)
  const [segments, setSegments] = useState<Segment[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  useEffect(() => {
    if (stage.kind !== "review" && file) setName(file.name.replace(/\.[^.]+$/, ""));
  }, [file, stage.kind]);

  async function decode(file: File): Promise<Float32Array> {
    const ctx = new AudioContext({ sampleRate: 48000 });
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    // mix to mono
    const mono = ctx.createBuffer(1, decoded.length, decoded.sampleRate);
    const out = mono.getChannelData(0);
    for (let i = 0; i < decoded.length; i++) {
      let sum = 0;
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) sum += decoded.getChannelData(ch)[i];
      out[i] = sum / decoded.numberOfChannels;
    }
    // resample to Whisper's 16 kHz mono
    const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const src = off.createBufferSource();
    src.buffer = mono;
    src.connect(off.destination);
    src.start();
    return (await off.startRendering()).getChannelData(0);
  }

  async function transcribe() {
    if (!file) return;
    setStage({ kind: "decoding" });
    let pcm: Float32Array;
    try {
      pcm = await decode(file);
    } catch {
      setStage({ kind: "error", message: "Couldn't decode that file — export it as an audio file (mp3, m4a, wav, webm, ogg) and try again." });
      return;
    }
    setStage({ kind: "model", pct: 0 });
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    const asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-base.en", {
      dtype: "q8",
      progress_callback: (p: { status: string; progress?: number }) => {
        if (p.status === "progress" && typeof p.progress === "number") setStage({ kind: "model", pct: Math.round(p.progress) });
      },
    });
    setStage({ kind: "transcribing", done: 0, count: 0 });
    try {
      const out = (await asr(pcm, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      })) as { chunks?: { text: string; timestamp: [number, number | null] }[]; text?: string };
      const segs =
        out.chunks
          ?.filter((c) => c.text.trim())
          .map((c) => ({ sp: 0, text: c.text.trim(), t: c.timestamp[0] ?? 0 })) ??
        [(out.text ?? "").trim()].filter(Boolean).map((text, i) => ({ sp: 0, text, t: i }));
      if (segs.length === 0) {
        setStage({ kind: "error", message: "Model heard nothing — try a clearer or louder recording." });
        return;
      }
      setSegments(segs);
      setStage({ kind: "review" });
    } catch (e) {
      setStage({ kind: "error", message: `Transcription failed: ${(e as Error).message.slice(0, 200)}` });
    }
  }

  async function writeMinutes() {
    const attendees: Attendee[] = people
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => ({ name: n }));
    if (attendees.length === 0) return;
    const started = new Date();
    const ev = bookMeeting({
      script: "blank",
      title: name.trim() || "Imported recording",
      platform: "Recording",
      startedAt: started.toISOString(),
      captureMode: "bot-free",
      attendees,
    });
    const meeting = recordBooking(ev.id, segments.map((s) => ({ sp: s.sp, text: s.text, t: s.t })));
    if (!meeting) return;
    setResultId(meeting.id);
  }

  const label = "block text-[12.5px] font-medium mb-1.5";
  const input =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-ink-soft";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <p className="eyebrow mb-2">Recordings</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
        Give Minutes a recording
      </h1>
      <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink-soft">
        A call you already have on disk works the same as a live one: Minutes transcribes
        {" "}(Whisper runs right here in the browser) and writes the full report — the summary,
        action items, flagged moments, clips, the cited chat. Nothing leaves this tab.
      </p>

      {stage.kind === "idle" && (
        <div className="pane mt-6 p-5">
          <label className={label} htmlFor="r-file">Recording file</label>
          <input
            id="r-file"
            type="file"
            accept="audio/*,video/mp4"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-[14px]"
          />
          <p className="mt-1.5 text-[12px] text-ink-faint">
            mp3, m4a, wav, webm, ogg — up to ~30 minutes transcribes in reasonable time; the
            model (~90&nbsp;MB) downloads once.
          </p>
          <div className="mt-4">
            <label className={label} htmlFor="r-people">People in this recording</label>
            <input
              id="r-people"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className={input}
            />
            <p className="mt-1.5 text-[12px] text-ink-faint">
              Browser transcription can&rsquo;t separate voices — after transcribing you tag each
              segment with the person who spoke, here in the editor.
            </p>
          </div>
          <button
            onClick={transcribe}
            disabled={!file}
            className="mt-5 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
          >
            Transcribe the recording
          </button>
          {file && (
            <p className="mt-2 text-[12.5px] text-ink-soft">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>
      )}

      {stage.kind === "decoding" && (
        <div className="pane mt-6 p-5">
          <span className="rec-dot mr-2 inline-block size-2 rounded-full bg-record" aria-hidden />
          Decoding the audio…
        </div>
      )}
      {stage.kind === "model" && (
        <div className="pane mt-6 p-5">
          <p className="text-[14px] font-medium">Loading the Whisper model — once, then cached</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
            <div className="h-full rounded-full bg-record" style={{ width: `${stage.pct}%` }} />
          </div>
          <p className="mt-1 font-mono text-[12px] text-ink-faint">{stage.pct}%</p>
        </div>
      )}
      {stage.kind === "error" && (
        <div className="pane mt-6 p-5">
          <p className="text-[14px] text-ink">{stage.message}</p>
          <button
            onClick={() => {
              setStage({ kind: "idle" });
            }}
            className="mt-3 rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
          >
            Start over
          </button>
        </div>
      )}

      {stage.kind === "review" && (
        <>
          <div className="pane mt-6 p-5">
            <p className="eyebrow mb-2">Tag the voices</p>
            <ul className="divide-y divide-line-soft">
              {segments.map((seg, i) => (
                <li key={i} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-start">
                  <span className="w-14 shrink-0 pt-1 font-mono text-[11px] text-ink-faint">
                    {mmss(Math.floor(seg.t))}
                  </span>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 flex-wrap gap-1" role="radiogroup" aria-label={`Speaker for segment ${i + 1}`}>
                      {people
                        .split(",")
                        .map((n) => n.trim())
                        .filter(Boolean)
                        .map((n, gi) => (
                          <button
                            key={gi}
                            onClick={() =>
                              setSegments((list) => list.map((s, j) => (j === i ? { ...s, sp: gi } : s)))
                            }
                            aria-pressed={seg.sp === gi}
                            className={
                              "rounded-full px-2.5 py-1 text-[11.5px] font-medium " +
                              (seg.sp === gi
                                ? "text-paper"
                                : "border border-line bg-raised text-ink-soft hover:text-ink")
                            }
                            style={seg.sp === gi ? { background: GUEST_COLORS[gi % GUEST_COLORS.length] } : { boxShadow: `inset 3px 0 0 ${GUEST_COLORS[gi % GUEST_COLORS.length]}` }}
                          >
                            {n}
                          </button>
                        ))}
                    </div>
                    {editing === i ? (
                      <textarea
                        autoFocus
                        value={seg.text}
                        onChange={(e) =>
                          setSegments((list) => list.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)))
                        }
                        onBlur={() => setEditing(null)}
                        rows={Math.max(2, Math.ceil(seg.text.length / 60))}
                        className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2 py-1 text-[13.5px] leading-relaxed text-ink-soft focus:border-ink-soft focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditing(i)}
                        className="min-w-0 flex-1 text-left text-[14px] leading-relaxed text-ink-soft hover:text-ink"
                        title="Fix anything the model misheard"
                      >
                        {seg.text}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-ink-faint">
              Tap a speaker, then tap each segment&rsquo;s voice; tap the words to fix anything the
              model misheard — Minutes cites these timestamps, so it pays to be accurate.
            </p>
          </div>
          <div className="pane mt-4 p-5">
            <label className={label} htmlFor="r-title">The meeting&rsquo;s title</label>
            <input id="r-title" value={name} onChange={(e) => setName(e.target.value)} className={input} />
            <p className="mt-3 text-[12.5px] text-ink-soft">
              {fmtDate(new Date().toISOString())} {fmtTime(new Date().toISOString())} · written from this recording
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void writeMinutes()}
              className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper hover:opacity-90"
            >
              Write the minutes from this recording
            </button>
            <button
              onClick={() => {
                setStage({ kind: "idle" });
                setSegments([]);
              }}
              className="rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
            >
              Start over
            </button>
          </div>
        </>
      )}

      {/* done: the same report a captured call gets */}
      {resultId && segments.length > 0 && (
        <div className="mt-8">
          <p className="eyebrow mb-3">Written from the recording</p>
          <RecordedResult resultId={resultId} />
          <div className="mt-5">
            <Link href="/" className="text-[13.5px] text-ink-soft hover:text-ink">
              Back to meetings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordedResult({ resultId }: { resultId: string }) {
  // fresh read from the store the write just saved
  const [meeting, setMeeting] = useState<null | Parameters<typeof CaptureSummary>[0]["preview"]>(null);
  useEffect(() => {
    const m = getDemoMeeting(resultId);
    if (m) setMeeting({ summary: m.summaries[m.defaultTemplate], actionItems: m.actionItems, highlights: m.highlights });
  }, [resultId]);
  if (!meeting) return null;
  return (
    <CaptureSummary
      event={{ id: resultId, captureMode: "bot-free" }}
      preview={meeting}
      capturedLabel="minutes in"
      capturedNote="from the recording"
    />
  );
}