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
   - 구현할 기능 요약
   - 완료 기준(Acceptance Criteria)
   - 수정 또는 추가될 파일 목록

2. 실패하는 테스트를 작성한다. (Red)
   - 구현 전에 테스트를 먼저 작성한다.
   - 테스트 이름은 행위를 설명한다. (예: `shouldReturnPostWhenValidId`)
   - 비즈니스 로직 변경이 있는 경우, 반드시 E2E 테스트도 추가한다.
   - 테스트 도구: Playwright (E2E)

3. 테스트를 통과하는 최소한의 코드를 구현한다. (Green)
   - 테스트를 통과하기 위한 최소한의 코드만 작성한다.
   - 과도한 추상화나 미래 대비 코드를 작성하지 않는다.

4. 리팩터링한다. (Refactor)
   - 테스트가 통과하는 상태에서만 리팩터링을 수행한다.
   - 중복 제거, 네이밍 개선, 구조 정리 등을 수행한다.
   - 리팩터링 후 모든 테스트가 통과하는지 확인한다.

   > 2~4 단계를 기능이 완성될 때까지 반복한다.

5. 코드 작성 완료 후, 반드시 다음 체크리스트를 검증한다.
   - `.claude/skills/review-code/SKILL.md`의 체크리스트 기준으로 코드 검증

6. Tidy First: 구조적 변경과 행위적 변경을 분리한다.
   - **구조적 변경** (refactor): 동작 변경 없이 코드 구조만 개선 (이름 변경, 메서드 추출 등)
   - **행위적 변경** (feat/fix): 실제 기능 추가나 버그 수정
   - 구조적 변경이 필요하면 행위적 변경 전에 먼저 수행한다.
   - 두 종류의 변경을 같은 커밋에 섞지 않는다.

7. 문서화를 수행한다.
   - 추가·변경된 API 및 토큰 관련 사항은 `docs/API.md`에 작성한다.
   - 시스템 전반의 추가·변경 사항은 `CLAUDE.md` 파일에 작성 또는 수정한다.

8. 로컬 검증 커맨드와 기대 결과를 제공한다.
   - 예: test / build / lint / typecheck
   - 각 커맨드의 성공 기준을 명확히 기술한다.

9. 작업 결과를 정리한다.
   - 변경 요약
   - 남아 있는 리스크 및 엣지 케이스 체크리스트

[버그 수정 시 TDD 절차]

1. 버그를 재현하는 실패 테스트를 먼저 작성한다.
2. 테스트가 통과하도록 최소한의 수정을 한다.
3. 리팩터링 후 모든 테스트가 통과하는지 확인한다.

## 기술 스택

- Next.js 14, TypeScript, Tailwind CSS
- App Router 사용
- API: Next.js API Routes
- ORM: Prisma
- DB: Supabase (PostgreSQL)
- API 통신: Axios, TanStack Query
- 인증: JWT (jsonwebtoken), bcrypt
- 자동화: n8n (외부 워크플로우 연동)

## n8n 자동화 연동

### 새 게시글 알림

게시글 작성 시 n8n webhook을 호출하여 Slack 등 외부 서비스로 알림을 전송합니다.

**환경 변수:**
```bash
N8N_WEBHOOK_URL=""           # n8n Webhook URL
NEXT_PUBLIC_BASE_URL=""      # 사이트 기본 URL (게시글 링크 생성용)
```

**n8n 워크플로우 설정:**

1. n8n에서 새 워크플로우 생성
2. `Webhook` 노드 추가 (POST 메서드)
3. `Slack` 노드 추가하여 알림 전송
4. Webhook URL을 `.env`의 `N8N_WEBHOOK_URL`에 설정

**Webhook Payload 형식:**
```json
{
  "event": "new_post",
  "post": {
    "id": 1,
    "title": "게시글 제목",
    "author": "작성자 이름",
    "authorId": "user123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "url": "https://your-domain.com/posts/1"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Slack 메시지 템플릿 예시:**
```
📝 새 게시글이 등록되었습니다!

