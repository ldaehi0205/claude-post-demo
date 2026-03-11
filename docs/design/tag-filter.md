---
idea_ref: docs/ideas/2026-03-12-tag-filter.md
date: 2026-03-12
status: designed
feature_slug: tag-filter
---

# 태그 기반 게시글 필터링 UI 설계 명세

## 영향 범위

- 수정 파일:
  - `src/app/posts/page.tsx`
  - `src/app/posts/_components/TagSidebar.tsx`
- 신규 파일:
  - `src/app/posts/_components/ActiveTagFilter.tsx`

## 현재 구현 상태 분석

코드 분석 결과, 단일 태그 선택 및 URL 반영(`/posts?tag=javascript`)은 `TagSidebar.tsx`에 이미 구현되어 있습니다. `PostsPage`에서 태그 뱃지 표시도 부분 구현되어 있으나 X 버튼(필터 해제)이 없습니다.

| 항목 | 현재 상태 | 개선 필요 여부 |
|---|---|---|
| 단일 태그 클릭 → URL 반영 | 구현 완료 | 없음 |
| 태그 선택 시 active 스타일 | 구현 완료 (`bg-blue-100 text-blue-700`) | 개선 가능 |
| 선택된 태그 뱃지 표시 | 부분 구현 (X 버튼 없음) | 보완 필요 |
| 전체 해제 버튼 | 미구현 | 신규 필요 |
| 다중 태그 선택 | 미구현 | 신규 필요 (선택적) |

## 컴포넌트 트리

```
PostsPage (수정 - Server Component)
├── aside
│   └── TagSidebar (수정 - Client Component)
│       └── 태그 목록 버튼들 (active 스타일 개선)
└── main 영역
    ├── PostSearchBar (post-search 설계 참고)
    ├── ActiveTagFilter (신규 - Client Component)  ← 태그 뱃지 + 해제 버튼
    └── PostList (재사용)
```

## 컴포넌트 명세

### ActiveTagFilter

- **경로**: `src/app/posts/_components/ActiveTagFilter.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  interface ActiveTagFilterProps {
    selectedTag: string;          // 현재 선택된 단일 태그
    onRemove: (tag: string) => void;
    onClearAll: () => void;
  }
  ```
- **레이아웃**:
  - 컨테이너: `flex items-center gap-2 flex-wrap mb-4 p-3 bg-blue-50 rounded-lg`
  - 레이블 텍스트: `text-sm text-gray-500 shrink-0` — "필터:"
  - 태그 뱃지: `inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full border border-blue-200`
    - 태그 텍스트: `#${selectedTag}`
    - X 버튼: `ml-0.5 text-blue-400 hover:text-blue-600 transition-colors` (12px SVG `×`)
      - `aria-label="태그 필터 제거"`
  - 전체 해제 버튼: `ml-auto text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors` — "전체 보기"
- **상태/이벤트**:
  ```typescript
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRemove = (tag: string) => {
    // tag 파라미터 제거, search 파라미터 유지
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tag');
    router.push(`/posts${params.size > 0 ? '?' + params.toString() : ''}`);
    onRemove(tag);
  };

  const handleClearAll = () => {
    // 모든 필터 파라미터 제거 (tag, search 모두)
    router.push('/posts');
    onClearAll();
  };
  ```
- **렌더링 조건**: `selectedTag`가 있을 때만 렌더링. 없으면 `null` 반환.

---

### TagSidebar (수정)

