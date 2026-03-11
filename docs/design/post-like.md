---
idea_ref: docs/ideas/2026-03-12-post-like.md
date: 2026-03-12
status: designed
feature_slug: post-like
---

# 게시글 좋아요(반응) 기능 UI 설계 명세

## 영향 범위

- 수정 파일:
  - `src/app/posts/_components/PostDetail.tsx`
  - `src/app/posts/_components/PostCard.tsx`
  - `src/app/posts/_components/PostListSkeleton.tsx`
- 신규 파일:
  - `src/app/posts/_components/LikeButton.tsx`
  - `src/app/posts/_components/LikeBadge.tsx`
  - `src/hooks/usePostLike.ts`

## 컴포넌트 트리

```
PostDetail (수정 - Client Component)
├── 게시글 메타 (제목, 작성자, 날짜, 조회수) — 기존
├── AI 요약 박스 — 기존
├── MarkdownPreview — 기존
├── LikeButton (신규)           ← 본문 하단, 액션 버튼 위
└── 액션 버튼 영역 (수정, 삭제, 목록) — 기존

PostCard (수정 - Client Component)
└── <tr> 내부
    └── LikeBadge (신규)        ← 조회수 <td> 옆 새 <td>
```

## 컴포넌트 명세

### LikeButton

- **경로**: `src/app/posts/_components/LikeButton.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  interface LikeButtonProps {
    postId: number;
    likeCount: number;
    isLiked: boolean;
    isLoggedIn: boolean;
  }
  ```
- **레이아웃**:
  - 컨테이너: `flex justify-center py-6 mb-4 border-t border-b border-gray-100`
  - 버튼: `flex flex-col items-center gap-1.5 group`
    - 하트 아이콘 영역: `w-12 h-12 rounded-full flex items-center justify-center transition-colors`
      - 좋아요 상태(`isLiked = true`): `bg-red-50 text-red-500 group-hover:bg-red-100`
      - 기본 상태(`isLiked = false`): `bg-gray-100 text-gray-400 group-hover:bg-gray-200`
    - 하트 SVG 아이콘 (24px):
      - `isLiked = true`: 채워진 하트 (`fill-current`)
      - `isLiked = false`: 빈 하트 (outline)
    - 좋아요 수 텍스트: `text-sm font-medium`
      - `isLiked = true`: `text-red-500`
      - `isLiked = false`: `text-gray-500`
  - 낙관적 업데이트 중(pending): 버튼 `opacity-70 pointer-events-none`
- **상태/이벤트**:

  ```typescript
  const { mutate, isPending } = usePostLike(postId);

  const handleClick = () => {
    if (!isLoggedIn) {
      // Toast 표시: "로그인이 필요합니다"
      return;
    }
    mutate({ isLiked, likeCount });
  };
  ```

---

### LikeBadge

- **경로**: `src/app/posts/_components/LikeBadge.tsx`
- **타입**: Server Component (순수 표시)
- **Props**:
  ```typescript
  interface LikeBadgeProps {
    likeCount: number;
  }
  ```
- **레이아웃**:
  - `inline-flex items-center gap-0.5 text-sm text-gray-400`
  - 미니 하트 아이콘 (12px, outline): `text-gray-300`
  - 좋아요 수 텍스트: `likeCount`
  - `likeCount === 0`이면 회색, `likeCount > 0`이면 `text-red-400`

---

### usePostLike (커스텀 훅)

- **경로**: `src/hooks/usePostLike.ts`
- **타입**: Client Hook
- **시그니처**:

  ```typescript
  interface LikeMutationContext {
    previousLikeCount: number;
    previousIsLiked: boolean;
  }

  function usePostLike(postId: number): {
    mutate: (currentState: { isLiked: boolean; likeCount: number }) => void;
    isPending: boolean;
  };
  ```

- **동작**:
  - `useMutation` 사용
  - `onMutate`: TanStack Query 캐시에서 현재 `post` 데이터를 가져와 낙관적으로 `isLiked`, `likeCount` 반전
  - `onError`: 롤백 (컨텍스트의 이전 값 복원)
  - `onSuccess`: 서버 응답값으로 캐시 최종 확정
  - `queryKey`: `['post', postId]` 캐시 무효화

---

### PostDetail (수정)

- **경로**: `src/app/posts/_components/PostDetail.tsx`
- **타입**: Client Component (기존 유지)
- **레이아웃 변경**:
  - `<MarkdownPreview>` 와 액션 버튼 `<div className="flex gap-2">` 사이에 `<LikeButton>` 삽입
  - `post` 데이터에 `likeCount: number`, `isLiked: boolean` 필드 필요
  ```typescript
  <LikeButton
    postId={id}
    likeCount={post.likeCount}
    isLiked={post.isLiked}
    isLoggedIn={!!user}
  />
  ```

---

### PostCard (수정)

