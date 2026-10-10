#!/usr/bin/env bash
set -euo pipefail
MAX_ITERS=${MAX_ITERS:-60}
STUCK_LIMIT=3
i=0; stuck=0; last_hash=""

while [ $i -lt $MAX_ITERS ]; do
  i=$((i+1))
  echo "=== Ralph iteration $i ==="
  claude -p "$(cat .harness/PROMPT_LOOP.md)" \
        --dangerously-skip-permissions=false \
        --allowedTools "Read,Edit,Write,Bash,Task,Grep,Glob" \
        --max-turns 40 | tail -n 25 | tee -a .harness/loop.log

  grep -q "<promise>SPRINT_COMPLETE</promise>" .harness/loop.log && { echo "Sprint complete"; break; }
  grep -q "<promise>ALL_COMPLETE</promise>"    .harness/loop.log && { echo "Project complete"; break; }

  # stuck detection: no repo change across iterations
  h=$(git rev-parse HEAD)$(git status --porcelain | md5sum)
  if [ "$h" = "$last_hash" ]; then stuck=$((stuck+1)); else stuck=0; fi
  last_hash=$h
  [ $stuck -ge $STUCK_LIMIT ] && { echo "STUCK → escalate"; echo "- $(date -Is) loop stuck at iter $i" >> .harness/BLOCKERS.md; exit 2; }
done
