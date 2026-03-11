---
design_ref: docs/design/post-like.md
date: 2026-03-12
status: planned
feature_slug: post-like
---

# 게시글 좋아요(반응) 기능 기술 구현 계획

## 파일 변경 계획

### 신규 생성

| 파일 경로 | 역할 |
|-----------|------|
| `src/app/posts/_components/LikeButton.tsx` | 게시글 상세 페이지 좋아요 토글 버튼 (Client Component) |
| `src/app/posts/_components/LikeBadge.tsx` | 게시글 목록 카드 내 좋아요 수 표시 뱃지 (Server Component) |
| `src/hooks/usePostLike.ts` | 낙관적 업데이트를 포함한 좋아요 토글 mutation 훅 |
| `src/app/api/posts/[id]/like/route.ts` | 좋아요 토글 API 엔드포인트 (POST) |
| `src/__tests__/apis/postLike.test.ts` | postsApi.toggleLike 단위 테스트 |
| `src/__tests__/hooks/usePostLike.test.ts` | usePostLike 훅 단위 테스트 |
| `src/__tests__/api/posts/[id]/like.test.ts` | POST /api/posts/[id]/like 통합 테스트 |

### 수정

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `prisma/schema.prisma` | `PostLike` 모델 추가, `Post` 및 `User` 모델에 관계 필드 추가 |
| `src/types/post.ts` | `Post` 인터페이스에 `likeCount`, `isLiked`, `_count.likes` 필드 추가 |
| `src/apis/posts.ts` | `postsApi.toggleLike(id)` 메서드 추가 |
| `src/app/api/posts/[id]/route.ts` | GET 응답에 `likeCount`, `isLiked` 필드 포함하도록 수정 |
| `src/app/api/posts/route.ts` | GET 응답의 각 post에 `_count.likes` 필드 포함하도록 수정 |
| `src/app/posts/_components/PostDetail.tsx` | `LikeButton` 컴포넌트 삽입 (MarkdownPreview와 액션 버튼 사이) |
| `src/app/posts/_components/PostCard.tsx` | 조회수 `<td>` 우측에 `LikeBadge` 컴포넌트 삽입 |
| `src/app/posts/_components/PostListSkeleton.tsx` | "좋아요" 컬럼 헤더와 스켈레톤 `<td>` 추가 |

---

## DB 스키마 변경

```prisma
model PostLike {
  postId    Int
  userId    Int
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId])
  @@index([userId])
}

// Post 모델에 추가
model Post {
  // ...기존 필드...
  likes PostLike[]
}

// User 모델에 추가
model User {
  // ...기존 필드...
  likes PostLike[]
}
```

마이그레이션 명령: `npx prisma migrate dev --name add-post-like`

---

## API 설계

### POST /api/posts/[id]/like

- **역할**: 좋아요 토글 (이미 좋아요한 경우 취소, 아닌 경우 추가)
- **인증 필요**: Yes (Authorization: Bearer 헤더, JWT 검증)
- **Request**: Body 없음 (path parameter `id`만 사용)
- **Response 200**:
  ```json
  {
    "likeCount": 5,
    "isLiked": true
  }
  ```
- **Response 401**: `{ "error": "인증이 필요합니다.", "code": "authorization" }`
- **Response 404**: `{ "error": "게시글을 찾을 수 없습니다.", "code": "not_found" }`
- **처리 흐름**:
  1. `getTokenFromHeader`로 JWT 추출 및 `verifyToken`으로 검증
  2. 해당 `postId`의 게시글 존재 여부 확인
  3. `PostLike` 레코드 존재 여부 확인 (`findUnique({ where: { postId_userId } })`)
  4. 존재하면 `delete`, 없으면 `create`
  5. 최종 `likeCount`는 `_count` aggregate 또는 직접 count 쿼리로 반환

### GET /api/posts/[id] (기존 수정)

- **역할**: 게시글 상세 조회 (기존) + 좋아요 수 및 현재 사용자 좋아요 여부 추가
- **인증**: 선택적 (Authorization 헤더 있으면 isLiked 계산, 없으면 false)
- **Response 추가 필드**:
  ```json
  {
    "likeCount": 5,
    "isLiked": false
  }
  ```
- **처리 변경**:
  - Authorization 헤더에서 토큰 추출 시도 (실패해도 에러 아님)
  - Prisma query에 `_count: { select: { likes: true } }` 추가
  - 로그인 사용자면 `PostLike.findUnique({ where: { postId_userId } })`로 `isLiked` 계산

### GET /api/posts (기존 수정)

- **역할**: 게시글 목록 조회 (기존) + 각 post에 `_count.likes` 추가
- **처리 변경**:
  - `include._count.select`에 `likes: true` 추가
- **Response 각 item 추가 필드**:
  ```json
  {
    "_count": {
      "comments": 3,
      "likes": 7
    }
  }
  ```

---

## 타입 정의