- **경로**: `src/app/posts/_components/TagSidebar.tsx`
- **타입**: Client Component (기존 유지)
- **변경 사항 — active 태그 스타일 개선**:

  현재 active 스타일:
  ```
  bg-blue-100 text-blue-700 font-semibold
  ```

  개선된 active 스타일:
  ```
  bg-blue-500 text-white font-medium
  ```
  - 더 명확한 시각적 구분을 위해 배경색을 진하게 변경
  - 선택된 태그 좌측에 체크 아이콘 추가: `w-3.5 h-3.5 text-white shrink-0` (선택 시만 표시)
  - 태그 이름과 카운트 사이 구조 조정:
    ```typescript
    // 기존
    <span>#{tag.name}</span>
    <span className="ml-1 text-gray-400">({tag.postCount})</span>

    // 변경 (active 상태)
    <span className="flex items-center gap-1.5 w-full">
      {isActive && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">#{tag.name}</span>
      <span className={`ml-auto text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
        {tag.postCount}
      </span>
    </span>
    ```
  - 호버 상태 (비선택): `hover:bg-gray-100 text-gray-700` (기존 유지)

---

### PostsPage (수정)

- **경로**: `src/app/posts/page.tsx`
- **타입**: Server Component (기존 유지)
- **변경 사항**:
  - 기존 인라인 태그 뱃지 영역을 `ActiveTagFilter` 컴포넌트로 교체
  - `ActiveTagFilter`는 Client Component이므로 `<Suspense>` 필요
  ```typescript
  // 기존
  {tagFilter && (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
      <span className="text-sm text-gray-600">
        필터: <span className="font-semibold text-blue-700">#{tagFilter}</span>
      </span>
    </div>
  )}

  // 변경
  <Suspense fallback={null}>
    {tagFilter && (
      <ActiveTagFilter
        selectedTag={tagFilter}
        onRemove={() => {}}
        onClearAll={() => {}}
      />
    )}
  </Suspense>
  ```
  - 단, `ActiveTagFilter`가 내부에서 `useRouter`로 직접 처리하므로 `onRemove`/`onClearAll` 콜백은 선택적으로 비워도 됨

## 사용자 인터랙션 흐름

1. 사용자가 `/posts` 페이지에서 좌측 `TagSidebar`의 태그를 클릭한다.
2. 클릭한 태그가 활성(active) 스타일(파란 배경 + 체크 아이콘)로 변한다.
3. URL이 `/posts?tag=javascript`로 변경된다.
4. `PostList`가 해당 태그로 필터링된 게시글을 표시한다.
5. 목록 상단에 `ActiveTagFilter`가 나타난다: "필터: #javascript ×" + "전체 보기" 버튼.
6. 사용자가 뱃지의 X 버튼을 클릭한다.
   - URL에서 `tag` 파라미터 제거 → `/posts` 또는 `/posts?search=keyword` (검색어 유지)
   - `TagSidebar`의 active 태그가 해제된다.
   - `ActiveTagFilter`가 사라진다.
7. 사용자가 "전체 보기"를 클릭한다.
   - URL이 `/posts`로 초기화된다 (검색어 포함 모든 필터 제거).
8. 이미 선택된 태그를 `TagSidebar`에서 다시 클릭하면 선택 해제된다 (기존 토글 동작 유지).

## API 연동

- `GET /api/posts?tag=javascript` — 기존 구현 사용 (변경 없음)
- `GET /api/tags` — 기존 사용 (변경 없음)

## 구현 시 주의사항

- **다중 태그 선택은 이번 범위 외**: 아이디어 문서에서 제안했지만 설계 복잡도를 낮추기 위해 단일 태그 선택으로 한정. 추후 `?tags=js,react` 형태로 확장 가능하도록 URL 파라미터 이름을 단수 `tag`로 유지한다.
- `ActiveTagFilter`는 `useSearchParams()`를 사용하므로 `<Suspense>` 경계가 필요하다. `PostsPage`는 Server Component이므로 `<Suspense fallback={null}>`으로 감싸면 된다.
- `TagSidebar`의 active 스타일 변경은 기존 `selectedTag === tag.name` 조건 로직을 그대로 유지하면서 className만 교체하므로 동작 변경 없음.
- `TagSidebar`에 체크 아이콘을 추가할 경우, 외부 라이브러리 없이 인라인 SVG 또는 Unicode 문자(`✓`)를 사용한다.
- `PostsPage`에서 `searchParams.tag`를 `ActiveTagFilter`에 prop으로 전달하는 방식으로 초기 렌더링 시 Server Component에서 이미 tag 값을 알 수 있어 하이드레이션 깜빡임을 방지한다.
- 접근성: X 버튼에 `aria-label="#{selectedTag} 태그 필터 제거"`, "전체 보기" 버튼에 `aria-label="모든 필터 해제"` 적용.
