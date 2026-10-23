import type { Utterance } from "@/lib/model";

// Transcripts are authored with a builder so timestamps stay consistent with
// a natural speaking cadence (~2.6 words/sec) instead of hand-counted.
export function builder() {
  let t = 0;
  const lines: Utterance[] = [];
  return {
    say(speaker: string, text: string) {
      const words = text.split(/\s+/).length;
      const dur = Math.max(1.8, Math.round((words / 2.6) * 10) / 10);
      lines.push({ t: Math.round(t), dur, speaker, text });
      t += dur + 0.9;
    },
    /** silence: screen-share stretch, pause, or side conversation */
    gap(sec: number) {
      t += sec;
    },
    get end() {
      return Math.round(t);
    },
    built: () => lines,
  };
}

export function mmss(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? h + ":" : ""}${mm}:${String(s).padStart(2, "0")}`;
}