- **경로**: `src/app/posts/_components/PostCard.tsx`
- **타입**: Client Component (기존 유지)
- **변경 사항**:
  - 기존 `<td>` 구조에 좋아요 컬럼 추가 (조회수 `<td>` 우측)
  ```typescript
  <td className="py-3 px-2 text-center">
    <LikeBadge likeCount={post._count?.likes ?? 0} />
  </td>
  ```

  - `Post` 타입에 `_count.likes` 필드 추가 필요

---

### PostListSkeleton (수정)

- **경로**: `src/app/posts/_components/PostListSkeleton.tsx`
- **변경 사항**:
  - 테이블 헤더에 "좋아요" `<th>` 컬럼 추가 (`w-16 text-center`)
  - 스켈레톤 `<tr>` 각 행에 좋아요 스켈레톤 `<td>` 추가
    ```typescript
    <td className="py-3 px-2 text-center">
      <div className="h-4 w-8 bg-gray-100 rounded mx-auto animate-pulse" />
    </td>
    ```

---

### Toast (신규 또는 기존 활용)

- **경로**: `src/components/ui/Toast.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  interface ToastProps {
    message: string;
    type?: 'info' | 'error' | 'success';
    duration?: number; // ms, 기본 3000
  }
  ```
- **레이아웃**:
  - `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
  - `px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white`
  - type별 배경색: `info → bg-gray-800`, `error → bg-red-500`, `success → bg-green-500`
  - 애니메이션: `animate-fade-in-up` (Tailwind 커스텀 keyframe 또는 `transition-opacity`)
- **표시 방법**: 전역 Toast 상태 관리보다 단순하게 `LikeButton` 내에서 `useState` + `useEffect`로 3초 후 자동 제거하는 인라인 방식으로 시작

## 사용자 인터랙션 흐름

1. 사용자가 게시글 상세 페이지(`/posts/[id]`)에 진입한다.
2. 본문 하단, 액션 버튼 위에 `LikeButton`이 표시된다.
   - 비로그인: 빈 하트 아이콘 + 좋아요 수 (클릭 가능하지만 안내 메시지 표시)
   - 로그인 + 이미 좋아요: 채워진 빨간 하트 + 좋아요 수 (빨간색 텍스트)
   - 로그인 + 좋아요 안 함: 빈 하트 아이콘 + 좋아요 수 (회색)
3. 로그인 사용자가 빈 하트 버튼을 클릭한다.
   - 즉시(낙관적): 하트가 채워진 빨간색으로 변하고 좋아요 수가 +1 된다.
   - `POST /api/posts/[id]/like` 요청 전송.
   - 성공: 서버 응답값으로 최종 확정.
   - 실패: 하트가 원래 상태로 롤백되고 에러 Toast 표시.
4. 로그인 사용자가 채워진 하트 버튼을 클릭한다 (좋아요 취소).
   - 즉시(낙관적): 하트가 빈 상태로 변하고 좋아요 수가 -1 된다.
   - 동일한 `POST /api/posts/[id]/like` 엔드포인트로 토글 요청.
5. 비로그인 사용자가 좋아요 버튼을 클릭한다.
   - "로그인이 필요합니다" Toast 메시지가 하단에 3초간 표시된다.
   - 페이지 이동 없음 (UX 흐름 유지).
6. 게시글 목록에서 `PostCard`의 `LikeBadge`로 각 게시글의 좋아요 수를 확인한다.

## API 연동

- `POST /api/posts/[id]/like` — 신규 필요 (토글 방식: 좋아요 있으면 삭제, 없으면 생성)
  - 인증 필요 (JWT 검증)
  - Response: `{ likeCount: number, isLiked: boolean }`
- `GET /api/posts/[id]` — 기존 수정 필요
  - Response에 `likeCount`, `isLiked` 필드 추가
- `GET /api/posts` — 기존 수정 필요
  - Response의 각 post에 `_count.likes` 필드 추가

## 구현 시 주의사항

- Prisma 스키마 변경 필요: `PostLike` 모델 추가, `Post` 모델에 `likes PostLike[]` 관계 추가.
- `isLiked` 필드는 현재 로그인한 사용자 기준이므로 API에서 userId를 참조하여 계산해야 한다. 비로그인 사용자의 경우 항상 `false`.
- 낙관적 업데이트 시 `queryClient.getQueryData(['post', postId])`로 현재 캐시를 읽고 `queryClient.setQueryData`로 즉시 업데이트, `onError`에서 롤백한다.
- `PostCard`는 현재 `likeCount`만 표시 (비인터랙티브). 목록에서는 좋아요 토글을 지원하지 않는다.
- `LikeBadge`는 `Post` 타입의 `_count.likes`를 사용하므로 `Post` 타입 정의 업데이트 필요.
- 테이블 헤더와 `PostListSkeleton`에도 새 "좋아요" 컬럼을 추가해야 레이아웃 깨짐을 방지한다.
- 접근성: `LikeButton`에 `aria-label={isLiked ? '좋아요 취소' : '좋아요'}`, `aria-pressed={isLiked}` 적용.
