#!/bin/bash

# Auto-commit script for Claude Code PostToolUse hook
# Triggered after Edit/Write tool usage

set -e

# 프로젝트 루트로 이동
cd "$(dirname "$0")/../.."

# Git 저장소인지 확인
if [ ! -d ".git" ]; then
  exit 0
fi

# 민감한 파일 패턴 (커밋 제외)
EXCLUDE_PATTERNS=(
  ".env"
  ".env.*"
  "*.local"
  "credentials*"
  "*secret*"
  "*.pem"
  "*.key"
)

# 변경된 파일 확인
CHANGED_FILES=$(git diff --name-only 2>/dev/null || true)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null || true)

ALL_FILES="$CHANGED_FILES"$'\n'"$UNTRACKED_FILES"
ALL_FILES=$(echo "$ALL_FILES" | grep -v '^$' | sort -u)

if [ -z "$ALL_FILES" ]; then
  exit 0
fi

# 민감한 파일 필터링
FILES_TO_ADD=""
for file in $ALL_FILES; do
  SKIP=false
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ "$file" == $pattern ]]; then
      SKIP=true
      break
    fi
  done
  if [ "$SKIP" = false ] && [ -f "$file" ]; then
    FILES_TO_ADD="$FILES_TO_ADD $file"
  fi
done

if [ -z "$FILES_TO_ADD" ]; then
  exit 0
fi

# 파일 스테이징
git add $FILES_TO_ADD

# 스테이징된 파일 확인
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# 커밋 메시지 생성
FILE_COUNT=$(echo "$STAGED_FILES" | wc -l | tr -d ' ')
FIRST_FILE=$(echo "$STAGED_FILES" | head -1)

if [ "$FILE_COUNT" -eq 1 ]; then
  COMMIT_MSG="[auto] ${TOOL_NAME:-Update}: $FIRST_FILE"
else
  COMMIT_MSG="[auto] ${TOOL_NAME:-Update}: $FIRST_FILE 외 $((FILE_COUNT - 1))개 파일"
fi

# 커밋 실행
git commit -m "$COMMIT_MSG" --no-verify

echo "Auto-committed: $COMMIT_MSG"
