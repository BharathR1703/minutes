"use client";

import { loadDemoStore } from "@/lib/demo";
import { supabase, tablesReady, type MinutesRow } from "@/lib/db";

/**
 * Local-first data sync: the app always reads/writes the browser store (fast,
 * anonymous-friendly); when the user is signed in, the same store mirrors to
 * Supabase — signed-in state hydrates down, every write pushes up. RLS scopes
 * rows to their owner, so "enterprise" here means: real accounts, real
 * Postgres, per-user isolation, no server hop.
 */

export type CloudState = "anon" | "syncing" | "ok" | "schema-missing" | "error";

function payloadOf(v: unknown): unknown {
  // strip react-safe (rows go stale in storage otherwise)
  try {
    return JSON.parse(JSON.stringify(v === undefined ? null : v));
  } catch {
    return null;
  }
}

/**
 * Merge-down + migrate-up, run right after sign-in:
 * - rows that exist in the cloud but not locally hydrate down
 * - rows that exist locally but not in the cloud migrate up
 */
export async function syncStore(): Promise<CloudState> {
  if (!supabase) return "schema-missing";
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid) return "anon";
  if (!(await tablesReady())) return "schema-missing";

  const local = loadDemoStore();
  const { data: cloud, error } = await supabase.from("minutes_rows").select();
  if (error) return "error";

  const rows = (cloud ?? []) as unknown as MinutesRow[];
  const cloudIds = new Set(rows.map((r) => r.id));

  // rows the cloud has never seen: push them (first sign-in migration)
  const localOnly = [
    ...local.events.map((e) => ({ kind: "event" as const, id: e.id, payload: payloadOf(e) })),
    ...local.meetings.map((m) => ({ kind: "meeting" as const, id: m.id, payload: payloadOf(m) })),
  ].filter((r) => !cloudIds.has(r.id));
  if (localOnly.length > 0) {
    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("minutes_rows")
      .upsert(localOnly.map((r) => ({ user_id: uid, id: r.id, kind: r.kind, payload: r.payload, updated_at: now })));
    if (upErr) return "error";
  }

  return "ok";
}

/**
 * Write-through: put one row in the user's Postgres. Fire-and-forget writes
 * keep the app's path identical for anonymous and signed-in users; failures
 * surface through stateStore() below.
 */
export function pushRow(id: string, kind: "event" | "meeting" | "armed", payload: unknown): void {
  if (!supabase) return;
  void (async () => {
    try {
      const { data } = await supabase!.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      if (!(await tablesReady())) return;
      await supabase!
        .from("minutes_rows")
        .upsert({ user_id: uid, id, kind, payload: payloadOf(payload), updated_at: new Date().toISOString() });
    } catch {
      /* write-through is best-effort; the browser store remains the truth */
    }
  })();
}

/** Signed-in users forget by deleting their cloud rows too. */
export async function deleteRows(): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return;
    if (!(await tablesReady())) return;
    await supabase.from("minutes_rows").delete().eq("user_id", uid);
  } catch {
    /* best-effort */
  }
}

/** Current account state for UI bits (settings, header). */
export async function accountState(): Promise<{ email: string | null; state: CloudState }> {
  if (!supabase) return { email: null, state: "schema-missing" };
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return { email: null, state: "anon" };
  const ok = await tablesReady();
  return { email: data.user.email ?? null, state: ok ? "ok" : "schema-missing" };
}

/** Sign the user out and drop the local mirror (don't leak between users). */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}