```typescript
// src/types/post.ts 수정

export interface Post {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  imageUrl: string | null;
  viewCount: number;
  likeCount?: number;    // 추가: 상세 페이지용
  isLiked?: boolean;     // 추가: 상세 페이지용 (로그인 사용자 기준)
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: User;
  _count?: {
    comments: number;
    likes: number;       // 추가: 목록 페이지용
  };
  postTags?: Array<{
    tag: Tag;
  }>;
}

// 좋아요 API 응답 타입 (신규)
export interface LikeResponse {
  likeCount: number;
  isLiked: boolean;
}

// usePostLike 내부 낙관적 업데이트 컨텍스트 타입 (신규)
export interface LikeMutationContext {
  previousLikeCount: number;
  previousIsLiked: boolean;
}
```

---

## TDD 테스트 계획

### 유닛 테스트

#### `postsApi.toggleLike(id)`
- **Given** api.post mock이 `{ likeCount: 1, isLiked: true }` 반환
  **When** `postsApi.toggleLike(1)` 호출
  **Then** `POST /api/posts/1/like`를 호출하고 `{ likeCount: 1, isLiked: true }` 반환

- **Given** api.post mock이 `{ likeCount: 0, isLiked: false }` 반환
  **When** `postsApi.toggleLike(1)` 재호출 (좋아요 취소)
  **Then** 동일 엔드포인트 재호출하고 `isLiked: false` 반환

#### `usePostLike(postId)` 훅
- **Given** `['posts', 1]` 캐시에 `{ likeCount: 3, isLiked: false }` 데이터 존재
  **When** `mutate({ isLiked: false, likeCount: 3 })` 호출 (좋아요 추가)
  **Then** 캐시가 즉시 `{ likeCount: 4, isLiked: true }`로 낙관적 업데이트됨

- **Given** 낙관적 업데이트 후 API 호출이 실패
  **When** `onError` 콜백 실행
  **Then** 캐시가 이전 값 `{ likeCount: 3, isLiked: false }`로 롤백됨

- **Given** API 호출 성공
  **When** `onSuccess` 콜백 실행 (서버 응답 `{ likeCount: 4, isLiked: true }`)
  **Then** `queryClient.invalidateQueries(['posts', 1])` 실행되어 캐시 최종 확정

- **Given** `isPending`이 true인 상태
  **When** 버튼 렌더링
  **Then** `opacity-70 pointer-events-none` 클래스 적용됨

#### `LikeButton` 컴포넌트
- **Given** `isLoggedIn: false`
  **When** 버튼 클릭
  **Then** `usePostLike.mutate` 미호출, "로그인이 필요합니다" Toast 표시

- **Given** `isLoggedIn: true, isLiked: false`
  **When** 버튼 클릭
  **Then** `mutate({ isLiked: false, likeCount })` 호출

- **Given** `isLiked: true`
  **When** 렌더링
  **Then** `aria-pressed="true"`, `aria-label="좋아요 취소"` 속성 존재

- **Given** `isLiked: false`
  **When** 렌더링
  **Then** `aria-pressed="false"`, `aria-label="좋아요"` 속성 존재

#### `LikeBadge` 컴포넌트
- **Given** `likeCount: 0`
  **When** 렌더링
  **Then** `text-gray-400` 클래스 적용, `0` 텍스트 표시

- **Given** `likeCount: 5`
  **When** 렌더링
  **Then** `text-red-400` 클래스 적용, `5` 텍스트 표시

### 통합 테스트

#### `POST /api/posts/[id]/like`

- **Given** 유효한 JWT 토큰, 존재하는 postId, 해당 사용자의 좋아요 없음
  **When** `POST /api/posts/1/like` 요청
  **Then** 응답 200, `{ likeCount: 1, isLiked: true }` 반환, DB에 PostLike 레코드 생성

- **Given** 유효한 JWT 토큰, 존재하는 postId, 이미 좋아요 존재
  **When** `POST /api/posts/1/like` 요청 (토글)
  **Then** 응답 200, `{ likeCount: 0, isLiked: false }` 반환, DB에서 PostLike 레코드 삭제

- **Given** Authorization 헤더 없음
  **When** `POST /api/posts/1/like` 요청
  **Then** 응답 401, `{ code: "authorization" }`

- **Given** 유효한 JWT 토큰, 존재하지 않는 postId
  **When** `POST /api/posts/9999/like` 요청
  **Then** 응답 404, `{ code: "not_found" }`

- **Given** 만료된 JWT 토큰
  **When** `POST /api/posts/1/like` 요청
  **Then** 응답 401, `{ code: "expired_token" }`

#### `GET /api/posts/[id]` (수정 사항 검증)

- **Given** 비로그인 요청 (Authorization 헤더 없음), likeCount 3인 게시글
  **When** `GET /api/posts/1`
  **Then** 응답에 `likeCount: 3, isLiked: false` 포함

- **Given** 로그인 사용자가 좋아요한 게시글 조회
  **When** `GET /api/posts/1` (유효한 JWT 포함)
  **Then** 응답에 `likeCount: 1, isLiked: true` 포함

