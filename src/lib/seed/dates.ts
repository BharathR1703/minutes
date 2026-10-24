// Seed dates are anchored to the day the server started, not hardcoded dates —
// so the demo always shows a fresh "Today" bucket, armed upcoming calls and a
// deal decision next Thursday, no matter when it is opened. Spoken dialogue
// keeps its weekday words, and the anchor below keeps those words true:
// the discovery call always fell on a Friday, the eval check-in on a Thursday.

const NOW = new Date();

/** n days back, at a fixed local clock time */
export function daysAgo(n: number, hh = 14, mm = 30): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

/** n days ahead, at a fixed local clock time */
export function daysAhead(n: number, hh = 15, mm = 0): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

/** an action-item due date, `days` after the meeting it came from */
export function dueIn(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Nov 3" — for copy that has to name a date */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** days until the upcoming Thursday (0 → today is Thursday, we treat next Thu) */
export function thursdayAhead(): number {
  return ((4 - NOW.getDay() + 7) % 7) || 7;
}