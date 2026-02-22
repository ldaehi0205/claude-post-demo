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

Kent Beck의 TDD(Test-Driven Development)와 Tidy First 원칙을 따른다.

단, 변경 범위가 "사소한 변경(minor change)"에 해당하는 경우에는
2~4번(TDD 사이클)과 7번(문서화)을 생략할 수 있다.
단계 중 하나라도 조건을 위반하면 작업은 실패로 간주한다.

[사소한 변경(minor change) 정의]

- 비즈니스 로직 변경이 없는 경우
- 외부 API 계약(요청/응답/에러 코드) 변경이 없는 경우
- 토큰/인증/보안 정책 변경이 없는 경우
- 동작 결과가 기존과 동일한 리팩터링, 네이밍 수정, 주석/문구 수정
- UI 표시 텍스트, 로그 메시지, 코드 포맷 수정

[개발 워크플로우]

1. 요구사항 / 성공 조건 / 변경 파일 계획을 먼저 제시한다.
2. 실패하는 테스트를 작성한다. (Red) - 테스트 도구: Playwright (E2E)
3. 테스트를 통과하는 최소한의 코드를 구현한다. (Green)
4. 리팩터링한다. (Refactor) - 2~4 단계를 기능 완성까지 반복
5. `.claude/skills/review-code/SKILL.md` 체크리스트로 코드 검증
6. Tidy First: 구조적 변경(refactor)과 행위적 변경(feat/fix)을 별도 커밋으로 분리
7. 문서화: API → `docs/API.md`, 시스템 → `CLAUDE.md`, 체크리스트 → `.claude/skills/review-code/SKILL.md`
8. 로컬 검증 커맨드와 기대 결과 제공
9. 작업 결과 정리 (변경 요약 + 리스크/엣지 케이스)

[버그 수정 시 TDD 절차]

1. 버그를 재현하는 실패 테스트를 먼저 작성한다.
2. 테스트가 통과하도록 최소한의 수정을 한다.
3. 리팩터링 후 모든 테스트가 통과하는지 확인한다.

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

- **파일 배치 규칙, 코드 규칙, 금지 사항**: `.claude/skills/review-code/SKILL.md`
- **컴포넌트 규칙**: `.claude/skills/create-component/SKILL.md`
- **API 명세, 인증 흐름, 토큰 정책**: `docs/API.md`
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
