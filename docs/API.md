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

## 게시글 API

### GET /posts

게시글 목록 조회

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
    }
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
  createdAt: Date;
  updatedAt: Date;
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
