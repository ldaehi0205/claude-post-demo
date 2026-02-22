# Project Rules

## 프로젝트 정보

- 시니어 풀스텍 엔지니어의 역할로 개발을 한다.
- 목적: 간단한 게시판
- 좌측에 "게시판" 로고를 배치하고 우측에 GNB(홈, 게시글 목록, 글쓰기 메뉴)와 그 우측 끝에 로그아웃/로그아웃 버튼을 포함하며 인증상태에 따라 동적으로 표시한다.
- 초기화면은 `/posts` 로 라우팅되지만 게시글 작성권한은 로그인 사용자만 로그인 가능하다. 인증된 사용자가 아닌 경우 게시글 작성 페이지 접근하려는 경우 `/login` 리다이렉트
- 게시글 수정은 작성자 본인만 가능, 삭제는 로그인된 모든 사용자가 삭제 가능
- 토큰 정책 및 권한 규칙 → `.claude/skills/fix-auth/SKILL.md`

## 기술 스택

- Next.js 14, TypeScript, Tailwind CSS
- App Router 사용
- API: Next.js API Routes
- ORM: Prisma
- DB: Supabase (PostgreSQL)
- API 통신: Axios, TanStack Query
- 인증: JWT (jsonwebtoken), bcrypt
- 자동화: n8n (외부 워크플로우 연동)

## AI 코드 생성 워크플로우

Kent Beck의 TDD(Red-Green-Refactor)와 Tidy First 원칙을 따른다.

**다음 작업 시 `.claude/skills/tdd-workflow/SKILL.md` 규칙을 반드시 따른다:**
- 신규 기능 추가 (feat)
- 기존 기능 수정 (feat)
- 버그 수정 (fix)

[개발 단계 요약]

1. 요구사항 / 성공 조건 / 변경 파일 계획 제시
2. TDD 사이클 (Red → Green → Refactor) 반복 - 유닛/통합 테스트 (E2E는 별도)
3. `.claude/skills/review-code/SKILL.md` 체크리스트로 코드 검증
4. Tidy First: 구조적 변경(refactor)과 행위적 변경(feat/fix)을 별도 커밋으로 분리
5. 문서화: API → `docs/API.md`, 시스템 → `CLAUDE.md`
6. 로컬 검증 커맨드 제공 + 작업 결과 정리

사소한 변경(비즈니스 로직/API/보안 변경 없음)은 TDD 사이클과 문서화를 생략 가능.

## 폴더 구조

```
post-root/
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   ├── posts/ (page.tsx, new/page.tsx, [id]/page.tsx, [id]/edit/page.tsx)
│   │   └── api/posts/ (route.ts, [id]/route.ts)
│   ├── components/ (ui/, layout/, posts/)
│   ├── hooks/, apis/, data/, types/, utils/
├── public/, .env, tailwind.config.ts, tsconfig.json, package.json
```

## 개발 규칙

아래 항목은 `.claude/skills/` 디렉토리의 스킬 문서를 참고:

- **TDD & Tidy First 상세 규칙**: `.claude/skills/tdd-workflow/SKILL.md`
- **파일 배치 규칙, 코드 규칙, 금지 사항**: `.claude/skills/review-code/SKILL.md`
- **토큰 정책, 권한 규칙, 인증 디버깅**: `.claude/skills/fix-auth/SKILL.md`
- **컴포넌트 규칙**: `.claude/skills/create-component/SKILL.md`
- **API 명세, 인증 흐름**: `docs/API.md`
- **n8n 연동 상세 (webhook, payload, 설정)**: `docs/n8n.md`
- **n8n Slack 알림 디버깅**: `.claude/skills/n8n-slack-notify/SKILL.md`
- **n8n AI 자동요약 디버깅**: `.claude/skills/n8n-ai-summary/SKILL.md`
- **캐시 관리, ESM 모듈, 트러블슈팅**: `docs/troubleshooting.md`

### 주의: Server Action vs API Route

Next.js App Router에서는 동일한 기능이 **두 곳**에서 구현될 수 있음:

| 위치          | 파일                     | 로그 확인             |
| ------------- | ------------------------ | --------------------- |
| Server Action | `src/app/actions/*.ts`   | `POST /posts/new 303` |
| API Route     | `src/app/api/*/route.ts` | `POST /api/posts 201` |

**새로운 기능 추가 시 실제로 사용되는 코드 경로를 먼저 확인할 것!**

# 개발

## 초기 세팅

```bash
npm install && npm run dev
```

## 자동 커밋 정책

- 변경 사항이 있을 때만 commit, 모든 테스트 통과 시에만 commit
- push는 사용자가 명시적으로 요청할 때만 수행
- **Tidy First**: 구조적 변경(`refactor`)과 행위적 변경(`feat`/`fix`)은 별도 커밋으로 분리
- 커밋 메시지는 **한국어**로 작성: `<타입>: <제목>` + 본문(변경 사항 목록) + 영향 범위
- 타입: feat, fix, refactor, style, docs, test, chore

## 캐시 관리 (중요)

설정 변경/패키지 변경/원인 불명 오류 시 반드시 캐시 삭제: `rm -rf .next node_modules/.cache`
상세 가이드 → `docs/troubleshooting.md`
