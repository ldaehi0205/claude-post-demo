# API 명세서

Base URL: `http://localhost:3000/api`

## 인증 방식

- JWT Bearer Token 사용
- 인증이 필요한 API는 요청 헤더에 토큰 포함 필요
- 토큰이 필요한 API는 auth를 제외한 추가, 삭제, 수정에 대한 내용에 대해 토큰을 검증한다.

### 토큰 정책

| 토큰          | 유효 기간                 | 저장 위치       |
| ------------- | ------------------------- | --------------- |
| Access Token  | 60분                      | localStorage    |
| Refresh Token | Idle 14일 / Absolute 30일 | httpOnly cookie |

### 토큰 갱신 흐름

1. Access Token 만료 시 `401 expired_token` 응답
2. 클라이언트는 `POST /auth/refresh` 호출
3. 새 Access Token 발급
4. Refresh Token도 만료 시 로그아웃 처리

```
Authorization: Bearer {accessToken}
```

### 클라이언트 에러 처리 (Axios Interceptor)

| 조건                                         | 처리                                     |
| -------------------------------------------- | ---------------------------------------- |
| `status === 401 && code === "expired_token"` | refresh 호출 (락/큐) → 원요청 1회 재시도 |
| `status === 401 && code !== "expired_token"` | logout() + router.replace('/login')      |
| refresh 응답도 401                           | logout() + router.replace('/login')      |

- 서버는 401 응답 시 `code`를 반드시 포함한다.
- 동시 요청 시 중복 refresh 방지를 위해 락/큐 패턴 적용

---

## 인증 API

### POST /auth/register

회원가입

**Request Body**

| 필드     | 타입   | 필수 | description   |
| -------- | ------ | ---- | ------------- |
| userID   | string | O    | 사용자 아이디 |
| password | string | O    | 비밀번호      |
| name     | string | O    | 이름          |

**Response 201**

