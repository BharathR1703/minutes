import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";

export function TopBar() {
  return (
    <header className="rule sticky top-0 z-40 bg-paper">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-baseline gap-1 text-xl leading-none"
          aria-label="Minutes home"
        >
          <span
            className="font-[family-name:var(--font-display)] font-semibold tracking-tight"
            style={{ fontOpticalSizing: "auto" }}
          >
            Minutes
          </span>
          <span aria-hidden className="rec-dot size-1.5 translate-y-[-2px] rounded-full bg-record" />
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-sm">
          <Link href="/" className="text-ink-soft hover:text-ink">
            Meetings
          </Link>
          <Link
            href="/search"
            className="hidden text-ink-soft hover:text-ink sm:block"
          >
            Search
          </Link>
          <SearchForm />
          <Link
            href="/settings"
            className="text-ink-soft hover:text-ink"
            aria-label="Settings"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}