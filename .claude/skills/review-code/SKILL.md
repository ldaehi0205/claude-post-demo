---
name: review-code
description: TypeScript와 Tailwind CSS 코드의 품질, 타입 안정성, 성능을 검토합니다. 게시판 프로젝트 규칙 준수를 확인합니다.
---

# 코드 리뷰 체크리스트

## TypeScript 규칙

- [ ] `any` 타입 사용 금지
- [ ] Props 인터페이스 정의
- [ ] 함수 반환 타입 명시 (필요시)
- [ ] null/undefined 처리

## React/Next.js 규칙

- [ ] 함수형 컴포넌트만 사용
- [ ] `'use client'` 최소한으로 사용
- [ ] 서버 컴포넌트 우선
- [ ] useState, useEffect 적절히 사용
- [ ] 불필요한 리렌더링 방지

## 프로젝트 구조 규칙

| 파일 종류 | 위치 |
|-----------|------|
| 페이지 | `src/app/` |
| API | `src/app/api/` |
| UI 컴포넌트 | `src/components/ui/` |
| 레이아웃 | `src/components/layout/` |
| 게시판 | `src/components/posts/` |
| API 호출 | `src/apis/` |
| 훅 | `src/hooks/` |
| DB 접근 | `src/data/prisma.ts` 통해서만 |

## 금지 사항

- [ ] 컴포넌트에서 Prisma 직접 호출
- [ ] `components/ui/`에 비즈니스 로직
- [ ] `any` 타입 사용

## 보안

- [ ] 사용자 입력 검증
- [ ] SQL Injection 방지 (Prisma 사용)
- [ ] XSS 방지
- [ ] 인증 필요 API에 토큰 검증

## 성능

- [ ] 불필요한 API 호출 제거
- [ ] TanStack Query 캐싱 활용
- [ ] 이미지 최적화 (next/image)
- [ ] 번들 크기 최적화

## 스타일링

- [ ] Tailwind CSS 일관성
- [ ] 반응형 디자인
- [ ] 접근성 (aria 속성 등)
