---
name: n8n-webhook
description: n8n webhook 연동 설정 및 디버깅을 수행합니다. Slack 알림, AI 자동요약 webhook 호출 실패 시 사용합니다.
---

# n8n Webhook 연동

## 아키텍처

```
[게시글 작성] → [Server Action] → [notifyNewPost()] → [n8n Webhook] → [Slack]
                                        ↓
                                  비동기 처리
                              (실패해도 게시글 작성 성공)
```

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `src/utils/n8n.ts` | n8n webhook 호출 유틸 함수 |
| `src/app/actions/posts.ts` | 게시글 Server Action (webhook 호출) |
| `.env` | N8N_WEBHOOK_URL 환경변수 |

## 환경 변수

```bash
# n8n Webhook URL (Production URL 사용)
N8N_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/xxx"

# 게시글 링크 생성용 기본 URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Webhook Payload 형식

```json
{
  "event": "new_post",
  "post": {
    "id": 1,
    "title": "게시글 제목",
    "author": "작성자 이름",
    "authorId": "user123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "url": "https://your-domain.com/posts/1"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 디버깅 체크리스트

### 1. Slack 알림이 안 올 때

- [ ] n8n 워크플로우가 **Active** 상태인지 확인
- [ ] **Production URL** 사용 중인지 확인 (`webhook-test`가 아닌 `webhook`)
- [ ] `.env`의 `N8N_WEBHOOK_URL` 값 확인
- [ ] 서버 재시작했는지 확인 (환경변수 반영)

### 2. n8n Executions에 기록이 없을 때

- [ ] 워크플로우 Active 상태 확인
- [ ] Production URL vs Test URL 확인
- [ ] Next.js 서버 로그에서 `[n8n]` 로그 확인

### 3. 서버 로그에 `[n8n]` 로그가 없을 때

- [ ] **중요**: 게시글 작성이 API Route가 아닌 **Server Action**을 사용하는지 확인
- [ ] `src/app/actions/posts.ts`에 `notifyNewPost()` 호출이 있는지 확인
- [ ] Next.js 캐시 삭제: `rm -rf .next node_modules/.cache`

### 4. Webhook 호출은 되지만 Slack 알림이 안 올 때

- [ ] n8n Slack 노드 Credential 연결 확인
- [ ] Slack 채널명 확인
- [ ] n8n Executions에서 에러 메시지 확인

## Test URL vs Production URL

| 구분 | URL 형식 | 사용 조건 |
|------|----------|-----------|
| Test URL | `/webhook-test/xxx` | n8n에서 "Test workflow" 클릭 후 대기 상태 |
| Production URL | `/webhook/xxx` | 워크플로우 Active 상태 |

**Production URL 사용 권장!**

## Webhook 수동 테스트

```bash
curl -X POST "https://your-n8n.app.n8n.cloud/webhook/xxx" \
  -H "Content-Type: application/json" \
  -d '{"event":"new_post","post":{"id":999,"title":"테스트","author":"테스터","url":"http://localhost:3000/posts/999"}}'
```

성공 응답: `{"message":"Workflow was started"}`

## n8n 워크플로우 설정

### 1단계: Webhook 노드

- **HTTP Method**: POST
- **Path**: 원하는 경로 (예: `new-post`)

### 2단계: Slack 노드

- **Resource**: Message
- **Operation**: Send a Message
- **Channel**: 알림 받을 채널
- **Text**:
  ```
  📝 새 게시글이 등록되었습니다!

  *제목:* {{ $json.post.title }}
  *작성자:* {{ $json.post.author }}
  *링크:* {{ $json.post.url }}
  ```

### 3단계: 활성화

1. 워크플로우 저장
2. Active 토글 켜기
3. Production URL 복사하여 `.env`에 설정

## 주의사항

### Next.js App Router에서 코드 위치

게시글 작성 기능이 **두 곳**에 있을 수 있음:

| 위치 | 파일 | 사용 여부 확인 |
|------|------|----------------|
| API Route | `src/app/api/posts/route.ts` | `POST /api/posts` 로그 확인 |
| Server Action | `src/app/actions/posts.ts` | `POST /posts/new 303` 로그 확인 |

**새로운 기능 추가 시 실제로 사용되는 코드 경로를 먼저 확인할 것!**

### 캐시 문제

환경변수나 코드 변경 후에도 반영이 안 되면:

```bash
rm -rf .next node_modules/.cache && npm run dev
```
