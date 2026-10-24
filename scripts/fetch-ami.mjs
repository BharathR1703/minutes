// Fetch real meeting utterances from the AMI Meeting Corpus (Hugging Face,
// edinburghcstr/ami, ihm config, test split) via the datasets-server /rows API.
// Groups consecutive rows into meetings and keeps the richest ones.
import { mkdirSync, writeFileSync } from "node:fs";

const CFG = "https://datasets-server.huggingface.co/rows?dataset=edinburghcstr%2Fami&config=ihm&split=test";
mkdirSync("/tmp/ami-cache", { recursive: true });

const perMeeting = new Map(); // meeting_id -> utterances
const wanted = 3; // meetings
const minUtterances = 150;
let total = 0;

for (let offset = 0; offset < 12643; offset += 100) {
  let res;
  let ok = false;
  for (let attempt = 0; attempt < 6 && !ok; attempt++) {
    try {
      res = await fetch(`${CFG}&offset=${offset}&length=100`);
      if (res.ok) ok = true;
      else if (res.status === 429) {
        console.error(`\npage ${offset}: 429, waiting 20s (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, 20_000));
      } else {
        console.error(`\npage ${offset}: HTTP ${res.status}`);
        break;
      }
    } catch (e) {
      console.error(`\npage ${offset}: ${e}`);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }
  if (!ok) {
    console.error(`\npage ${offset}: giving up`);
    break;
  }
  const json = await res.json();
  const rows = json.rows ?? [];
  if (rows.length === 0) break;
  for (const { row } of rows) {
    total++;
    const arr = perMeeting.get(row.meeting_id) ?? [];
    perMeeting.set(row.meeting_id, arr);
    arr.push({
      t: row.begin_time,
      end: row.end_time,
      speaker: row.speaker_id,
      text: row.text,
    });
  }
  const solid = [...perMeeting.values()].filter((a) => a.length >= minUtterances).length;
  process.stdout.write(`\rpage ${offset}: ${total} rows, ${perMeeting.size} meetings, ${solid} solid   `);
  if (solid >= wanted) break;
}
console.log(`\nneed ${wanted} meetings; have: ${[...perMeeting.entries()].map(([id, a]) => `${id}:${a.length}`).join(" ")}`);

// keep the richest meetings, cap per meeting so the TS seed file stays sane
const chosen = [...perMeeting.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, wanted)
  .map(([id, utts]) => {
    utts.sort((a, b) => a.t - b.t);
    // merge consecutive same-speaker segments with tiny gaps into readable turns
    const merged = [];
    for (const u of utts) {
      const prev = merged[merged.length - 1];
      if (prev && prev.speaker === u.speaker && u.t - prev.end < 2 && merged.length < 400) {
        prev.end = u.end;
        prev.text += (prev.text.endsWith(",") || prev.text.endsWith("?") || prev.text.endsWith(".") ? " " : " ") + u.text;
      } else {
        merged.push({ ...u });
      }
    }
    return { id, utterances: merged.map(({ end, ...k }) => ({ ...k, dur: Math.max(0.4, Math.round((end - k.t) * 10) / 10), text: end === undefined ? k.text : k.text })) };
  });

writeFileSync("/tmp/ami-cache/ami.json", JSON.stringify(chosen, null, 1));
console.log(`wrote /tmp/ami-cache/ami.json: ${chosen.map((m) => `${m.id} (${m.utterances.length} turns)`).join(", ")}`);
for (const m of chosen) {
  const utts = m.utterances;
  const dur = utts.length ? Math.max(...utts.map((u) => u.t + u.dur)) : 0;
  console.log(`${m.id}: ${utts.length} turns, last end ${Math.round(dur)}s, speakers ${[...new Set(utts.map((u) => u.speaker))].join(", ")}`);
}
console.log("sample:", JSON.stringify(chosen[0]?.utterances?.slice(0, 3), null, 1));