#### `GET /api/posts` (수정 사항 검증)

- **Given** 좋아요 2개인 게시글이 목록에 있음
  **When** `GET /api/posts`
  **Then** 응답 items의 각 post에 `_count.likes` 숫자 필드 포함

---

## 구현 태스크

> Tidy First 원칙: 구조 변경 커밋과 기능 변경 커밋 분리

### [REFACTOR] 구조적 변경

- [ ] `prisma/schema.prisma`에 `PostLike` 모델 추가 및 `Post`, `User` 모델에 관계 필드 추가
- [ ] `npx prisma migrate dev --name add-post-like` 실행
- [ ] `src/types/post.ts`의 `Post` 인터페이스에 `likeCount?`, `isLiked?`, `_count.likes` 필드 추가
- [ ] `src/types/post.ts`에 `LikeResponse`, `LikeMutationContext` 타입 추가

### [FEAT] 기능 구현

- [ ] `src/__tests__/api/posts/[id]/like.test.ts` 작성 (Red)
- [ ] `src/app/api/posts/[id]/like/route.ts` 구현 (Green) — `getTokenFromHeader`, `verifyToken` 패턴 그대로 사용
- [ ] `src/__tests__/apis/postLike.test.ts` 작성 (Red)
- [ ] `src/apis/posts.ts`에 `toggleLike(id: number): Promise<LikeResponse>` 추가 (Green)
- [ ] `GET /api/posts/[id]/route.ts` 수정 — Authorization 헤더 선택적 파싱, `likeCount`/`isLiked` 응답 추가
- [ ] `GET /api/posts/route.ts` 수정 — `_count.select`에 `likes: true` 추가
- [ ] `src/__tests__/hooks/usePostLike.test.ts` 작성 (Red)
- [ ] `src/hooks/usePostLike.ts` 구현 (Green) — `useMutation` + `onMutate` 낙관적 업데이트 + `onError` 롤백
- [ ] `src/app/posts/_components/LikeBadge.tsx` 구현 — Server Component, `likeCount` props만 수신
- [ ] `src/app/posts/_components/LikeButton.tsx` 구현 — `usePostLike` 연동, Toast 인라인 처리, 접근성 속성
- [ ] `src/app/posts/_components/PostDetail.tsx` 수정 — `LikeButton` 삽입
- [ ] `src/app/posts/_components/PostCard.tsx` 수정 — `LikeBadge` 삽입
- [ ] `src/app/posts/_components/PostListSkeleton.tsx` 수정 — "좋아요" 컬럼 추가

---

## 구현 시 주의사항

### API 인증 패턴 일관성

`src/app/api/posts/[id]/like/route.ts`는 기존 `route.ts`와 동일한 패턴 사용:

```
getTokenFromHeader(authHeader) → verifyToken(token) → expired/invalid 분기 처리
```

### GET /api/posts/[id] 수정 시 선택적 인증

Authorization 헤더가 없어도 게시글 조회는 성공해야 함. 토큰이 없거나 유효하지 않으면 `userId = null`로 처리하고 `isLiked: false` 반환.

### 낙관적 업데이트 queryKey 일치

`usePosts.ts`에서 `POSTS_KEY = ['posts']`, `usePost`의 queryKey는 `['posts', id]`. `usePostLike`에서 캐시를 업데이트할 때 `['posts', postId]`를 정확히 사용해야 함.

### PostListSkeleton 컬럼 수 일치

현재 테이블 헤더 7개 (`체크박스, 번호, 제목, 작성자, 작성일, 조회, 댓글`). 좋아요 컬럼 추가 후 8개로 맞춰야 레이아웃 깨짐 없음. `PostCard`도 동일하게 8개 `<td>` 유지.

### PostLike 복합 PK upsert

Prisma `upsert`보다 `findUnique` → 없으면 `create` / 있으면 `delete` 패턴이 토글 의미를 명확하게 표현. 복합 PK이므로 `where: { postId_userId: { postId, userId } }` 형태 사용.

---

## 검증 방법

- [ ] `npm run dev` 실행 후 `/posts/[id]` 페이지에서 LikeButton 렌더링 확인
- [ ] 비로그인 상태에서 좋아요 버튼 클릭 시 Toast 메시지 표시 확인
- [ ] 로그인 후 좋아요 클릭 → 즉시 하트 채워짐 (낙관적 업데이트) 확인
- [ ] 네트워크 지연/실패 시 롤백 동작 확인 (DevTools Network throttle 활용)
- [ ] `/posts` 목록 페이지에서 각 행에 LikeBadge 표시 확인
- [ ] `npx jest src/__tests__/api/posts --testPathPattern=like` — API 통합 테스트
- [ ] `npx jest src/__tests__/apis/postLike` — API 클라이언트 단위 테스트
- [ ] `npx jest src/__tests__/hooks/usePostLike` — 훅 단위 테스트
- [ ] `npx jest --coverage` — 전체 커버리지 확인