```json
{
  "user": {
    "id": 1,
    "userID": "testuser",
    "name": "테스트",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response**

| status | code           | description           |
| ------ | -------------- | --------------------- |
| 400    | duplicate_user | 이미 사용 중인 아이디 |

---

### POST /auth/login

로그인

- 로그인에 사용되는 JWT는 발급 후 갱신하지 않을 경우 60분이 지나면 만료된다.

**Request Body**

| 필드     | 타입   | 필수 | description   |
| -------- | ------ | ---- | ------------- |
| userID   | string | O    | 사용자 아이디 |
| password | string | O    | 비밀번호      |

**Response 200**

```json
{
  "user": {
    "id": 1,
    "userID": "testuser",
    "name": "테스트",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- Refresh Token은 httpOnly cookie로 설정됨

**Error Response**

| status | code                | description                          |
| ------ | ------------------- | ------------------------------------ |
| 401    | invalid_credentials | 아이디 또는 비밀번호가 올바르지 않음 |

---

### POST /auth/refresh

Access Token 갱신

- Refresh Token은 httpOnly cookie에서 자동으로 전송됨
- Access Token 만료(`401 expired_token`) 시에만 호출

**Refresh Token Rotation**

- 매 refresh 호출 시 새로운 Refresh Token을 `Set-Cookie`로 발급
- 기존 Refresh Token 세션은 revoke 처리
- Idle timeout(14일)은 `lastSeenAt` 갱신 또는 TTL로 유지

**Response 200**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- 새로운 Refresh Token은 `Set-Cookie` 헤더로 전송됨

**Error Response**

| status | code          | description                    |
| ------ | ------------- | ------------------------------ |
| 401    | authorization | Refresh Token이 없습니다       |
| 401    | invalid_token | 유효하지 않은 Refresh Token    |
| 401    | expired_token | Refresh Token이 만료되었습니다 |

---

### GET /auth/me

현재 로그인한 사용자 정보 조회

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Response 200**

```json
{
  "id": 1,
  "userID": "testuser",
  "name": "테스트",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response**

| status | code          | description           |
| ------ | ------------- | --------------------- |
| 401    | authorization | 인증이 필요합니다     |
| 401    | invalid_token | 유효하지 않은 토큰    |
| 401    | expired_token | 토큰이 만료되었습니다 |
| 404    | not_found     | 사용자를 찾을 수 없음 |

---

## 태그 API

### GET /tags

태그 목록 조회 (게시글 수 포함, postCount > 0인 태그만 반환)

**Response 200**

```json
{
  "tags": [
    { "name": "react", "postCount": 5 },
    { "name": "nextjs", "postCount": 3 }
  ]
}
```

---

## 게시글 API

### GET /posts

게시글 목록 조회

**Query Parameters**

| 파라미터 | 타입   | 필수 | description                          |
| -------- | ------ | ---- | ------------------------------------ |
| tag      | string | X    | 태그명으로 필터링 (예: `?tag=react`) |

**Response 200**

```json
[
  {
    "id": 1,
    "title": "게시글 제목",
    "content": "게시글 내용",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "authorId": 1,
    "author": {
      "id": 1,
      "name": "테스트",
      "userID": "testuser"
    },
    "postTags": [
      { "tag": { "id": 1, "name": "react" } },
      { "tag": { "id": 2, "name": "nextjs" } }
    ]
  }
]
```

---

### POST /posts

게시글 작성

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Request Body**

| 필드    | 타입   | 필수 | description |
| ------- | ------ | ---- | ----------- |
| title   | string | O    | 제목        |
| content | string | O    | 내용        |

**Response 201**

```json
{
  "id": 1,
  "title": "게시글 제목",
  "content": "게시글 내용",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "테스트",
    "userID": "testuser"
  }
}
```

**Error Response**

| status | code          | description           |
| ------ | ------------- | --------------------- |
| 401    | authorization | 인증이 필요합니다     |
| 401    | invalid_token | 유효하지 않은 토큰    |
| 401    | expired_token | 토큰이 만료되었습니다 |

---

### DELETE /posts

게시글 일괄 삭제

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Request Body**

| 필드 | 타입     | 필수 | description           |
| ---- | -------- | ---- | --------------------- |
| ids  | number[] | O    | 삭제할 게시글 ID 배열 |

**Response 200**

```json
{
  "message": "3개의 게시글이 삭제되었습니다.",
  "deletedCount": 3
}
```

**Error Response**

| status | code          | description                  |
| ------ | ------------- | ---------------------------- |
| 400    | bad_request   | 삭제할 게시글을 선택해주세요 |
| 401    | authorization | 인증이 필요합니다            |
| 401    | invalid_token | 유효하지 않은 토큰           |
| 401    | expired_token | 토큰이 만료되었습니다        |

---

### GET /posts/:id

게시글 상세 조회

**Path Parameters**

| 파라미터 | 타입   | description |
| -------- | ------ | ----------- |
| id       | number | 게시글 ID   |

**Response 200**

```json
{
  "id": 1,
  "title": "게시글 제목",
  "content": "게시글 내용",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "테스트",
    "userID": "testuser"
  }
}
```

**Error Response**

| status | code      | description           |
| ------ | --------- | --------------------- |
| 404    | not_found | 게시글을 찾을 수 없음 |

---

### PUT /posts/:id

게시글 수정 (작성자 본인만 가능)

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Path Parameters**

| 파라미터 | 타입   | description |
| -------- | ------ | ----------- |
| id       | number | 게시글 ID   |

**Request Body**

| 필드    | 타입   | 필수 | description |
| ------- | ------ | ---- | ----------- |
| title   | string | X    | 제목        |
| content | string | X    | 내용        |

**Response 200**

```json
{
  "id": 1,
  "title": "수정된 제목",
  "content": "수정된 내용",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "테스트",
    "userID": "testuser"
  }
}
```

**Error Response**

| status | code          | description           |
| ------ | ------------- | --------------------- |
| 401    | authorization | 인증이 필요합니다     |
| 401    | invalid_token | 유효하지 않은 토큰    |
| 401    | expired_token | 토큰이 만료되었습니다 |
| 403    | forbidden     | 수정 권한이 없습니다  |
| 404    | not_found     | 게시글을 찾을 수 없음 |

### PATCH /posts/:id/summary

게시글 AI 요약 저장 (n8n 콜백 전용)

**Headers**

| 헤더              | 필수 | 설명                  |
| ----------------- | ---- | --------------------- |
| x-callback-secret | O    | n8n 콜백 인증 시크릿  |

**Path Parameters**

| 파라미터 | 타입   | 설명      |
| -------- | ------ | --------- |
| id       | number | 게시글 ID |

**Request Body**

| 필드    | 타입   | 필수 | 설명           |
| ------- | ------ | ---- | -------------- |
| summary | string | O    | AI 생성 요약문 |

**Response 200**

```json
{
  "message": "요약이 저장되었습니다.",
  "postId": 1,
  "summary": "이 게시글은 JavaScript의 변수 선언 방식인 var, let, const의 차이를 설명합니다."
}
```

**Error Response**

| status | code          | 설명                  |
| ------ | ------------- | --------------------- |
| 400    | bad_request   | 유효하지 않은 요청    |
| 401    | authorization | 콜백 인증 실패        |
| 404    | not_found     | 게시글을 찾을 수 없음 |

---

## 댓글 API

### GET /posts/:id/comments

게시글의 댓글 목록 조회

**Path Parameters**

| 파라미터 | 타입   | description |
| -------- | ------ | ----------- |
| id       | number | 게시글 ID   |

**Response 200**

```json
[
  {
    "id": 1,
    "content": "댓글 내용",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "postId": 1,
    "authorId": 1,
    "author": {
      "id": 1,
      "name": "테스트",
      "userID": "testuser"
    }
  }
]
```

---

### POST /posts/:id/comments

댓글 작성 (로그인 필요)

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Path Parameters**

| 파라미터 | 타입   | description |
| -------- | ------ | ----------- |
| id       | number | 게시글 ID   |

**Request Body**

| 필드    | 타입   | 필수 | description |
| ------- | ------ | ---- | ----------- |
| content | string | O    | 댓글 내용   |

**Response 201**

```json
{
  "id": 1,
  "content": "댓글 내용",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "postId": 1,
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "테스트",
    "userID": "testuser"
  }
}
```

**Error Response**

| status | code          | description           |
| ------ | ------------- | --------------------- |
| 401    | authorization | 인증이 필요합니다     |
| 401    | invalid_token | 유효하지 않은 토큰    |
| 401    | expired_token | 토큰이 만료되었습니다 |
| 404    | not_found     | 게시글을 찾을 수 없음 |

---

### PUT /posts/:id/comments/:commentId

댓글 수정 (작성자 본인만 가능)

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Path Parameters**

| 파라미터  | 타입   | description |
| --------- | ------ | ----------- |
| id        | number | 게시글 ID   |
| commentId | number | 댓글 ID     |

**Request Body**

| 필드    | 타입   | 필수 | description |
| ------- | ------ | ---- | ----------- |
| content | string | O    | 댓글 내용   |

**Response 200**

```json
{
  "id": 1,
  "content": "수정된 댓글 내용",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "postId": 1,
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "테스트",
    "userID": "testuser"
  }
}
```

**Error Response**

| status | code          | description           |
| ------ | ------------- | --------------------- |
| 401    | authorization | 인증이 필요합니다     |
| 401    | invalid_token | 유효하지 않은 토큰    |
| 401    | expired_token | 토큰이 만료되었습니다 |
| 403    | forbidden     | 수정 권한이 없습니다  |
| 404    | not_found     | 댓글을 찾을 수 없음   |

---

### DELETE /posts/:id/comments/:commentId

댓글 삭제 (작성자 본인만 가능)

**Headers**

| 헤더          | 필수 | description    |
| ------------- | ---- | -------------- |
| Authorization | O    | Bearer {token} |

**Path Parameters**

| 파라미터  | 타입   | description |
| --------- | ------ | ----------- |
| id        | number | 게시글 ID   |
| commentId | number | 댓글 ID     |

**Response 200**

```json
{
  "message": "댓글이 삭제되었습니다."
}
```

**Error Response**

| status | code          | description           |
| ------ | ------------- | --------------------- |
| 401    | authorization | 인증이 필요합니다     |
| 401    | invalid_token | 유효하지 않은 토큰    |
| 401    | expired_token | 토큰이 만료되었습니다 |
| 403    | forbidden     | 삭제 권한이 없습니다  |
| 404    | not_found     | 댓글을 찾을 수 없음   |

---

## 이미지 업로드

### 이미지 저장소

- **저장소**: Supabase Storage
- **버킷명**: `post-images`
- **접근 권한**: Public

### 이미지 제한 사항

| 항목     | 제한                          |
| -------- | ----------------------------- |
| 파일크기 | 최대 5MB                      |
| 파일형식 | JPG, PNG, GIF, WebP           |
| 저장경로 | `posts/{timestamp}-{random}.{ext}` |

### 이미지 처리 (Server Actions)

게시글 작성/수정 시 Server Action을 통해 이미지를 처리합니다.

**게시글 작성 시**
- FormData에 `image` 필드로 파일 전송
- 업로드 성공 시 `imageUrl`에 Supabase Storage URL 저장

**게시글 수정 시**
- 새 이미지 업로드: 기존 이미지 삭제 후 새 이미지 저장
- 이미지 삭제: `removeImage: true` 필드 전송

**게시글 삭제 시**
- 연결된 이미지가 있으면 Storage에서 함께 삭제

### 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 공통 에러 응답 형식

```json
{
  "error": "에러 메시지",
  "code": "error_code"
}
```

| status | code             | description           |
| ------ | ---------------- | --------------------- |
| 400    | bad_request      | 잘못된 요청           |
| 400    | validation_error | 입력값 검증 실패      |
| 401    | authorization    | 인증이 필요합니다     |
| 401    | invalid_token    | 유효하지 않은 토큰    |
| 401    | expired_token    | 토큰이 만료되었습니다 |
| 403    | forbidden        | 권한이 없습니다       |
| 404    | not_found        | 리소스를 찾을 수 없음 |
| 500    | internal_error   | 서버 내부 오류        |

## 타입 정의

### User

```typescript
interface User {
  id: number;
  userID: string;
  name: string;
  createdAt: Date;
}
```

### Post

```typescript
interface Post {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: {
    id: number;
    name: string;
    userID: string;
  };
  postTags?: Array<{
    tag: Tag;
  }>;
}
```

### Tag

```typescript
interface Tag {
  id: number;
  name: string;
}

