"use client";

import { syncStore } from "@/lib/store-sync";
import { supabase } from "@/lib/db";
import { useEffect } from "react";

/**
 * Invisible: hydrates the browser store from the signed-in account's
 * Postgres rows (and migrates local-only rows up on first sign-in), and
 * clears the local store on sign-out so nothing leaks between users.
 */
export function StoreSync() {
  useEffect(() => {
    if (!supabase) return;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      void syncStore();
    };
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) run();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") run();
      if (event === "SIGNED_OUT") {
        done = false;
        try {
          for (const key of ["minutes.demo.v2", "minutes.demo.v1"]) localStorage.removeItem(key);
        } catch {
          /* nothing to clear */
        }
      }
    });
    return () => sub?.subscription.unsubscribe();
  }, []);
  return null;
}