---
idea_ref: docs/ideas/2026-03-12-post-search.md
date: 2026-03-12
status: designed
feature_slug: post-search
---

# 게시글 검색 기능 UI 설계 명세

## 영향 범위

- 수정 파일:
  - `src/app/posts/page.tsx`
  - `src/app/posts/_components/PostList.tsx`
- 신규 파일:
  - `src/app/posts/_components/PostSearchBar.tsx`
  - `src/app/posts/_components/PostEmptyState.tsx`

## 컴포넌트 트리

```
PostsPage (수정 - Server Component)
├── aside > TagSidebar (재사용)
└── main 영역
    ├── PostSearchBar (신규 - Client Component)  ← 목록 상단
    ├── 태그 필터 뱃지 (기존 인라인, 유지)
    └── PostList (수정 - Client Component)
        ├── 테이블 헤더 (기존)
        ├── PostSkeletonRows (재사용) — 검색 중 로딩
        ├── PostCard (재사용) × n
        └── PostEmptyState (신규) — 결과 없을 때
```

## 컴포넌트 명세

### PostSearchBar

- **경로**: `src/app/posts/_components/PostSearchBar.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  interface PostSearchBarProps {
    defaultValue?: string;  // URL searchParams에서 초기값 주입
  }
  ```
- **레이아웃**:
  - 컨테이너: `relative w-full max-w-xl`
  - 좌측 돋보기 아이콘: `absolute left-3 top-1/2 -translate-y-1/2 text-gray-400` (16px SVG)
  - 인풋: `w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`
    - placeholder: "제목 또는 내용으로 검색"
  - 우측 클리어(X) 버튼: `absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600` — `value`가 비어 있으면 숨김 (`hidden`)
  - 로딩 인디케이터: X 버튼 자리에 스피너(`animate-spin`) — URL 반영 전 pending 상태 (optional, `useTransition` 활용)
- **상태/이벤트**:
  ```typescript
  const [value, setValue] = useState(defaultValue ?? '');
  const router = useRouter();
  const searchParams = useSearchParams();

  // debounce 300ms 후 URL 반영
  // 검색어 있으면: router.replace(`/posts?search=${encoded}`)
  // 검색어 없으면: 기존 tag 파라미터 유지하며 search 제거
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // debounce 처리
  };

  const handleClear = () => {
    setValue('');
    // search 파라미터 제거, tag 파라미터 유지
  };
  ```
- **URL 동기화 규칙**:
  - 검색어 입력 → `/posts?search=keyword` (tag 파라미터 있으면 `/posts?tag=foo&search=keyword`)
  - 클리어 → search 파라미터만 제거, 나머지 파라미터 유지
  - `router.replace` 사용 (히스토리 오염 방지)

---

### PostEmptyState

- **경로**: `src/app/posts/_components/PostEmptyState.tsx`
- **타입**: Server Component (props만 받는 순수 UI)
- **Props**:
  ```typescript
  interface PostEmptyStateProps {
    searchQuery?: string;
    tagFilter?: string;
  }
  ```
- **레이아웃**:
  - 컨테이너: `flex flex-col items-center justify-center py-20 gap-3 text-center`
  - 아이콘: SVG 문서 검색 아이콘 48px, `text-gray-300`
  - 제목: `text-base font-medium text-gray-500`
    - `searchQuery` 있을 때: `"'${searchQuery}'에 대한 검색 결과가 없습니다"`
    - `tagFilter` 있을 때: `"'#${tagFilter}' 태그의 게시글이 없습니다"`
    - 둘 다 없을 때: `"게시글이 없습니다"`
  - 서브텍스트: `text-sm text-gray-400` — "다른 검색어나 태그를 시도해보세요"
- **상태/이벤트**: 없음

---

### PostList (수정)

