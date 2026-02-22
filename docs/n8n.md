# n8n 자동화 연동

## 새 게시글 알림

게시글 작성 시 n8n webhook을 호출하여 Slack 등 외부 서비스로 알림을 전송합니다.

**환경 변수:**

```bash
N8N_WEBHOOK_URL=""           # n8n Webhook URL
NEXT_PUBLIC_BASE_URL=""      # 사이트 기본 URL (게시글 링크 생성용)
```

**n8n 워크플로우 설정:**

1. n8n에서 새 워크플로우 생성
2. `Webhook` 노드 추가 (POST 메서드)
3. `Slack` 노드 추가하여 알림 전송
4. Webhook URL을 `.env`의 `N8N_WEBHOOK_URL`에 설정

**Webhook Payload 형식:**

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

**Slack 메시지 템플릿 예시:**

```
📝 새 게시글이 등록되었습니다!

*제목:* {{ $json.post.title }}
*작성자:* {{ $json.post.author }}
*링크:* {{ $json.post.url }}
```

**참고:**

- webhook 호출 실패 시에도 게시글 작성은 정상 동작 (비동기 처리)
- `N8N_WEBHOOK_URL`이 설정되지 않으면 알림 스킵

## AI 요약 자동 생성

게시글 작성/수정 시 n8n webhook을 호출하여 OpenAI로 요약을 생성하고, 콜백 API로 저장합니다.

**흐름:**

```
게시글 작성 → DB 저장 (summary=null) → n8n webhook 호출 (비동기)
  → n8n: OpenAI로 요약 생성 → PATCH /api/posts/{id}/summary 콜백
  → DB에 summary 저장
```

**환경 변수:**

```bash
N8N_SUMMARY_WEBHOOK_URL=""   # AI 요약 n8n Webhook URL
N8N_CALLBACK_SECRET=""       # n8n 콜백 인증 시크릿
```

**n8n 워크플로우 설정:**

1. `Webhook` 노드 (POST) → `OpenAI` 노드 (Chat Completion, gpt-4o-mini) → `HTTP Request` 노드 (PATCH 콜백)
2. OpenAI 프롬프트: "주어진 게시글의 제목과 본문을 읽고, 핵심 내용을 2-3문장으로 간결하게 요약"
3. HTTP Request의 URL: `{{ $('Webhook').item.json.post.callbackUrl }}`
4. HTTP Request 헤더: `x-callback-secret` 설정

**Webhook Payload 형식:**

```json
{
  "event": "summarize_post",
  "post": {
    "id": 1,
    "title": "게시글 제목",
    "content": "게시글 본문 전체 내용...",
    "callbackUrl": "http://localhost:3000/api/posts/1/summary"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**참고:**

- webhook 호출 실패 시에도 게시글 작성은 정상 동작 (비동기 처리)
- `N8N_SUMMARY_WEBHOOK_URL`이 설정되지 않으면 요약 생성 스킵
- 게시글 수정 시 기존 요약을 null로 초기화 후 재생성 요청
- 콜백 API는 `x-callback-secret` 헤더로 인증
