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

- 시스템에 대한 추가,변경 사항은 CLAUDE.md 파일에 작성/수정한다.
- 비즈니스 로직 변경은 e2e 테스트코드에 추가한다.
- 추가,변경된 API 및 토큰정보는 `docs/API.md`에 작성한다.

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

## 파일 배치 규칙

- 페이지: `app/` 폴더
- API 엔드포인트: `app/api/` 폴더
- 공통 레이아웃 컴포넌트: `components/layout/`
- 공통 UI: `components/ui/`
- 게시판 컴포넌트: `components/posts/`
- API 호출 함수: `apis/`
- 커스텀 훅: `hooks/`
- DB 접근: `data/prisma.ts` 통해서만
- 유틸 함수: `utils/`

### 인증 API

| Method | URL                | 설명              | 인증 필요  |
| ------ | ------------------ | ----------------- | ---------- |
| POST   | /api/auth/register | 회원가입          | X          |
| POST   | /api/auth/login    | 로그인 (JWT 발급) | X          |
| POST   | /api/auth/refresh  | Access Token 갱신 | X (cookie) |
| GET    | /api/auth/me       | 현재 사용자 정보  | O          |

## API 엔드포인트

| Method | URL            | 설명      |
| ------ | -------------- | --------- |
| GET    | /api/posts     | 목록 조회 |
| POST   | /api/posts     | 작성      |
| GET    | /api/posts/:id | 상세 조회 |
| PUT    | /api/posts/:id | 수정      |
| DELETE | /api/posts/:id | 삭제      |

## 인증 흐름

1. **회원가입**: 비밀번호를 bcrypt로 해싱하여 DB 저장
2. **로그인**: 이메일/비밀번호 확인 후 JWT 토큰 발급
3. **토큰 저장**: 클라이언트는 localStorage에 토큰 저장 (key:`accessToken`)
4. **API 요청**: Axios interceptor가 모든 요청에 `Authorization: Bearer {token}` 헤더 자동 추가
5. **토큰 검증**: 서버는 미들웨어에서 JWT 검증 후 요청 처리
6. **로그아웃**: localStorage에서 토큰 삭제

## 컴포넌트 규칙

- 서버 컴포넌트: 기본 (DB 조회 등)
- 클라이언트 컴포넌트: useState, onClick 등 필요할 때만 "use client"
- 인증 상태는 useAuth 훅으로 관리

# 코드 규칙

- API 응답이 HTTP 200이 아닐 경우, Axios interceptor에서 일괄적으로 에러를 처리해 서버 응답 메시지를 alert로 사용자에게 표시한다.

## 금지 사항

- 컴포넌트에서 Prisma 직접 호출 금지 (API 통해서만)
- `components/ui/`에 비즈니스 로직 금지
- `any` 타입 사용 금지

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
