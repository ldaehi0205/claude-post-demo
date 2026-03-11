---
date: 2026-03-12
status: idea
priority: medium
category: ux
feature_slug: tag-filter
---

# 태그 기반 게시글 필터링

## 문제 정의
태그 데이터 및 TagSidebar 컴포넌트가 존재하지만, 태그 클릭 시 실제 필터링이 동작하지 않는다.
사용자가 관심 있는 주제의 게시글만 탐색할 수단이 없다.

## 제안 솔루션
- TagSidebar의 태그 클릭 시 해당 태그로 게시글 필터링
- URL 쿼리 파라미터 연동 (`/posts?tag=javascript`) → 공유 가능
- 여러 태그 동시 선택 지원 (AND 또는 OR 방식)
- 선택된 태그 시각적 강조 (active 상태)
- 태그 제거 버튼으로 필터 해제

## 기대 효과
- 주제별 콘텐츠 탐색 경험 향상
- 태그 시스템의 실질적 활용도 증가
- 검색 기능과 결합 시 강력한 탐색 수단

## 개발 난이도
🟢 쉬움

## 우선순위 점수
7점

## 구현 힌트
- `GET /api/posts?tag=javascript` 쿼리 파라미터 지원
- Prisma: `where: { postTags: { some: { tag: { name: tagName } } } }`
- `useSearchParams` + `useRouter`로 URL 동기화
- TagSidebar에서 선택 상태 관리, 선택된 태그 활성 스타일

## 디자인 요구사항 (design-agent 전달용)
- 관련 페이지/컴포넌트: `src/app/posts/_components/TagSidebar.tsx`, `PostList.tsx`
- 예상 UI 변경 범위:
  - TagSidebar의 태그 클릭 시 활성(active) 스타일 변경 (배경색, 체크 아이콘)
  - 선택된 태그 표시 영역: 목록 상단에 "필터: #javascript ✕" 뱃지 형태
  - 전체 해제 버튼 ("전체 보기")
- 참고할 기존 컴포넌트: `TagSidebar.tsx`, `PostList.tsx`