interface TagWithCount {
  name: string;
  postCount: number;
}
```

### Comment

```typescript
interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  postId: number;
  authorId: number;
  author: {
    id: number;
    name: string;
    userID: string;
  };
}
```

### AuthResponse

```typescript
interface AuthResponse {
  user: User;
  accessToken: string;
}
```

---

## Token Budget Manager (`src/lib/claude/`)

Claude API 호출 전 토큰 예산을 관리하는 라이브러리.
Anthropic Token Counting API/SDK를 사용하여 입력 토큰을 정확히 측정하고, 예산 초과 시 자동 축약한다.

### 환경 변수

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 주요 함수

| 함수                 | 설명                                                  |
| -------------------- | ----------------------------------------------------- |
| `countInputTokens`   | Token Counting API로 입력 토큰 수 측정                |
| `shrinkToBudget`     | 예산 초과 시 우선순위별 자동 축약 (A→B→C→D)           |
| `buildRequest`       | ClaudePayload → SDK 요청 바디 변환 (문서병합/가이드)  |
| `callClaude`         | 전체 파이프라인: count → shrink → build → call → log  |

### 타입

```typescript
interface ClaudePayload {
  model: string;
  system?: string;
  messages: MessageParam[];
  tools?: ToolParam[];
  documents?: DocumentChunk[];
  outputGuide?: OutputGuide;
}

