---
date: 2026-03-12
status: idea
priority: high
category: ux
feature_slug: auto-save-draft
---

# 게시글 작성 자동저장 (임시저장)

## 문제 정의
게시글 작성 중 브라우저 종료, 실수로 뒤로가기 등의 상황에서 작성 내용이 전부 사라진다.
작성에 시간을 투자한 사용자에게 치명적인 UX 손실이며, 글쓰기 이탈률 증가의 주요 원인이다.

## 제안 솔루션
- 작성 중 30초마다 `localStorage`에 제목 + 내용 + 태그를 자동저장
- 게시글 작성 페이지 재진입 시 임시저장 데이터 감지 → 복원 여부 모달 표시
- 게시글 제출(발행) 또는 명시적 "임시저장 삭제" 시 localStorage 데이터 제거
- 저장 상태 표시: 우측 상단에 "자동저장됨 00:00" 텍스트 표시

## 기대 효과
- 글쓰기 이탈률 감소
- 사용자 신뢰도 및 서비스 안정감 향상
- 장문 글 작성 사용자 유지

## 개발 난이도
🟢 쉬움

## 우선순위 점수
9점

## 구현 힌트
- `useEffect` + `debounce(500ms)` + `localStorage.setItem('post-draft', JSON.stringify({title, content, tags}))`
- PostForm 컴포넌트(`src/app/posts/_components/PostForm.tsx`)에 통합
- 복원 모달: shadcn Dialog or 간단한 confirm UI
- 제출 시 `localStorage.removeItem('post-draft')` 호출

## 디자인 요구사항 (design-agent 전달용)
- 관련 페이지/컴포넌트: `src/app/posts/new/page.tsx`, `PostForm.tsx`
- 예상 UI 변경 범위:
  - PostForm 우측 상단에 "자동저장됨 HH:MM" 상태 텍스트 추가
  - 페이지 진입 시 복원 여부 모달 (제목/내용 미리보기 포함)
  - 하단 버튼 영역에 "임시저장 삭제" 버튼 옵션
- 참고할 기존 컴포넌트: `PostForm.tsx`, `Button.tsx`
