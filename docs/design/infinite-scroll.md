---
idea_ref: docs/ideas/2026-03-12-infinite-scroll.md
date: 2026-03-12
status: designed
feature_slug: infinite-scroll
---

# 게시글 목록 무한 스크롤 UI 설계 명세

## 영향 범위

- 수정 파일:
  - `src/app/posts/_components/PostList.tsx`
  - `src/app/posts/_components/PostListSkeleton.tsx`
- 재사용 파일 (변경 없음):
  - `src/app/posts/_components/PostSkeletonRows.tsx`
  - `src/app/posts/_components/PostCard.tsx`

> **참고**: 코드 분석 결과, `PostList.tsx`에는 이미 `useInfinitePosts`, `IntersectionObserver`, sentinel div가 구현되어 있습니다. 이 설계 명세는 현재 구현의 UI 개선 사항과 미완성 부분에 집중합니다.

## 현재 구현 상태 분석

| 항목 | 현재 상태 | 개선 필요 여부 |
|---|---|---|
| `useInfinitePosts` 훅 | 구현 완료 | 없음 |
| `IntersectionObserver` sentinel | 구현 완료 | 없음 |
| 다음 페이지 로딩 중 스켈레톤 | `PostSkeletonRows` 사용 중 | 없음 |
| 모든 게시글 로드 완료 텍스트 | "모든 게시글을 불러왔습니다" 구현 완료 | 개선 가능 |
| 페이지네이션 버튼 | 없음 (이미 무한스크롤) | 없음 |
| 초기 로딩 에러 UI | 구현 완료 | 없음 |
| 추가 로딩 에러 UI | 구현 완료 | 없음 |
| 로드 완료 UI 디자인 개선 | 단순 텍스트 | 개선 필요 |

## 컴포넌트 트리

```
PostList (수정 - Client Component)
├── DeleteButton 영역 (기존)
├── table
│   ├── thead (기존)
│   └── tbody
│       ├── PostSkeletonRows (재사용) — 초기 로딩
│       ├── PostCard × n (재사용)
│       └── PostSkeletonRows (재사용) — 추가 로딩 중
├── PostEmptyState (post-search 설계와 공유)
├── InfiniteScrollFooter (신규)  ← sentinel + 상태 표시 통합
└── 에러 재시도 영역 (기존, 스타일 유지)
```

## 컴포넌트 명세

### InfiniteScrollFooter

- **경로**: `src/app/posts/_components/InfiniteScrollFooter.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  interface InfiniteScrollFooterProps {
    sentinelRef: RefObject<HTMLDivElement>;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isError: boolean;
    postsCount: number;
    onRetry: () => void;
  }
  ```
- **레이아웃 — 상태별 렌더링**:

  1. **추가 로딩 중** (`isFetchingNextPage = true`):
     - sentinel div: `<div ref={sentinelRef} className="h-1" />`
     - 아래에 로딩 인디케이터: `flex justify-center py-6`
       - 스피너: `w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin`
       - 텍스트: `ml-2 text-sm text-gray-400` — "게시글을 불러오는 중..."

  2. **모든 게시글 로드 완료** (`!hasNextPage && postsCount > 0`):
     - sentinel div: `<div ref={sentinelRef} className="h-1" />`
     - 완료 표시:
       ```
       flex flex-col items-center py-8 gap-2
       ├── 구분선: hr className="w-16 border-gray-200"
       ├── 텍스트: text-xs text-gray-400 — "마지막 게시글입니다"
       └── 게시글 수: text-xs text-gray-300 — "총 {postsCount}개"
       ```

  3. **추가 로딩 에러** (`isError && postsCount > 0`):
     - sentinel div: `<div ref={sentinelRef} className="h-1" />`
     - 에러 UI: `flex flex-col items-center gap-2 py-4`
       - 텍스트: `text-sm text-gray-500` — "추가 게시글을 불러오지 못했습니다"
       - 재시도 버튼: `px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600`

  4. **기본 상태** (`hasNextPage && !isFetchingNextPage`):
     - sentinel div만 렌더링: `<div ref={sentinelRef} className="h-1" />`

---

### PostList (수정)

