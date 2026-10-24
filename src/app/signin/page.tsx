"use client";

import { accountState, signOut } from "@/lib/store-sync";
import { supabase } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Real accounts on Supabase Auth. Sign in and sign up are the same door —
 * email → 6-digit code → session (new addresses get an account on the way
 * in). A password path exists for confirmed accounts; Google sign-in lights
 * up once the OAuth client is configured for the Supabase project.
 */
export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<string | null>(null);

  useEffect(() => {
    void accountState().then((s) => {
      if (s.email) {
        setSignedIn(s.email);
        setStep("done");
      }
    });
  }, []);

  async function sendCode() {
    if (!supabase) {
      setError("Supabase isn't configured on this deployment.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/signin` : undefined },
    });
    setBusy(false);
    if (err) {
      setError(err.message === "Signups not allowed for this instance" ? "New sign-ups are disabled on this Supabase project — enable email sign-ups in the dashboard." : err.status === 429 ? "Too many codes sent — wait a minute and try again (Supabase's built-in mailer is rate-limited on free projects)." : err.message);
      return;
    }
    setNotice(`A 6-digit code is on its way to ${email} — sign up and sign in are the same door here.`);
    setStep("code");
  }

  async function verify() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setBusy(false);
    if (err) {
      setError(err.message.includes("invalid") ? "That code doesn't match — check the digits and try again." : err.message);
      return;
    }
    router.push("/");
  }

  async function withPassword() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message === "Email not confirmed" ? "That email is registered but not confirmed — use the code method once and it's confirmed." : err.message);
    else router.push("/");
  }

  async function withGoogle() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/book` },
    });
    setBusy(false);
    if (err) setError("Google sign-in needs the Google provider enabled on the Supabase project (Authentication → Providers → Google, with the OAuth client credentials).");
  }

  const label = "block text-[12.5px] font-medium mb-1.5";
  const input =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-ink-soft";

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-10 sm:px-6">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight">
        {signedIn ? "Signed in" : "Sign in or create an account"}
      </h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
        {signedIn
          ? "Your booked calls and their minutes sync to your account's own Postgres rows (isolated by the database's row-level security) — they follow you to any browser."
          : "Your booked calls live in this browser now. Sign in and they attach to a real account on a real database — same app, but they follow you and survive a cleared cache."}
      </p>

      <div className="pane mt-6 space-y-4 p-5">
        {notice && <p className="rounded-lg border border-line bg-line-soft/60 px-4 py-2 text-[13px] text-ink-soft">{notice}</p>}
        {error && <p className="rounded-lg border border-line bg-record-soft/40 px-4 py-2 text-[13px] text-ink-soft">{error}</p>}

        {step === "done" && signedIn ? (
          <div>
            <p className="text-[14px]">
              Signed in as <span className="font-medium">{signedIn}</span>
            </p>
            <button
              onClick={() =>
                void signOut().then(() => {
                  setSignedIn(null);
                  setStep("email");
                  router.push("/");
                })
              }
              className="mt-4 rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:border-record hover:text-record"
            >
              Sign out
            </button>
          </div>
        ) : step === "email" ? (
          <>
            <button
              onClick={withGoogle}
              disabled={busy}
              className="w-full rounded-lg border border-line bg-raised px-4 py-2.5 text-[14px] font-medium hover:border-ink-soft disabled:opacity-40"
            >
              <span aria-hidden className="mr-2 font-semibold" style={{ color: "#4285F4" }}>
                G
              </span>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 text-[12px] text-ink-faint">
              <span className="h-px flex-1 bg-line-soft" /> or by email <span className="h-px flex-1 bg-line-soft" />
            </div>
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
            <button
              onClick={sendCode}
              disabled={busy || !email.trim()}
              className="w-full rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Sending…" : "Email me a 6-digit code"}
            </button>
            <details>
              <summary className="cursor-pointer text-[12.5px] text-ink-soft hover:text-ink">
                Password sign-in (if you created one before)
              </summary>
              <div className="mt-2 space-y-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  className={input}
                />
                <button
                  onClick={withPassword}
                  disabled={busy || !password || !email.trim()}
                  className="w-full rounded-full border border-line bg-raised px-4 py-2 text-[13.5px] font-medium text-ink-soft hover:text-ink disabled:opacity-40"
                >
                  Sign in with password
                </button>
              </div>
            </details>
          </>
        ) : (
          <>
            <p className="text-[13.5px] text-ink-soft">
              Check <span className="font-medium">{email}</span> for the code.
            </p>
            <div>
              <label className={label} htmlFor="s-code">6-digit code</label>
              <input
                id="s-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className={input}
              />
            </div>
            <button
              onClick={verify}
              disabled={busy || code.length < 6}
              className="w-full rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Checking…" : "Verify and sign in"}
            </button>
            <button
              onClick={() => setStep("email")}
              className="w-full text-[12.5px] text-ink-soft hover:text-ink"
            >
              Wrong email? Start over
            </button>
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