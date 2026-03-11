## 프로젝트 소개

해당 프로젝트는 Claude AI를 활용하여 간단한 게시판 자동화 코드 생성을 위한 워크플로우를 설계하고 검증하는 리포지토리입니다.

## 배포

**[https://claude-post-demo.vercel.app/posts](https://claude-post-demo.vercel.app/posts)**

## 개발 워크플로우

### 워크플로우 1: Linear 이슈 기반 개발

```
Linear 이슈 확인 → 브랜치 생성 → TDD 구현 → PR → 리뷰 반영
```

| 단계 | 도구 | 설명 |
|------|------|------|
| 이슈 확인 | Linear MCP | 작업할 이슈 조회 및 In Progress 전환 |
| 브랜치 생성 | git | `<type>/LDH-<번호>-<설명>` 형식 |
| TDD 구현 | `/tdd-workflow` | Red → Green → Refactor 사이클 |
| PR 생성 | GitHub | main 브랜치로 PR |
| 리뷰 반영 | Linear MCP | 리뷰 코멘트 반영 후 이슈 Done |

상세 규칙: `.claude/skills/linear-workflow/SKILL.md`, `.claude/skills/tdd-workflow/SKILL.md`

---

### 워크플로우 2: AI Agent 파이프라인

```
product-strategist → design-agent → dev-design-agent → tdd-workflow
```

| 에이전트 | 역할 | 산출물 |
|---------|------|--------|
| `product-strategist` | 현재 서비스 분석 → 고도화 아이디어 도출 | `docs/ideas/YYYY-MM-DD-<slug>.md` |
| `design-agent` | 아이디어 기반 UI/UX 설계 | `docs/design/<slug>.md` |
| `dev-design-agent` | UI 설계 기반 기술 구현 계획 (API, DB, 테스트) | `docs/dev-design/<slug>.md` |
| `tdd-workflow` | 구현 계획 기반 TDD 개발 | 코드 + 테스트 |

각 에이전트는 이전 단계 산출물을 입력으로 받아 다음 단계로 이어집니다.

---

## Claude AI 개발

이 프로젝트는 Claude Code를 활용한 AI 기반 개발을 지원합니다.

- **AI 코드 생성 워크플로우**: `CLAUDE.md` 참고
- **스킬 문서**: `.claude/skills/` 디렉토리

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **API 통신**: Axios, TanStack Query
- **인증**: JWT (jsonwebtoken), bcrypt

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. DB 마이그레이션
npx prisma migrate dev

# 3. 개발 서버 실행
npm run dev
```

## 스크립트

| 명령어             | 설명               |
| ------------------ | ------------------ |
| `npm run dev`      | 개발 서버 실행     |
| `npm run build`    | 프로덕션 빌드      |
| `npm run start`    | 프로덕션 서버 실행 |
| `npm run lint`     | ESLint 검사        |
| `npm run test`     | 유닛 테스트        |
| `npm run test:e2e` | E2E 테스트         |

## 환경 변수

`.env` 파일을 생성하고 아래 내용을 설정하세요:

```env
# 인증
JWT_SECRET="your-jwt-secret-key"

# Supabase DB (Connection Pooling - 일반 쿼리용)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase DB (Direct - 마이그레이션용)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# n8n 자동화
N8N_WEBHOOK_URL=""              # Slack 새 게시글 알림 webhook URL
N8N_SUMMARY_WEBHOOK_URL=""      # AI 자동요약 webhook URL
N8N_CALLBACK_SECRET=""          # AI 요약 콜백 인증 시크릿
NEXT_PUBLIC_BASE_URL=""         # 사이트 기본 URL (로컬: ngrok URL / 배포: 실제 도메인)

# 외부 도구 (선택)
LINEAR_API_KEY="your-linear-api-key"
FIGMA_ACCESS_TOKEN="your-figma-access-token"
ANTHROPIC_API_KEY="your-anthropic-api-key"
GH_TOKEN="your-github-personal-access-token"
```

## MCP

이 프로젝트는 Claude Code와 연동되는 MCP 서버들을 사용합니다. `.mcp.json`에 설정되어 있습니다.

| MCP 서버       | 패키지                                    | 용도                         |
| -------------- | ----------------------------------------- | ---------------------------- |
| **playwright** | `@anthropic-ai/mcp-server-playwright`     | 브라우저 E2E 테스트 자동화   |
| **git**        | `@modelcontextprotocol/server-git`        | Git 저장소 조작              |
| **context7**   | `@upstash/context7-mcp`                   | 라이브러리 문서 검색         |
| **linear**     | `@tacticlaunch/mcp-linear`                | Linear 이슈 관리 연동        |
| **figma**      | `figma-developer-mcp`                     | Figma 디자인 파일 연동       |
| **n8n**        | `n8n-mcp`                                 | n8n 워크플로우 노드 문서접근 |
| **serena**     | `serena` (uvx)                            | 코드 심볼 분석/편집          |

## n8n 자동화

n8n webhook을 통해 두 가지 자동화 기능을 제공합니다.

### 1. Slack 새 게시글 알림

게시글 작성 시 n8n webhook → Slack 채널로 알림을 전송합니다.

```
[게시글 작성] → [Server Action] → [notifyNewPost()] → [n8n Webhook] → [Slack]
```

- webhook 호출 실패 시에도 게시글 작성은 정상 동작 (비동기)
- `N8N_WEBHOOK_URL` 미설정 시 알림 스킵
- 상세 설정: `.claude/skills/n8n-slack-notify/SKILL.md`

### 2. AI 게시글 자동요약

게시글 첫 조회 시 n8n webhook → OpenAI로 요약을 생성하고, 콜백 API로 DB에 저장합니다.

```
[게시글 조회] → [GET /api/posts/:id/summary]
                  → summary가 null이면 n8n webhook 호출 (비동기)
                  → n8n: OpenAI 요약 생성
                  → PATCH /api/posts/:id/summary 콜백으로 DB 저장
                  → 클라이언트 5초 폴링으로 요약 수신
```

- **Lazy Evaluation**: 작성 시가 아닌 첫 조회 시 요약 생성
- **API 분리**: 게시글 조회(`/api/posts/:id`)와 요약 폴링(`/api/posts/:id/summary`)을 분리하여 조회수 증가 방지
- 게시글 수정 시 기존 요약을 초기화하고 다음 조회 시 자동 재생성
- `N8N_SUMMARY_WEBHOOK_URL` 미설정 시 요약 생성 스킵
- 상세 설정: `.claude/skills/n8n-ai-summary/SKILL.md`
