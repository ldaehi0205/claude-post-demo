# Project Rules

## 프로젝트 정보

- 시니어 풀스텍 엔지니어의 역할로 개발을 한다.
- 목적: 간단한 게시판
- 좌측에 "게시판" 로고를 배치하고 우측에 GNB(홈, 게시글 목록, 글쓰기 메뉴)와 그 우측 끝에 로그아웃/로그아웃 버튼을 포함하며 인증상태에 따라 동적으로 표시한다.
- 초기화면은 `/posts` 로 라우팅되지만 게시글 작성권한은 로그인 사용자만 로그인 가능하다. 인증된 사용자가 아닌 경우 게시글 작성 페이지 접근하려는 경우 `/login` 리다이렉트
- 게시글 수정은 작성자 본인만 가능, 삭제는 로그인된 모든 사용자가 삭제 가능

- 토큰 정책:
  - Access Token(JWT): 60분 만료
  - Refresh Token: HttpOnly · Secure Cookie에 저장, Idle timeout 14일(마지막 사용 기준), Absolute timeout 30일
  - Refresh Token Rotation: 매 refresh 시 새 Refresh Token을 Set-Cookie로 발급, 기존 토큰은 revoke 처리
  - Access 만료로 401 status:expired_token 발생 시에만 refresh를 호출해서 새 Access를 발급한다.
  - refresh 실패(401 status: expired_token) 시 클라이언트는 로그아웃 처리 및 로그인 페이지로 이동한다.

## AI 코드 생성 워크플로우

단, 변경 범위가 “사소한 변경(minor change)”에 해당하는 경우에는
3번(테스트 작성)과 5번(문서화)을 생략할 수 있다.
단계 중 하나라도 조건을 위반하면 작업은 실패로 간주한다.

[사소한 변경(minor change) 정의]

- 비즈니스 로직 변경이 없는 경우
- 외부 API 계약(요청/응답/에러 코드) 변경이 없는 경우
- 토큰/인증/보안 정책 변경이 없는 경우
- 동작 결과가 기존과 동일한 리팩터링, 네이밍 수정, 주석/문구 수정
- UI 표시 텍스트, 로그 메시지, 코드 포맷 수정

[개발 워크플로우]

1. 요구사항 / 성공 조건 / 변경 파일 계획을 먼저 제시한다.
   - 구현할 기능 요약
   - 완료 기준(Acceptance Criteria)
   - 수정 또는 추가될 파일 목록

2. 코드를 구현한다.

3. 최소 테스트 코드 1개 이상을 작성한다.
   - 비즈니스 로직 변경이 있는 경우, 반드시 e2e 테스트 코드를 추가한다.

4. 코드 작성 완료 후, 반드시 다음 체크리스트를 검증한다.
   - `.claude/skills/review-code/SKILL.md`의 체크리스트 기준으로 코드 검증

5. 문서화를 수행한다.
   - 추가·변경된 API 및 토큰 관련 사항은 `docs/API.md`에 작성한다.
   - 시스템 전반의 추가·변경 사항은 `CLAUDE.md` 파일에 작성 또는 수정한다.

6. 로컬 검증 커맨드와 기대 결과를 제공한다.
   - 예: test / build / lint / typecheck
   - 각 커맨드의 성공 기준을 명확히 기술한다.

7. 작업 결과를 정리한다.
   - 변경 요약
   - 남아 있는 리스크 및 엣지 케이스 체크리스트

## 기술 스택

- Next.js 14, TypeScript, Tailwind CSS
- App Router 사용
- API: Next.js API Routes
- ORM: Prisma
- DB: Supabase (PostgreSQL)
- API 통신: Axios, TanStack Query
- 인증: JWT (jsonwebtoken), bcrypt

## 폴더 구조

```
post-root/
├── prisma/
│   └── schema.prisma         # DB 스키마
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 루트 레이아웃
│   │   ├── page.tsx          # 홈
│   │   ├── globals.css       # 전역 스타일
│   │   ├── posts/
│   │   │   ├── page.tsx              # /posts (목록)
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # /posts/new (작성)
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # /posts/:id (상세)
│   │   │       └── edit/
│   │   │           └── page.tsx      # /posts/:id/edit (수정)
│   │   └── api/
│   │       └── posts/
│   │           ├── route.ts          # GET(목록), POST(작성)
│   │           └── [id]/
│   │               └── route.ts      # GET, PUT, DELETE
│   ├── components/
│   │   ├── ui/               # 공통 UI (Button, Input 등)
│   │   ├── layout/           # Header, Footer
│   │   └── posts/            # 게시판 컴포넌트
│   ├── hooks/                # TanStack Query 등 공통 훅
│   ├── apis/                 # Axios 호출 함수
│   ├── data/                 # DB 접근
│   ├── types/                # 타입 정의
│   └── utils/                # 유틸 함수
├── public/                   # 정적 파일 (이미지 등)
├── .env                      # 환경변수 (DB 연결)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 개발 규칙

아래 항목은 `.claude/skills/` 디렉토리의 스킬 문서를 참고:

- **파일 배치 규칙, 코드 규칙, 금지 사항**: `.claude/skills/review-code/SKILL.md`
- **컴포넌트 규칙**: `.claude/skills/create-component/SKILL.md`
- **API 명세, 인증 흐름, 토큰 정책**: `docs/API.md`

## 참고 문서

- API 개발 시 `docs/API.md` 명세서를 먼저 확인할 것
- 작업 수행 전 `.claude/skills/` 디렉토리의 관련 스킬 문서를 확인할 것
  - `create-component`: 컴포넌트 생성 규칙 및 템플릿
  - `fix-auth`: 인증 관련 디버깅 체크리스트
  - `review-code`: 코드 리뷰 체크리스트
  - `e2e-test`: E2E 테스트 시나리오
  - `db-migration`: Prisma 마이그레이션 절차

# 개발

## 초기 세팅 순서

```bash
npm install              # 의존성 설치
npm run dev              # 개발 서버 실행
```

## 자동 커밋 정책

AI가 작업 완료 후 자동으로 커밋을 수행한다.

- 변경 사항이 있을 때만 commit한다.
- commit message는 변경 요약을 한국어로 작성한다.
- 테스트/검증 단계가 실패하면 commit하지 않는다.
- minor change는 간단한 메시지로 커밋한다.
- push는 사용자가 명시적으로 요청할 때만 수행한다.
