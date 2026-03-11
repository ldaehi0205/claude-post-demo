---
date: 2026-03-12
status: idea
priority: high
category: ux
feature_slug: post-search
---

# 게시글 검색 기능

## 문제 정의
현재 게시글을 탐색하는 유일한 수단이 전체 목록 스크롤 또는 태그 사이드바뿐이다.
게시글이 늘어날수록 원하는 글을 찾기 어려워지고, 재방문 사용자의 콘텐츠 소비가 어렵다.

## 제안 솔루션
- 게시글 목록 페이지 상단에 검색 인풋 배치
- 제목 + 내용 기준 키워드 검색 (Prisma `contains`)
- URL 쿼리 파라미터 연동 (`/posts?search=keyword`) → 공유 및 북마크 가능
- 입력 debounce 300ms 적용으로 API 과호출 방지
- 검색 결과 없을 때 빈 상태(Empty State) UI 표시

## 기대 효과
- 원하는 게시글 탐색 시간 단축
- 재방문 사용자의 콘텐츠 소비율 향상
- 태그 필터링과 결합 시 강력한 탐색 경험

## 개발 난이도
🟡 보통

## 우선순위 점수
8점

## 구현 힌트
- `GET /api/posts?search=keyword` 쿼리 파라미터 추가
- Prisma: `where: { OR: [{ title: { contains: q } }, { content: { contains: q } }] }`
- `useSearchParams` + `useRouter` 조합으로 URL 동기화
- TanStack Query `queryKey: ['posts', { search }]` 로 캐시 분리

## 디자인 요구사항 (design-agent 전달용)
- 관련 페이지/컴포넌트: `src/app/posts/page.tsx`, `PostList.tsx`
- 예상 UI 변경 범위:
  - 게시글 목록 상단에 검색 인풋 컴포넌트 추가 (돋보기 아이콘 포함)
  - 검색 중 로딩 스피너 또는 skeleton 표시
  - 검색 결과 없을 때 Empty State (아이콘 + 안내 문구)
  - 검색어 클리어(X) 버튼
- 참고할 기존 컴포넌트: `Input.tsx`, `PostList.tsx`, `PostListSkeleton.tsx`
