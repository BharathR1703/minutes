"use client";

import { accountState, signOut } from "@/lib/store-sync";
import { supabase } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Real accounts on Supabase Auth — plain email + password, one door:
 * you create the account with a password, and that same password signs you
 * in from then on. Nothing is ever emailed for auth; the database enforces
 * row-level security per user.
 */
export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<string | null>(null);

  useEffect(() => {
    void accountState().then((s) => {
      if (s.email) {
        setSignedIn(s.email);
      }
    });
  }, []);

  function reset() {
    setNotice(null);
    setError(null);
  }

  async function submit() {
    if (!supabase) {
      setError("Supabase isn't configured on this deployment.");
      return;
    }
    setBusy(true);
    reset();
    const { data, error: err } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      if (err.message === "Email not confirmed") {
        setError(
          "That email is registered but its confirmation mail hasn't been clicked — disable 'Confirm email' in Supabase → Authentication → Providers → Email to skip mail entirely.",
        );
      } else if (err.message.toLowerCase().includes("invalid login")) {
        setError("Email or password doesn't match an account.");
      } else if (err.message.toLowerCase().includes("already registered")) {
        setError("That email already has an account — switch to Sign in.");
      } else if (err.status === 429) {
        setError("The sign-up was received but its confirmation mail is rate-limited — wait a few minutes. Once 'Confirm email' is disabled in the Supabase dashboard this never applies: no mail is involved at all.");
      } else {
        setError(err.message);
      }
      return;
    }
    if (mode === "signup" && !data.session) {
      // server requires email confirmation before the first session
      setNotice(
        "Account created — but this Supabase project asks for an email confirmation on sign-up. Open the link it just sent, or disable 'Confirm email' in the dashboard to make accounts password-only.",
      );
      setMode("signin");
      return;
    }
    setSignedIn(email);
    router.push("/");
  }

  const label = "block text-[12.5px] font-medium mb-1.5";
  const input =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-ink-soft";

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-10 sm:px-6">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
        {signedIn ? "Signed in" : mode === "signup" ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
        {signedIn
          ? "Your booked calls and their minutes sync to your account's own Postgres rows (isolated by the database's row-level security) — they follow you to any browser."
          : "Email and a password — nothing is sent to your inbox, no codes. Create an account once with a password; that same password signs you in everywhere."}
      </p>

      <div className="pane mt-6 space-y-4 p-5">
        {notice && <p className="rounded-lg border border-line bg-line-soft/60 px-4 py-2 text-[13px] text-ink-soft">{notice}</p>}
        {error && <p className="rounded-lg border border-line bg-record-soft/40 px-4 py-2 text-[13px] text-ink-soft">{error}</p>}

        {signedIn ? (
          <div>
            <p className="text-[14px]">
              Signed in as <span className="font-medium">{signedIn}</span>
            </p>
            <button
              onClick={() =>
                void signOut().then(() => {
                  setSignedIn(null);
                  setMode("signin");
                })
              }
              className="mt-4 rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:border-record hover:text-record"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 rounded-full border border-line bg-raised p-1" role="tablist" aria-label="Account mode">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    reset();
                  }}
                  className={
                    "flex-1 rounded-full px-3 py-1.5 text-[13.5px] font-medium " +
                    (mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
                  }
                >
                  {m === "signin" ? "Sign in" : "Create an account"}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="space-y-3"
            >
              <div>
                <label className={label} htmlFor="s-email">Email</label>
                <input
                  id="s-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={input}
                />
              </div>
              <div>
                <label className={label} htmlFor="s-password">Password</label>
                <input
                  id="s-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  className={input}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !email.trim() || password.length < 6}
                className="w-full rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-4 text-[12px] text-ink-faint">
        Auth by Supabase (GoTrue). Sessions stay in this browser; the database enforces
        row-level security per user.
      </p>
    </div>
  );
}