#!/usr/bin/env bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SYSTEM_PROMPT_FILE="$PROJECT_ROOT/.claude_system_prompt.tmp"

cat \
"$PROJECT_ROOT/docs/AI_ARCHITECT_PROMPT.md" \
"$PROJECT_ROOT/docs/AI_PERFORMANCE_RULES.md" \
"$PROJECT_ROOT/docs/AI_SECURITY_CHECKLIST.md" \
> "$SYSTEM_PROMPT_FILE"

# Запуск Claude с системным промптом
claude --system-prompt-file "$SYSTEM_PROMPT_FILE" "$@"