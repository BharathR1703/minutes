"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SearchForm() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={submit} role="search" className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search everything said…"
        aria-label="Search meetings"
        className="w-40 rounded-full border border-line bg-raised py-1.5 pl-3 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:outline focus-visible:outline-record sm:w-56"
      />
      {open && q.trim() && (
        <div className="absolute right-0 top-10 w-64 rounded-lg border border-line bg-raised px-3 py-2 text-xs leading-relaxed text-ink-soft shadow-lg">
          <span className="text-ink">Search &ldquo;{q.trim()}&rdquo; across every transcript, decision and action item</span> —{" "}
          <button
            type="submit"
            className="font-medium text-record underline underline-offset-2"
          >
            run it
          </button>
        </div>
      )}
    </form>
  );
}