*제목:* {{ $json.post.title }}
*작성자:* {{ $json.post.author }}
*링크:* {{ $json.post.url }}
```

**참고:**
- webhook 호출 실패 시에도 게시글 작성은 정상 동작 (비동기 처리)
- `N8N_WEBHOOK_URL`이 설정되지 않으면 알림 스킵

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
- **n8n webhook 연동, Slack 알림 디버깅**: `.claude/skills/n8n-webhook/SKILL.md`

### 주의: Server Action vs API Route

Next.js App Router에서는 동일한 기능이 **두 곳**에서 구현될 수 있음:

| 위치 | 파일 | 로그 확인 |
|------|------|-----------|
| Server Action | `src/app/actions/*.ts` | `POST /posts/new 303` |
| API Route | `src/app/api/*/route.ts` | `POST /api/posts 201` |

**새로운 기능 추가 시 실제로 사용되는 코드 경로를 먼저 확인할 것!**

## 참고 문서

- API 개발 시 `docs/API.md` 명세서를 먼저 확인할 것
- 작업 수행 전 `.claude/skills/` 디렉토리의 관련 스킬 문서를 확인할 것
  - `create-component`: 컴포넌트 생성 규칙 및 템플릿
  - `fix-auth`: 인증 관련 디버깅 체크리스트
  - `review-code`: 코드 리뷰 체크리스트
  - `e2e-test`: E2E 테스트 시나리오
  - `db-migration`: Prisma 마이그레이션 절차
  - `n8n-webhook`: n8n webhook 연동 및 Slack 알림 디버깅

# 개발

## 초기 세팅 순서

```bash
npm install              # 의존성 설치
npm run dev              # 개발 서버 실행
```

## 자동 커밋 정책

AI가 작업 완료 후 자동으로 커밋을 수행한다.

- 변경 사항이 있을 때만 commit한다.
- 모든 테스트가 통과할 때만 commit한다.
- push는 사용자가 명시적으로 요청할 때만 수행한다.
- **Tidy First**: 구조적 변경(`refactor`)과 행위적 변경(`feat`/`fix`)은 별도 커밋으로 분리한다.

### 커밋 메시지 작성 규칙

**커밋 메시지는 한국어로 자세하게 작성한다.**

```
<타입>: <제목> (간결한 요약)

<본문>
- 변경 사항 1
- 변경 사항 2
- 변경 사항 3

<영향 범위> (선택)
- 영향받는 파일/기능 목록
```

**타입 종류:**
| 타입 | 설명 |
|------|------|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| refactor | 코드 리팩토링 (기능 변경 없음) |
| style | 코드 포맷팅, 세미콜론 누락 등 |
| docs | 문서 수정 |
| test | 테스트 코드 추가/수정 |
| chore | 빌드 설정, 패키지 매니저 설정 등 |

**예시:**
```
feat: 게시글 이미지 업로드 기능 추가

- MarkdownEditor에 이미지 업로드 버튼 추가
- Supabase Storage 연동으로 이미지 저장
- 드래그앤드롭, 붙여넣기 지원
- 업로드 후 마크다운 이미지 문법으로 자동 삽입

영향 범위:
- src/components/ui/MarkdownEditor.tsx
- src/app/actions/upload.ts
- src/lib/supabase.ts
```

## 캐시 관리 (중요)

Next.js의 `.next` 캐시와 `node_modules/.cache`는 설정 변경 시 오래된 모듈 정보를 유지하여 런타임 오류를 발생시킬 수 있다.

### 캐시 삭제가 필요한 경우

다음 상황에서는 **반드시** 캐시를 삭제한다:

1. `next.config.js` 설정 변경 시
2. ESM 모듈 관련 설정 변경 시 (`transpilePackages`, `serverComponentsExternalPackages`)
3. dynamic import 패턴 변경 시
4. webpack 관련 설정 변경 시
5. 패키지 추가/삭제/버전 변경 시
6. 원인 불명의 런타임 오류 발생 시

### 캐시 삭제 명령어

```bash
# 기본 캐시 삭제
rm -rf .next

# 전체 캐시 삭제 (권장)
rm -rf .next node_modules/.cache

# 캐시 삭제 후 재시작
rm -rf .next node_modules/.cache && npm run dev
```

### 주요 오류와 해결법

| 오류 메시지 | 원인 | 해결 |
|------------|------|------|
| `missing required error components` | error.tsx/global-error.tsx 누락 또는 캐시 | 파일 생성 + 캐시 삭제 |
| `__webpack_modules__[moduleId] is not a function` | transpilePackages 설정 충돌 | `serverComponentsExternalPackages` 사용 + 캐시 삭제 |
| `Loading chunk failed (undefined)` | dynamic import 경로 해석 실패 | default export 사용 + 캐시 삭제 |
| `Cannot read properties of null (reading 'useContext')` | React context 초기화 실패 | 캐시 삭제 + 서버 재시작 |

### ESM 모듈 사용 시 권장 설정

`react-markdown` 등 ESM 모듈 사용 시:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['react-markdown', 'remark-gfm'],
  },
}
```

```typescript
// dynamic import는 default export 사용
const Component = dynamic(() => import('./Component'), {
  ssr: false,
  loading: () => <p>로딩 중...</p>,
});
```