- **경로**: `src/app/posts/_components/PostList.tsx`
- **타입**: Client Component (기존 유지)
- **Props 추가**:
  ```typescript
  interface PostListProps {
    tag?: string;
    search?: string;  // 신규 추가
  }
  ```
- **레이아웃 변경**:
  - 빈 상태 처리 부분을 기존 `<p>` 텍스트에서 `<PostEmptyState>` 컴포넌트로 교체
    ```typescript
    // 기존
    <p className="text-center text-gray-400 py-10">게시글이 없습니다.</p>
    // 변경
    <PostEmptyState searchQuery={search} tagFilter={tag} />
    ```
  - 테이블 헤더에 "좋아요" 컬럼은 이번 태스크 범위 외 (post-like 설계 참고)
- **훅 변경**:
  - `useInfinitePosts(tag)` → `useInfinitePosts({ tag, search })`로 파라미터 확장

---

### PostsPage (수정)

- **경로**: `src/app/posts/page.tsx`
- **타입**: Server Component (기존 유지)
- **Props 변경**:
  ```typescript
  interface PostsPageProps {
    searchParams: {
      tag?: string;
      search?: string;  // 신규 추가
    };
  }
  ```
- **레이아웃 변경**:
  - `<PostList>` 위에 `<PostSearchBar defaultValue={searchParams.search} />` 삽입
  - 태그 필터 뱃지 영역 위에 배치 (순서: SearchBar → 태그뱃지 → PostList)
  - SearchBar와 태그 뱃지 사이 간격: `mb-3`

## 사용자 인터랙션 흐름

1. 사용자가 `/posts` 페이지 목록 상단의 검색 인풋에 키워드를 입력한다.
2. 300ms debounce 후 URL이 `/posts?search=keyword`로 교체된다.
3. `PostList`가 `search` prop을 받아 `useInfinitePosts` queryKey를 `['posts', { search: 'keyword' }]`로 변경한다.
4. TanStack Query가 `GET /api/posts?search=keyword`를 호출한다.
5. 데이터 로딩 중 기존 `PostSkeletonRows`가 표시된다.
6. 결과가 있으면 `PostCard` 목록이 렌더링된다.
7. 결과가 없으면 `PostEmptyState`가 검색어를 포함한 안내 문구와 함께 표시된다.
8. 사용자가 X 버튼을 클릭하면 검색어가 지워지고 URL에서 `search` 파라미터가 제거된다.
9. 태그 필터와 검색이 동시에 활성화된 경우 URL은 `/posts?tag=foo&search=keyword` 형태로 유지된다.

## API 연동

- `GET /api/posts?search=keyword` — 신규 쿼리 파라미터 추가 필요
  - Prisma 조건: `where: { OR: [{ title: { contains: q } }, { content: { contains: q } }] }`
  - 기존 `tag` 파라미터와 AND 조건으로 결합 가능
- `GET /api/tags` — 기존 사용 (변경 없음)

## 구현 시 주의사항

- `useSearchParams()`는 Suspense 경계 내부에서만 사용 가능. `PostSearchBar`를 `<Suspense>`로 감싸거나 `PostsPage`의 `searchParams`에서 초기값을 내려주는 방식을 병행한다.
- debounce 구현 시 외부 라이브러리 없이 `useRef` + `setTimeout`/`clearTimeout` 패턴 사용.
- `router.replace` 사용으로 검색 시 브라우저 히스토리가 오염되지 않도록 한다.
- 한국어 검색 시 IME 조합 중에 debounce가 발동되지 않도록 `onCompositionStart`/`onCompositionEnd` 이벤트로 조합 상태 추적.
- 검색 인풋은 `Input.tsx` 컴포넌트를 직접 재사용하지 않고, 돋보기/클리어 아이콘 레이아웃이 필요하므로 `PostSearchBar` 내에서 `<input>` 요소를 직접 사용한다.
- 접근성: 인풋에 `aria-label="게시글 검색"`, 클리어 버튼에 `aria-label="검색어 지우기"` 적용.
