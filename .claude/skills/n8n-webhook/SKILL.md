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

---

# AI 게시글 자동요약 (n8n + OpenAI)

## 아키텍처

```
[게시글 상세 조회] → [GET /api/posts/:id/summary] → summary가 null이면 → [n8n Webhook 호출]
                              ↓                                                    ↓
                     { summary: null } 응답                               [OpenAI로 요약 생성]
                              ↓                                                    ↓
                   [클라이언트 5초 폴링]                            [PATCH /api/posts/:id/summary 콜백]
                              ↓                                                    ↓
                   [summary 수신 → 폴링 중지]                              [DB에 summary 저장]
```

### 핵심 설계 원칙

- **Lazy Evaluation**: 게시글 작성 시가 아닌, **첫 조회 시** 요약을 생성 (불필요한 요약 생성 방지)
- **API 분리**: 게시글 상세(`GET /api/posts/:id`)와 요약(`GET /api/posts/:id/summary`)을 분리하여 **폴링 시 조회수 증가 방지**
- **Fire-and-Forget**: n8n 호출 실패해도 게시글 조회에 영향 없음 (`.catch(() => {})`)
- **요약 재생성**: 게시글 수정 시 `summary: null`로 초기화 → 다음 조회 시 자동 재생성

## 전체 데이터 흐름

### 1. 게시글 작성 시

```
createPost (Server Action)
  → DB 저장 (summary = null)
  → notifyNewPost() 호출 (Slack 알림만)
  → AI 요약은 요청하지 않음
```

### 2. 게시글 조회 시 (요약 없음)

```
1. usePost(id)         → GET /api/posts/:id          → 게시글 + 조회수 증가
2. usePostSummary(id)  → GET /api/posts/:id/summary  → { summary: null }
3. summary가 null이면 서버에서 n8n webhook 호출 (비동기)
4. 클라이언트: 5초마다 GET /api/posts/:id/summary 폴링
5. n8n: OpenAI 요약 → PATCH /api/posts/:id/summary 콜백 → DB 저장
6. 다음 폴링 시 { summary: "..." } 수신 → 폴링 자동 중지
```

### 3. 게시글 수정 시

```
updatePost (Server Action)
  → DB 업데이트 (summary = null 로 초기화)
  → 다음 조회 시 요약 재생성 트리거
```

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `src/utils/n8n.ts` | `requestAISummary()` - n8n 요약 webhook 호출 유틸 |
| `src/app/api/posts/[id]/summary/route.ts` | GET: 요약 조회 + 트리거 / PATCH: n8n 콜백 수신 |
| `src/hooks/usePosts.ts` | `usePostSummary()` - 5초 폴링 훅 |
| `src/app/posts/_components/PostDetail.tsx` | 요약 UI 표시 (로딩 스피너 / 요약 텍스트) |
| `src/app/actions/posts.ts` | `updatePost()` - 수정 시 summary null 초기화 |

## 환경 변수

```bash
# AI 요약 n8n Webhook URL
N8N_SUMMARY_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/xxx"

# n8n 콜백 인증 시크릿 (직접 생성, n8n HTTP Request 노드 헤더에 동일 값 설정)
N8N_CALLBACK_SECRET="your-random-secret-string"

# 콜백 URL 기본 도메인 (n8n에서 접근 가능한 URL)
# 로컬 개발: ngrok URL 사용 / 배포: 실제 도메인
NEXT_PUBLIC_BASE_URL="https://xxxx.ngrok-free.app"
```

## API 명세

### GET /api/posts/:id/summary

요약 조회 전용. summary가 없으면 n8n webhook으로 요약 생성 요청을 트리거한다.

**응답:**

```json
// summary가 있을 때
{ "summary": "이 게시글은 ..." }

// summary가 없을 때 (n8n 요청 트리거됨)
{ "summary": null }
```

### PATCH /api/posts/:id/summary

