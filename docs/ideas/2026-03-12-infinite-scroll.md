---
date: 2026-03-12
status: idea
priority: medium
category: performance
feature_slug: infinite-scroll
---

# 게시글 목록 무한 스크롤

## 문제 정의
현재 게시글 목록이 페이지 기반 pagination 이거나 전체 로딩 방식일 경우, 게시글이 많아질수록
초기 로딩 시간이 증가하고 모바일 UX가 저하된다. 페이지 번호 클릭 방식은 모바일에 적합하지 않다.

## 제안 솔루션
- cursor-based 무한 스크롤로 전환 (offset 방식의 성능 문제 해결)
- 뷰포트 하단 도달 시 다음 페이지 자동 로드 (`IntersectionObserver`)
- 스켈레톤 로딩으로 자연스러운 콘텐츠 추가 표시
- 로드 완료 시 "모든 게시글을 불러왔습니다" 표시

## 기대 효과
- 모바일 사용자 경험 대폭 향상
- 초기 로딩 데이터 양 감소 (페이지당 10개)
- 콘텐츠 소비 시간 증가 (스크롤 연속성)

## 개발 난이도
🟡 보통

## 우선순위 점수
8점

## 구현 힌트
- `GET /api/posts?cursor=<lastId>&limit=10` cursor 기반 API
- Prisma: `where: { id: { lt: cursor } }, orderBy: { id: 'desc' }, take: limit`
- TanStack Query `useInfiniteQuery` + `getNextPageParam`
- `IntersectionObserver`로 sentinel div 감지

## 디자인 요구사항 (design-agent 전달용)
- 관련 페이지/컴포넌트: `src/app/posts/page.tsx`, `PostList.tsx`, `PostListSkeleton.tsx`
- 예상 UI 변경 범위:
  - 페이지 하단에 로딩 스피너 또는 스켈레톤 카드 추가
  - 모든 게시글 로드 완료 시 "마지막 게시글입니다" 텍스트
  - 기존 페이지네이션 버튼 제거
- 참고할 기존 컴포넌트: `PostList.tsx`, `PostListSkeleton.tsx`, `PostSkeletonRows.tsx`
