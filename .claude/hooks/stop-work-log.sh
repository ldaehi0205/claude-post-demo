#!/bin/bash
set -euo pipefail

# ============================================================
# Stop Hook: 작업 로그 기록
# feat/fix/refactor 작업 완료 시 프롬프트와 결과를 JSONL로 기록
# ============================================================

# 에러 발생 시에도 Claude가 멈추지 않도록
trap 'exit 0' ERR

# --- stdin JSON 파싱 ---
HOOK_INPUT=$(cat)

STOP_HOOK_ACTIVE=$(echo "$HOOK_INPUT" | jq -r '.stop_hook_active // false')
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // ""')
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path // ""')
LAST_ASSISTANT_MSG=$(echo "$HOOK_INPUT" | jq -r '.last_assistant_message // ""')
PROJECT_DIR=$(echo "$HOOK_INPUT" | jq -r '.cwd // "."')

# --- 무한루프 방지 ---
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# --- transcript 파일 존재 확인 ---
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  exit 0
fi

# --- 사용자 프롬프트 추출 (마지막 user 메시지) ---
USER_PROMPT=$(grep '"type":"user"' "$TRANSCRIPT_PATH" \
  | tail -1 \
  | jq -r '
      [.message.content[]
       | select(.type == "text")
       | .text
       | select(startswith("<ide_opened_file>") | not)
       | select(startswith("<system-reminder>") | not)
       | select(startswith("<ide_") | not)
      ] | last // ""
    ' 2>/dev/null || echo "")

if [ -z "$USER_PROMPT" ]; then
  exit 0
fi

# --- 프롬프트/응답 길이 제한 (500자) ---
USER_PROMPT=$(echo "$USER_PROMPT" | cut -c1-500)
ASSISTANT_SUMMARY=$(echo "$LAST_ASSISTANT_MSG" | cut -c1-500)

# --- feat/fix/refactor 판별 ---
WORK_TYPE=""
COMBINED_TEXT="$USER_PROMPT $ASSISTANT_SUMMARY"

if echo "$COMBINED_TEXT" | grep -qiE '추가|구현|만들|생성|개발|feat|기능|새로운|add|implement|create'; then
  WORK_TYPE="feat"
elif echo "$COMBINED_TEXT" | grep -qiE '수정|버그|fix|오류|에러|고쳐|해결|bug|error|resolve'; then
  WORK_TYPE="fix"
elif echo "$COMBINED_TEXT" | grep -qiE '리팩|refactor|개선|정리|구조|최적화|optimize|clean|restructure'; then
  WORK_TYPE="refactor"
fi

# 해당 없으면 종료 (단순 질문, 설명 요청 등)
if [ -z "$WORK_TYPE" ]; then
  exit 0
fi

# --- 현재 git 브랜치 ---
GIT_BRANCH=$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo "unknown")

# --- 타임스탬프 ---
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- 로그 디렉토리 생성 ---
LOG_DIR="$PROJECT_DIR/.claude/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/work-log.jsonl"

# --- 로그 파일 크기 관리 (10MB 초과 시 최근 1000줄만 유지) ---
if [ -f "$LOG_FILE" ]; then
  FILE_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || echo 0)
  if [ "$FILE_SIZE" -gt 10485760 ]; then
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
  fi
fi

# --- JSONL 로그 기록 ---
jq -n --compact-output \
  --arg ts "$TIMESTAMP" \
  --arg sid "$SESSION_ID" \
  --arg wt "$WORK_TYPE" \
  --arg up "$USER_PROMPT" \
  --arg as "$ASSISTANT_SUMMARY" \
  --arg gb "$GIT_BRANCH" \
  '{
    timestamp: $ts,
    session_id: $sid,
    work_type: $wt,
    user_prompt: $up,
    assistant_summary: $as,
    git_branch: $gb
  }' >> "$LOG_FILE"

exit 0
