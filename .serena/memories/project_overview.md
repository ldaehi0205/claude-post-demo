# Project Overview: post-demo

## Purpose
간단한 게시판 (Bulletin Board) 애플리케이션

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: Supabase (PostgreSQL)
- **API Communication**: Axios, TanStack Query
- **Authentication**: JWT (jsonwebtoken), bcrypt (access + refresh token)
- **Testing**: Jest (unit/integration), Playwright (E2E)
- **Automation**: n8n (외부 워크플로우 연동 - Slack 알림, AI 요약)
- **AI**: Anthropic SDK, react-markdown

## Database Models
- **User**: id, userID, password, name, posts, refreshTokens, comments
- **Post**: id, title, content, summary, imageUrl, viewCount, tags, comments, author
- **Tag**: id, name (many-to-many with Post via PostTag)
- **Comment**: id, content, post, author
- **RefreshToken**: id, token, userId, expiresAt, lastSeenAt, revoked

## Key Features
- 게시글 CRUD (작성은 로그인 사용자만, 수정은 작성자만, 삭제는 로그인된 모든 사용자)
- 댓글 기능
- 태그 시스템
- 이미지 업로드
- AI 자동요약 (n8n + OpenAI)
- Slack 새 게시글 알림 (n8n webhook)
- JWT 인증 (access token + refresh token)
