# Project Rules

## 프로젝트 정보

- 목적: 간단한 게시판
- 인증/인가: 없음
- 좌측에 "게시판" 로고를 배치하고 우측에 GNB(홈, 게시글 목록, 글쓰기 메뉴)와 그 우측 끝에 로그아웃 버튼을 포함한다.

## 기술 스택

- Next.js 14, TypeScript, Tailwind CSS
- App Router 사용
- API: Next.js API Routes
- ORM: Prisma
- DB: MySQL
- API 통신: Axios, TanStack Query

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

## API 엔드포인트

| Method | URL            | 설명      |
| ------ | -------------- | --------- |
| GET    | /api/posts     | 목록 조회 |
| POST   | /api/posts     | 작성      |
| GET    | /api/posts/:id | 상세 조회 |
| PUT    | /api/posts/:id | 수정      |
| DELETE | /api/posts/:id | 삭제      |

## 컴포넌트 규칙

- 서버 컴포넌트: 기본 (DB 조회 등)
- 클라이언트 컴포넌트: useState, onClick 등 필요할 때만 "use client"

## 금지 사항

- 컴포넌트에서 Prisma 직접 호출 금지 (API 통해서만)
- `components/ui/`에 비즈니스 로직 금지
- `any` 타입 사용 금지

## Docker 설정

- MySQL은 Docker Compose로 실행
- 설정 파일: `docker-compose.yml`
- 환경변수: `.env` (DATABASE_URL)

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: post_demo
    ports:
      - '3306:3306'
```

## 명령어

```bash
# Docker
docker compose up -d     # MySQL 컨테이너 실행
docker compose down      # 컨테이너 중지
docker compose logs -f   # 로그 확인

# 개발
npm run dev              # 개발 서버 (localhost:3000)
npx prisma migrate dev   # DB 마이그레이션
npx prisma studio        # DB GUI (localhost:5555)
```

## 초기 세팅 순서

```bash
npm install              # 의존성 설치
docker compose up -d     # MySQL 실행
npx prisma migrate dev   # DB 마이그레이션
npm run dev              # 개발 서버 실행
```
