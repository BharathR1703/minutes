"use client";

import { MEETING_TEMPLATES } from "@/lib/templates";
import { upcomingEvents } from "@/lib/data";
import { accountState, signOut } from "@/lib/store-sync";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Settings: the two decisions Fathom hides — how capture happens, and what a summary looks like. */
export default function SettingsPage() {
  const upcoming = upcomingEvents();
  const connected = upcoming.length > 0;
  const [mode, setMode] = useState<"free" | "bot">("free");
  const [template, setTemplate] = useState("standard");
  const [acct, setAcct] = useState<{ email: string | null } | "loading">("loading");

  useEffect(() => {
    void accountState().then((s) => setAcct({ email: s.email }));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
        Settings
      </h1>

      {/* ── account ──────────────────────────────────────────────────── */}
      <section className="mt-8" aria-labelledby="account-h">
        <h2 id="account-h" className="eyebrow mb-3">
          Account
        </h2>
        <div className="pane p-5">
          {acct === "loading" ? (
            <p className="text-[13px] text-ink-faint">Checking…</p>
          ) : acct.email ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[14px]">
                  Signed in as <span className="font-medium">{acct.email}</span>
                </p>
                <p className="mt-1 text-[12.5px] text-ink-soft">
                  Booked calls and their minutes write through to your own rows in Postgres
                  (Supabase), isolated by row-level security.
                </p>
              </div>
              <button
                onClick={() =>
                  void signOut().then(() => setAcct({ email: null }))
                }
                className="shrink-0 rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:border-record hover:text-record"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
                No account signed in — bookings live in this browser only. Sign in and they
                attach to your account instead.
              </p>
              <Link
                href="/signin"
                className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper hover:opacity-90"
              >
                Sign in or create one
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── capture mode ─────────────────────────────────────────────── */}
      <section className="mt-8" aria-labelledby="capture-h">
        <h2 id="capture-h" className="eyebrow mb-3">
          Capture
        </h2>
        <div className="space-y-3">
          <CaptureCard
            on={false}
            name="Notetaker bot joins"
            desc="A visible participant joins Zoom, Meet or Teams and records. Works everywhere; shows up in the attendee list."
            chosen={mode === "bot"}
            onChoose={() => setMode("bot")}
          />
          <CaptureCard
            on
            name="Bot-free capture"
            desc="Minutes records your local system audio and mic — no bot in the call, nothing for guests to notice. Choose per-meeting; this is the default here."
            chosen={mode === "free"}
            onChoose={() => setMode("free")}
          />
        </div>
        <p className="mt-3 text-[13px] text-ink-faint">
          Per-meeting choice, not a plan tier: the flag lives on each upcoming call and you can
          switch it until the moment it starts.
        </p>
      </section>

      {/* ── default template ─────────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="template-h">
        <h2 id="template-h" className="eyebrow mb-3">
          Default summary template
        </h2>
        <div className="flex flex-wrap gap-2">
          {MEETING_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={
                "rounded-full border px-3 py-1.5 text-[13px] hover:border-ink-soft " +
                (t.id === template
                  ? "border-record bg-record-soft font-medium text-record"
                  : "border-line bg-raised text-ink-soft")
              }
            >
              {t.name}
              {t.id === template ? " — default" : ""}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-faint">
          A template is only a guess; any meeting lets you switch after the fact and every switch
          keeps the same citations into the recording.
        </p>
      </section>

      {/* ── calendar ─────────────────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="cal-h">
        <h2 id="cal-h" className="eyebrow mb-3">
          Calendar
        </h2>
        <div className="pane flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[14px] font-medium">
              {connected ? "Google Calendar — connected" : "No calendar connected"}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-faint">
              {connected
                ? `${upcoming.length} upcoming events watched for capture`
                : "Connect to arm upcoming calls automatically"}
            </p>
          </div>
          <span
            className={
              "rounded-full px-2.5 py-1 text-[12px] font-medium " +
              (connected ? "bg-ok-soft text-ok" : "bg-line-soft text-ink-soft")
            }
          >
            {connected ? "armed" : "not connected"}
          </span>
        </div>
      </section>

      <footer className="mt-12 border-t border-line pt-4 text-[12.5px] text-ink-faint">
        This demo build stubs the capture layer — see the walkthrough for what is real.
      </footer>
    </div>
  );
}

function CaptureCard({
  name,
  desc,
  on,
  chosen,
  onChoose,
}: {
  name: string;
  desc: string;
  on?: boolean;
  chosen?: boolean;
  onChoose?: () => void;
}) {
  return (
    <button
      onClick={onChoose}
      aria-pressed={chosen}
      className={
        "pane flex w-full items-start gap-3 px-4 py-3.5 text-left hover:border-ink-soft " +
        (chosen ? "border-record" : "")
      }
    >
      <span
        aria-hidden
        className={
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border " +
          (chosen ? "border-record" : "border-line")
        }
      >
        {chosen && <span className="size-2 rounded-full bg-record" />}
      </span>
      <div>
        <p className="text-[14.5px] font-medium">
          {name}{" "}
          {!on && (
            <span className="ml-1 rounded bg-ok-soft px-1.5 py-px text-[11px] font-medium text-ok">
              our default
            </span>
          )}
          {chosen && <span className="ml-1 text-[12px] text-ink-faint">— set for new events</span>}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{desc}</p>
      </div>
    </button>
  );
}