- **경로**: `src/app/posts/_components/PostList.tsx`
- **타입**: Client Component (기존 유지)
- **변경 사항**:
  - 현재 흩어진 하단 상태 UI (로딩 스피너, 완료 텍스트, 에러 재시도, sentinel div)를 `InfiniteScrollFooter`로 통합
  - 기존 `sentinelRef`를 `InfiniteScrollFooter`에 전달
  - 기존 개별 조건부 렌더링 4개 블록 제거 후 단일 컴포넌트로 교체:
    ```typescript
    // 기존 (4개 조건부 블록 + sentinel)
    {isFetchingNextPage && ...}
    {isError && posts.length > 0 && ...}
    {!hasNextPage && posts.length > 0 && ...}
    <div ref={sentinelRef} className="h-1" />

    // 변경 (단일 컴포넌트)
    <InfiniteScrollFooter
      sentinelRef={sentinelRef}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isError={isError}
      postsCount={posts.length}
      onRetry={fetchNextPage}
    />
    ```

---

### PostListSkeleton (수정)

- **경로**: `src/app/posts/_components/PostListSkeleton.tsx`
- **변경 사항**:
  - 현재 8개 `<th>`/`<td>` 컬럼 수가 실제 `PostList` 테이블과 불일치 확인 필요
    - `PostList` thead: 체크박스, 번호, 제목, 작성자, 작성일, 조회, 댓글 (7컬럼)
    - `PostListSkeleton` tbody: 8컬럼 (초과 1개)
  - 실제 `PostList`의 컬럼 수와 동일하게 맞춤 (7컬럼으로 수정)
  - post-like 기능 구현 시 좋아요 컬럼 추가에 맞춰 8컬럼으로 확장 예정

## 사용자 인터랙션 흐름

1. 사용자가 `/posts` 페이지에 진입한다.
2. `PostSkeletonRows` 5개가 테이블에 표시된다 (초기 로딩).
3. 첫 페이지(10개) 데이터가 로드되어 `PostCard` 목록이 표시된다.
4. 사용자가 페이지를 스크롤하여 목록 하단에 도달한다.
5. `IntersectionObserver`가 sentinel div를 감지한다 (`rootMargin: '200px'`).
6. `fetchNextPage()`가 자동 호출된다.
7. `InfiniteScrollFooter`가 로딩 스피너 + "게시글을 불러오는 중..." 텍스트를 표시한다.
8. 다음 페이지 데이터가 테이블 하단에 추가 렌더링된다.
9. 4~8 과정이 반복된다.
10. 더 이상 페이지가 없을 때 (`hasNextPage = false`), 구분선 + "마지막 게시글입니다" + 총 게시글 수가 표시된다.
11. 네트워크 에러로 추가 로딩 실패 시 "다시 시도" 버튼이 표시되고, 클릭하면 `fetchNextPage()` 재호출한다.

## API 연동

- `GET /api/posts?cursor=<lastId>&limit=10` — 기존 cursor 기반 API 사용 (변경 없음)
- `useInfinitePosts` 훅 — 기존 사용 (변경 없음)

## 구현 시 주의사항

- 대부분의 핵심 로직이 이미 구현되어 있으므로, 이번 작업의 주요 범위는 **UI 컴포넌트 정리(리팩터링)**이다. 행위 변경보다 구조적 변경에 해당하므로 Tidy First 원칙에 따라 별도 커밋으로 분리한다.
- `InfiniteScrollFooter`로 통합 시 기존 `sentinelRef`의 참조가 올바르게 전달되는지 확인 필요. `forwardRef` 또는 `ref` prop 직접 전달 방식 중 선택한다.
- `PostListSkeleton` 컬럼 수 불일치는 독립적인 버그 수정으로 분리하여 커밋한다.
- sentinel의 `rootMargin: '200px'`는 모바일에서 사용자가 하단에 도달하기 200px 전에 미리 로딩을 시작하므로, 실제 사용 환경에서 적절한 값인지 모바일 디바이스에서 검증한다.
- 검색/태그 필터 변경 시 cursor 초기화가 올바르게 동작하는지 `useInfinitePosts` 훅에서 `queryKey` 의존성 확인.
