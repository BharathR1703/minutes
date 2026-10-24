import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase: real accounts on a real Postgres. Data plane uses the publishable
 * key; Row Level Security scopes every table to the signed-in user, so the
 * browser can talk to the database directly without a server middle layer.
 *
 * dbReady is false until the schema has run (see scripts/supabase-schema.sql
 * and the note on /signin) — auth still works; data sync waits for tables.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anon
    ? createClient(url, anon, { auth: { persistSession: true, detectSessionInUrl: false } })
    : null;

export const dbReady = !!supabase;

/** One row of the per-user application data table. */
export type MinutesRow = {
  user_id: string;
  id: string;
  kind: "event" | "meeting" | "armed";
  payload: unknown;
  updated_at: string;
};

/** Is the minutes_rows table live? (false until the schema has been run) */
export async function tablesReady(): Promise<boolean> {
  if (!supabase) return false;
  const { error, count } = await supabase
    .from("minutes_rows")
    .select("id", { count: "exact", head: true });
  // count queries succeed (0 rows is fine); the error is the missing table
  return !error && (count === null || typeof count === "number");
}