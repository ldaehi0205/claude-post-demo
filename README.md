## 프로젝트 소개

해당 프로젝트는 Claude AI를 활용하여 간단한 게시판 자동화 코드 생성을 위한 워크플로우를 설계하고 검증하는 리포지토리입니다.

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

| 명령어          | 설명               |
| --------------- | ------------------ |
| `npm run dev`   | 개발 서버 실행     |
| `npm run build` | 프로덕션 빌드      |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint`  | ESLint 검사        |

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
| **filesystem** | `@modelcontextprotocol/server-filesystem` | 파일 시스템 접근             |
| **context7**   | `@upstash/context7-mcp`                   | 라이브러리 문서 검색         |
| **figma**      | `figma-developer-mcp`                     | Figma 디자인 파일 연동       |
| **linear**     | `@tacticlaunch/mcp-linear`                | Linear 이슈 관리 연동        |
| **n8n**        | `n8n-mcp`                                 | n8n 워크플로우 노드 문서접근 |

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
