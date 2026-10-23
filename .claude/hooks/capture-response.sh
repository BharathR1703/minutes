#!/bin/bash
# Capture hook: runs on Stop.
# 1. Appends the latest assistant response (from the session transcript) to
#    .agent-logs/responses.jsonl
# 2. Snapshots the full session transcript into .agent-logs/transcripts/
# 3. Commits .agent-logs/ so logs land incrementally, not in one lump.
ROOT=/Users/bharathr/programming/fathom
LOGS="$ROOT/.agent-logs"
mkdir -p "$LOGS/transcripts"

t=$(jq -r '.transcript_path // empty' 2>/dev/null)
if [ -n "$t" ] && [ -f "$t" ]; then
  # Latest assistant turn with actual text content
  tail -200 "$t" \
    | jq -c 'select(.type=="assistant")
             | select(.message.content|type=="array")
             | select([.message.content[]? | select(.type=="text")] | length > 0)
             | {ts: .timestamp, session: .sessionId,
                response: ([.message.content[] | select(.type=="text") | .text] | join("\n"))}' \
    | tail -1 >> "$LOGS/responses.jsonl" 2>/dev/null
  # Full transcript snapshot
  cp "$t" "$LOGS/transcripts/$(jq -r '.session_id // "session"' 2>/dev/null | tr -cd 'a-zA-Z0-9-').jsonl"
fi

# Commit the logs as we go
if [ -d "$LOGS" ]; then
  git -C "$ROOT" add .agent-logs >/dev/null 2>&1
  git -C "$ROOT" diff --cached --quiet -- .agent-logs \
    || git -C "$ROOT" commit -m "agent-log: capture update $(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null 2>&1
fi

echo '{"suppressOutput": true}'