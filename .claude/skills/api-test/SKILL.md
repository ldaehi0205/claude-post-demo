---
name: api-test
description: REST API 엔드포인트를 테스트합니다. 게시글 CRUD, 인증 API 테스트 시 사용합니다.
argument-hint: [method] [endpoint]
---

# API 테스트

## 엔드포인트 목록

### 인증 API

| Method | URL                | 설명        | 인증 |
| ------ | ------------------ | ----------- | ---- |
| POST   | /api/auth/register | 회원가입    | X    |
| POST   | /api/auth/login    | 로그인      | X    |
| GET    | /api/auth/me       | 현재 사용자 | O    |

### 게시글 API

| Method | URL            | 설명      | 인증       |
| ------ | -------------- | --------- | ---------- |
| GET    | /api/posts     | 목록 조회 | X          |
| POST   | /api/posts     | 작성      | O          |
| GET    | /api/posts/:id | 상세 조회 | X          |
| PUT    | /api/posts/:id | 수정      | O (작성자) |
| DELETE | /api/posts/:id | 삭제      | O (작성자) |

## cURL 명령어

### 회원가입

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "테스트"}'
```

### 로그인

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 현재 사용자 조회

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 게시글 목록

```bash
curl -X GET http://localhost:3000/api/posts
```

### 게시글 작성

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "제목", "content": "내용"}'
```

### 게시글 상세

```bash
curl -X GET http://localhost:3000/api/posts/1
```

### 게시글 수정

```bash
curl -X PUT http://localhost:3000/api/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "수정된 제목", "content": "수정된 내용"}'
```

### 게시글 삭제

```bash
curl -X DELETE http://localhost:3000/api/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 응답 코드

| 코드 | 의미         |
| ---- | ------------ |
| 200  | 성공         |
| 201  | 생성됨       |
| 400  | 잘못된 요청  |
| 401  | 인증 필요    |
| 403  | 권한 없음    |
| 404  | 찾을 수 없음 |
| 500  | 서버 에러    |
