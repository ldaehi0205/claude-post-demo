## 프로젝트 소개

해당 프로젝트는 Claude AI를 활용하여 간단한 게시판 자동화 코드 생성을 위한 워크플로우를 설계하고 검증하는 리포지토리입니다.

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
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-jwt-secret-key"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
LINEAR_API_KEY="your-linear-api-key"
FIGMA_ACCESS_TOKEN="your-figma-access-token"
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

이 프로젝트는 n8n webhook을 통해 외부 서비스와 연동됩니다.

### 새 게시글 Slack 알림

게시글 작성 시 n8n webhook을 호출하여 Slack으로 알림을 전송합니다.

```
[게시글 작성] → [Server Action] → [notifyNewPost()] → [n8n Webhook] → [Slack]
```

### 환경 변수 설정

```env
# n8n Webhook URL (Production URL 사용)
N8N_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/xxx"

# 게시글 링크 생성용 기본 URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### n8n 워크플로우 설정

1. [n8n.io](https://n8n.io)에서 새 워크플로우 생성
2. **Webhook 노드** 추가 (HTTP Method: POST)
3. **Slack 노드** 추가 및 연결
4. 워크플로우 **Active** 토글 활성화
5. **Production URL** 복사하여 `.env`에 설정

> ⚠️ **주의**: Test URL(`/webhook-test/`)이 아닌 Production URL(`/webhook/`)을 사용해야 합니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/utils/n8n.ts` | n8n webhook 호출 유틸 함수 |
| `src/app/actions/posts.ts` | 게시글 Server Action (webhook 호출) |
| `.claude/skills/n8n-webhook/SKILL.md` | 디버깅 가이드 |
