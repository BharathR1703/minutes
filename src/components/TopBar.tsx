"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchForm } from "@/components/SearchForm";

export function TopBar() {
  const pathname = usePathname();
  // a shared clip page is read by someone who was never on the call —
  // no app nav, just the wordmark they'll see again if they get access
  const isShare = pathname?.startsWith("/share/");
  return (
    <header className="rule sticky top-0 z-40 bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href={isShare ? "#" : "/"}
          className="flex items-baseline gap-1 text-xl leading-none"
          aria-label={isShare ? "Minutes" : "Minutes home"}
        >
          <span
            className="font-[family-name:var(--font-display)] font-semibold tracking-tight"
            style={{ fontOpticalSizing: "auto" }}
          >
            Minutes
          </span>
          <span aria-hidden className="rec-dot size-1.5 translate-y-[-2px] rounded-full bg-record" />
        </Link>
        {!isShare && (
          <nav className="ml-auto flex items-center gap-5 text-sm">
            <Link href="/" className="text-ink-soft hover:text-ink">
              Meetings
            </Link>
            <Link href="/record" className="text-ink-soft hover:text-ink">
              Recordings
            </Link>
            <Link
              href="/search"
              className="hidden text-ink-soft hover:text-ink sm:block"
            >
              Search
            </Link>
            <Link
              href="/deal/ridgeline-foods"
              className="hidden text-ink-soft hover:text-ink sm:block"
            >
              Deal room
            </Link>
            <SearchForm />
            <Link
              href="/settings"
              className="text-ink-soft hover:text-ink"
              aria-label="Account and settings"
            >
              Settings
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}