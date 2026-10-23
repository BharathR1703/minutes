#!/bin/bash
# Capture hook: runs on UserPromptSubmit.
# Appends every submitted user prompt to .agent-logs/prompts.jsonl.
ROOT=/Users/bharathr/programming/fathom
LOG="$ROOT/.agent-logs/prompts.jsonl"
mkdir -p "$ROOT/.agent-logs"
jq -c '{ts: (now|todate), session: .session_id, prompt: .prompt}' >> "$LOG"