n8n 콜백 전용. AI가 생성한 요약을 DB에 저장한다.

**요청 헤더:**

```
x-callback-secret: {N8N_CALLBACK_SECRET 값}
```

**요청 본문:**

```json
{ "summary": "AI가 생성한 요약 텍스트" }
```

**응답:**

```json
{
  "message": "요약이 저장되었습니다.",
  "postId": 1,
  "summary": "AI가 생성한 요약 텍스트"
}
```

## n8n 요약 Webhook Payload

Next.js → n8n으로 전송되는 페이로드:

```json
{
  "event": "summarize_post",
  "post": {
    "id": 1,
    "title": "게시글 제목",
    "content": "게시글 본문 전체 내용...",
    "callbackUrl": "https://xxxx.ngrok-free.app/api/posts/1/summary"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## n8n 워크플로우 설정 (AI 요약)

### 노드 구성

```
[Webhook] → [OpenAI] → [HTTP Request]
```

### 1단계: Webhook 노드

- **HTTP Method**: POST
- **Path**: 원하는 경로 (예: `summarize-post`)

### 2단계: OpenAI 노드

- **Resource**: Chat Completion (Message a Model)
- **Model**: `gpt-4o-mini` (비용 효율)
- **System Prompt** (고정 텍스트):

```
당신은 게시글 요약 전문가입니다. 주어진 게시글의 제목과 본문을 읽고, 핵심 내용을 2-3문장으로 간결하게 한국어로 요약해주세요. 마크다운 문법은 무시하고 내용만 요약하세요.
```

- **User Message** (⚠️ Expression 모드로 전환 필수):

```
제목: {{ $('Webhook').item.json.body.post.title }}

본문:
{{ $('Webhook').item.json.body.post.content }}
```

> **중요**: User Message 입력 필드에서 `=` 아이콘을 클릭하여 **Expression 모드**로 전환해야 `{{ }}` 표현식이 동작합니다.

### 3단계: HTTP Request 노드 (콜백)

- **Method**: PATCH
- **URL** (⚠️ Expression 모드):

```
{{ $('Webhook').item.json.body.post.callbackUrl }}
```

> **중요**: URL 필드에서 `=` 아이콘을 클릭하여 **Expression 모드**로 전환해야 합니다. 고정 텍스트 모드에서는 `{{ }}` 표현식이 URL 문자열로 해석됩니다.

- **Authentication**: None
- **Headers**:
  | Name | Value |
  |------|-------|
  | `Content-Type` | `application/json` |
  | `x-callback-secret` | `{N8N_CALLBACK_SECRET과 동일한 값}` |

- **Body Content Type**: `JSON`
- **Specify Body**: `Using Fields Below` (⚠️ "Using JSON"은 Expression + JSON 혼용 시 파싱 에러 발생)
- **Body Parameters**:
  | Name | Value (Expression 모드) |
  |------|-------------------------|
  | `summary` | `{{ $json.message.content }}` |

> `$json.message.content`는 OpenAI 노드의 응답에서 생성된 텍스트를 참조합니다.

### 4단계: 활성화

1. 워크플로우 저장
2. Active 토글 켜기
3. Production URL 복사하여 `.env`의 `N8N_SUMMARY_WEBHOOK_URL`에 설정

## 클라이언트 폴링 구조

```typescript
// src/hooks/usePosts.ts
export function usePostSummary(id: number) {
  return useQuery({
    queryKey: [...POSTS_KEY, id, 'summary'],
    queryFn: () => postsApi.getSummary(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // summary가 null이면 5초마다 폴링, 있으면 중지
      return data && !data.summary ? 5000 : false;
    },
  });
}
```

**UI 표시 (PostDetail.tsx):**

- summary가 null: 스피너 + "AI 요약을 생성 중입니다..." 표시
- summary가 있음: 파란색 박스에 요약 텍스트 표시

## 로컬 개발 시 ngrok 설정

n8n Cloud에서 localhost 콜백을 받으려면 ngrok 터널이 필요합니다.

```bash
# ngrok 설치 (macOS)
brew install ngrok