interface TokenBudgetConfig {
  inputTokenBudget: number;   // 예: 8_000
  outputTokenBudget: number;  // 예: 1_000
  safetyMargin: number;       // 예: 300
}
```

### 축약 정책 (우선순위)

| 순서 | 전략             | 설명                                       |
| ---- | ---------------- | ------------------------------------------ |
| A    | HISTORY          | 오래된 대화 turn부터 제거                  |
| B    | DOCUMENTS        | relevanceScore 기준 상위 K개만 유지        |
| C    | SYSTEM           | 시스템 프롬프트 중복 문장 제거             |
| D    | USER_MESSAGE     | 유저 메시지를 의도+키워드 형태로 구조 요약 |

### 로그 형식

```json
{
  "requestId": "uuid",
  "model": "claude-sonnet-4-5-20250929",
  "inputTokens": 4000,
  "outputTokens": 300,
  "maxTokens": 1000,
  "estimatedCost": { "inputCostUsd": 0.012, "outputCostUsd": 0.0045, "totalCostUsd": 0.0165 },
  "shrinkSteps": [{ "strategy": "HISTORY", "beforeTokens": 8500, "afterTokens": 6000, "detail": "turn 2개 제거" }],
  "latencyMs": 1500,
  "timestamp": "2026-02-23T00:00:00.000Z"
}
```

### 사용 예시

```typescript
import { callClaude, type ClaudePayload, type TokenBudgetConfig } from '@/lib/claude';

const config: TokenBudgetConfig = {
  inputTokenBudget: 8_000,
  outputTokenBudget: 1_000,
  safetyMargin: 300,
};

const payload: ClaudePayload = {
  model: 'claude-sonnet-4-5-20250929',
  system: '당신은 한국어 게시판 도우미입니다.',
  messages: [
    { role: 'user', content: '이 게시글을 요약해주세요: ...' },
  ],
  documents: [
    { content: '게시글 본문...', relevanceScore: 1.0 },
  ],
  outputGuide: { maxBullets: 5 },
};

const response = await callClaude(payload, config);
console.log(response.content);   // Claude 응답
console.log(response.log);       // 토큰/비용/축약 로그
```
