# Code Style & Conventions

## General
- **Language**: TypeScript (strict)
- **Components**: 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)
- **Framework**: Next.js 14 App Router

## File Structure
```
src/
├── app/              # 페이지 & API 라우트
│   ├── posts/        # 게시글 페이지
│   │   └── _components/  # 페이지별 컴포넌트
│   ├── actions/      # Server Actions
│   └── api/          # API Routes
├── components/       # 공통 컴포넌트
│   ├── ui/           # Button, Input, Textarea 등
│   └── layout/       # Header 등
├── hooks/            # 커스텀 훅
├── apis/             # API 통신 함수
├── types/            # 타입 정의
├── utils/            # 유틸리티 함수
├── lib/              # 외부 라이브러리 래퍼
├── data/             # 데이터 관련
└── __tests__/        # 테스트 파일
```

## Naming Conventions
- 컴포넌트 파일: PascalCase (e.g., `PostCard.tsx`)
- 유틸/훅 파일: camelCase (e.g., `useAuth.ts`)
- API 라우트: `route.ts`
- 테스트 파일: `*.test.ts` (in `__tests__/` directory)

## Testing
- Jest (ts-jest preset, node environment)
- 테스트 위치: `src/__tests__/**/*.test.ts`
- Path alias: `@/` → `src/`
- E2E: Playwright (`e2e/` directory)

## Git Commit Convention
- 커밋 메시지: **한국어**로 작성
- 형식: `<타입>: <제목>`
- 타입: feat, fix, refactor, style, docs, test, chore
- **Tidy First**: 구조적 변경(refactor)과 행위적 변경(feat/fix)은 별도 커밋으로 분리

## Important Notes
- Server Action vs API Route: 동일 기능이 두 곳에 있을 수 있음 → 실제 사용 경로 먼저 확인
- TDD (Red-Green-Refactor) 워크플로우 준수
- push는 사용자가 명시적으로 요청할 때만