# 인증 토큰 설정 (https://dashboard.ngrok.com 에서 확인)
ngrok config add-authtoken YOUR_TOKEN

# 터널 실행
ngrok http 3000
```

ngrok URL(예: `https://xxxx.ngrok-free.app`)을 `.env`의 `NEXT_PUBLIC_BASE_URL`에 설정합니다.

> **주의**: ngrok free 플랜은 URL이 재시작마다 변경됩니다. 변경 시 `.env` 업데이트 + 서버 재시작 필요.

## 디버깅 체크리스트 (AI 요약)

### 1. 요약이 생성되지 않을 때

- [ ] `.env`에 `N8N_SUMMARY_WEBHOOK_URL` 설정 확인
- [ ] n8n 워크플로우가 **Active** 상태인지 확인
- [ ] **Production URL** 사용 중인지 확인 (`webhook-test`가 아닌 `webhook`)
- [ ] 서버 로그에서 `[n8n] requestAISummary 호출됨` 확인
- [ ] n8n Executions에서 실행 기록 확인

### 2. n8n 실행은 되지만 요약이 저장되지 않을 때

- [ ] n8n HTTP Request 노드 URL이 **Expression 모드**인지 확인
- [ ] `NEXT_PUBLIC_BASE_URL`이 n8n에서 접근 가능한 URL인지 확인 (로컬: ngrok 사용)
- [ ] ngrok이 실행 중인지 확인
- [ ] `x-callback-secret` 헤더 값이 `.env`의 `N8N_CALLBACK_SECRET`과 일치하는지 확인
- [ ] n8n HTTP Request 노드에서 응답 코드 확인

### 3. "Bad request - 요약 내용이 필요합니다" 에러

- [ ] OpenAI 노드가 정상 응답을 반환하는지 확인
- [ ] HTTP Request 노드의 Body에서 `summary` 필드 값이 `{{ $json.message.content }}`인지 확인
- [ ] Body 설정이 **"Using Fields Below"**인지 확인 ("Using JSON"이면 Expression 파싱 에러 발생)

### 4. OpenAI가 게시글과 무관한 응답을 반환할 때

- [ ] OpenAI 노드의 User Message가 **Expression 모드**(`=` 아이콘)인지 확인
- [ ] Expression에서 `$('Webhook').item.json.body.post.title` 등으로 실제 데이터를 참조하는지 확인
- [ ] n8n Executions에서 Webhook 노드의 Input 데이터에 `post.title`, `post.content`가 있는지 확인

### 5. 조회수가 비정상적으로 높을 때

- [ ] `GET /api/posts/:id` (조회수 증가)와 `GET /api/posts/:id/summary` (폴링)이 분리되어 있는지 확인
- [ ] `usePosts.ts`의 `usePostSummary`가 별도 API(`/api/posts/:id/summary`)를 호출하는지 확인

## 수동 테스트

### 요약 요청 트리거

```bash
# 게시글 조회 시 자동 트리거되지만, 수동 테스트 시:
curl http://localhost:3000/api/posts/1/summary
```

### n8n 콜백 시뮬레이션

```bash
curl -X PATCH http://localhost:3000/api/posts/1/summary \
  -H "Content-Type: application/json" \
  -H "x-callback-secret: your-secret" \
  -d '{"summary": "이 게시글은 테스트 요약입니다."}'
```

### n8n Webhook 직접 호출

```bash
curl -X POST "https://your-n8n.app.n8n.cloud/webhook/xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "summarize_post",
    "post": {
      "id": 1,
      "title": "테스트 게시글",
      "content": "이것은 테스트 본문입니다.",
      "callbackUrl": "https://xxxx.ngrok-free.app/api/posts/1/summary"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }'
```
