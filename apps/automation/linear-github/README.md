# Linear → GitHub Issue Sync

Linear에서 Bug 타입 이슈가 생성/변경되면 자동으로 GitHub Issue를 생성하고 동기화합니다.

## 기능

- ✅ Linear Bug 이슈 → GitHub Issue 자동 생성
- ✅ 중복 방지 (Linear-ID 기반)
- ✅ 상태 동기화 (Done → Close, Cancelled → Comment)
- ✅ Priority 매핑 (P0~P3)
- ✅ Label 동기화 (frontend, backend, mobile)
- ✅ Assignee 매핑
- ✅ 재시도 로직 포함

## 아키텍처

```
Linear Webhook → GitHub repository_dispatch → GitHub Actions → GitHub Issues API
```

## 설정 방법

### 1. GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions에서 다음 시크릿을 추가:

| Secret Name | 설명 |
|-------------|------|
| `LINEAR_API_KEY` | Linear API 키 (Settings > API > Personal API keys) |
| `LINEAR_GITHUB_USER_MAPPING` | Linear 이메일 → GitHub 사용자 매핑 (JSON) |

> `GITHUB_TOKEN`은 자동으로 제공됩니다.

**USER_MAPPING 예시:**
```json
{"user@company.com": "github-username", "user2@company.com": "github-user2"}
```

### 2. Linear Webhook 설정

#### Option A: GitHub Actions를 통한 Webhook (권장)

1. Linear Settings > API > Webhooks로 이동
2. "New webhook" 클릭
3. 다음 설정:
   - **URL**: `https://api.github.com/repos/{OWNER}/{REPO}/dispatches`
   - **Headers**:
     - `Authorization`: `token {GITHUB_PAT}`
     - `Accept`: `application/vnd.github.v3+json`
   - **Body Template** (Custom):
   ```json
   {
     "event_type": "linear-webhook",
     "client_payload": {{json .}}
   }
   ```
4. **Events**: Issue created, Issue updated, Issue label changed

> ⚠️ GitHub PAT는 `repo` 스코프가 필요합니다.

#### Option B: Webhook Proxy 사용

Linear는 직접 GitHub API를 호출하지 못할 수 있습니다. 이 경우 간단한 프록시를 사용:

```javascript
// Cloudflare Worker 예시
export default {
  async fetch(request) {
    const body = await request.json();

    return fetch('https://api.github.com/repos/OWNER/REPO/dispatches', {
      method: 'POST',
      headers: {
        'Authorization': 'token YOUR_GITHUB_PAT',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'linear-webhook',
        client_payload: body,
      }),
    });
  },
};
```

### 3. GitHub Labels 생성 (자동)

다음 라벨은 자동으로 생성됩니다:

| Label | Color |
|-------|-------|
| `bug` | #d73a4a |
| `priority:p0` | #b60205 |
| `priority:p1` | #d93f0b |
| `priority:p2` | #fbca04 |
| `priority:p3` | #0e8a16 |
| `frontend` | #1d76db |
| `backend` | #5319e7 |
| `mobile` | #f9d0c4 |

## GitHub Issue 형식

생성되는 이슈 예시:

**제목**: `[Linear Bug] 로그인 버튼이 작동하지 않음`

**본문**:
```markdown
## Linear Issue

🔗 **Linear URL:** https://linear.app/team/issue/TEAM-123

---

## Summary

로그인 페이지에서 로그인 버튼 클릭 시 아무 반응이 없습니다.

---

## Steps to Reproduce

1. 로그인 페이지 접속
2. 이메일/비밀번호 입력
3. 로그인 버튼 클릭

---

## Expected Behavior

로그인 성공 후 대시보드로 이동

---

## Actual Behavior

버튼 클릭해도 반응 없음

---

## Metadata

| Field | Value |
|-------|-------|
| **Priority** | Urgent |
| **Status** | In Progress |
| **Assignee** | @github-user |
| **Labels** | bug, frontend |

---

<!-- Linear-ID: abc123-def456 -->
```

## 중복 방지

- 이슈 본문에 `<!-- Linear-ID: {id} -->`가 포함됨
- 같은 Linear ID가 이미 존재하면 새 이슈 생성하지 않음
- 상태 변경 시 기존 이슈에 코멘트 추가

## 상태 동기화

| Linear 상태 | GitHub 동작 |
|-------------|-------------|
| Done (completed) | Issue 닫기 + 코멘트 |
| Cancelled | 코멘트만 추가 |
| 기타 상태 변경 | 상태 업데이트 코멘트 |

## 로컬 테스트

```bash
cd apps/automation/linear-github

# 의존성 설치
npm install

# 테스트 실행
npm test

# 빌드
npm run build

# 수동 실행 (환경변수 설정 필요)
LINEAR_WEBHOOK_PAYLOAD='{"action":"create",...}' npm start
```

## 수동 워크플로우 트리거

GitHub Actions 페이지에서 "Run workflow"로 수동 테스트:

```json
{
  "action": "create",
  "type": "Issue",
  "data": {
    "id": "test-123",
    "identifier": "TEAM-1",
    "title": "Test Bug",
    "description": "Test description",
    "priority": 2,
    "priorityLabel": "High",
    "state": {
      "id": "state-1",
      "name": "In Progress",
      "type": "started"
    },
    "labels": [{"id": "label-1", "name": "bug"}],
    "url": "https://linear.app/team/issue/TEAM-1"
  }
}
```

## 트러블슈팅

### Webhook이 동작하지 않음

1. Linear webhook 설정 확인
2. GitHub PAT 권한 확인 (`repo` 스코프)
3. GitHub Actions 로그 확인

### 중복 이슈 생성됨

1. GitHub Search API가 인덱싱에 시간이 걸릴 수 있음 (수 초~수 분)
2. Linear-ID가 본문에 제대로 포함되어 있는지 확인

### Assignee가 매핑되지 않음

1. `LINEAR_GITHUB_USER_MAPPING` 시크릿 확인
2. JSON 형식이 올바른지 확인
3. Linear 이메일이 정확한지 확인

## 파일 구조

```
apps/automation/linear-github/
├── src/
│   ├── index.ts     # 메인 핸들러
│   ├── github.ts    # GitHub API 클라이언트
│   ├── linear.ts    # Linear API 클라이언트
│   └── types.ts     # 타입 정의
├── tests/
│   └── duplicate.test.ts
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md

.github/workflows/
└── linear-github-sync.yml
```
