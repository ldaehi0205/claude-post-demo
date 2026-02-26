---
name: linear-workflow
description: Linear 이슈 기반 개발 워크플로우. 이슈 확인 → 브랜치 → 구현 → PR → 리뷰 대응까지 수행합니다.
---

# Linear 이슈 기반 개발 워크플로우

사용자가 Linear 이슈 ID(예: `LDH-8`)를 주면, 이슈 확인부터 PR 리뷰 대응까지 전체 개발 사이클을 수행한다.

## 워크플로우 전체 흐름

```
사용자: "LDH-10 작업해줘"
  ↓
[Step 1] Linear 이슈 조회 (제목, 설명, 우선순위)
  ↓
[Step 2] 이슈 검증 & 착수 승인 (사용자 확인 → Linear 코멘트)
  ↓
[Step 3] 브랜치 생성 (feat/LDH-10-add-feature)
  ↓
[Step 4] 구현 & 커밋 (TDD 사이클, tdd-workflow 스킬 참조)
  ↓
[Step 5] PR 생성 (gh pr create → main)
  ↓
사용자: PR 리뷰 작성
  ↓
사용자: "PR #5 리뷰 확인해줘"
  ↓
[Step 6] 리뷰 대응 (반영 or 댓글)
  ↓
[Step 7] Linear 이슈 상태 → Done
```

---

## Step 1: 이슈 확인

Linear GraphQL API로 이슈를 조회한다.

```graphql
query {
  issue(id: "LDH-10") {
    id title description priority state { name }
  }
}
```

- `src/utils/linear.ts`의 `linearGraphQL()` 함수 재사용
- 이슈 제목, 설명, 우선순위를 확인하여 작업 범위를 파악

## Step 1.5: 이슈 검증 & 착수 승인

Step 1에서 조회한 이슈를 분석하여 개발 착수 전에 사용자 확인을 받는다.

### 1.5-1. 이슈 분석

조회된 이슈 정보를 바탕으로 다음을 판단하여 사용자에게 보고한다:

- **개발 가능 여부**: 요구사항이 명확하여 바로 개발 착수 가능한가
- **구현 방향**: 어떤 방식으로 구현할 것인지 간단한 방향
- **추가 정보 필요 여부**: 불명확한 부분이 있다면 어떤 정보가 더 필요한지

### 1.5-2. 사용자 확인

`AskUserQuestion`으로 사용자에게 착수 여부를 확인한다.

- **승인(yes)** → Linear 이슈에 코멘트 작성 후 Step 2로 진행
- **추가 정보 요청** → 보완 후 재확인

### 1.5-3. Linear 코멘트 작성

사용자 승인 시, 이슈에 개발 착수 분석 코멘트를 남긴다.

```graphql
mutation {
  commentCreate(input: {
    issueId: "<issue-uuid>"
    body: "## 🚀 개발 착수 분석\n- **구현 방향**: <간단한 구현 방향>\n- **판단**: 개발 착수 가능"
  }) {
    success
    comment { id body }
  }
}
```

- `issueId`는 Step 1에서 조회한 이슈의 UUID (`id` 필드, `identifier`가 아님)
- `linearGraphQL()` 함수 재사용

## Step 2: 브랜치 생성

### 네이밍 규칙

```
<타입>/LDH-<번호>-<영문설명>
```

| 타입 | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩터링 |
| `docs` | 문서 |
| `test` | 테스트 |
| `chore` | 설정/빌드 |

**예시**: `feat/LDH-10-add-search`, `fix/LDH-12-login-redirect`

```bash
git checkout -b feat/LDH-10-add-search
```

## Step 3: 구현 & 커밋

- **TDD 규칙**: `.claude/skills/tdd-workflow/SKILL.md` 참조
- **코드 검증**: `.claude/skills/review-code/SKILL.md` 참조
- **Tidy First**: 구조적 변경(`refactor`)과 행위적 변경(`feat`/`fix`)은 별도 커밋
- **커밋 메시지**: 한국어, `<타입>: <제목>` 형식

## Step 4: PR 생성

`gh pr create`로 main 대상 PR을 생성한다.

```bash
gh pr create --title "<타입>: <한국어 제목>" --body "$(cat <<'EOF'
## Summary
- <변경 사항 요약>

## Linear Issue
- LDH-<번호>: <이슈 제목>

## Test plan
- [ ] 테스트 항목

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**규칙:**
- PR 본문에 Linear 이슈 번호와 제목을 포함
- 테스트 계획을 체크리스트로 명시

## Step 5: PR 리뷰 대응

사용자가 "PR 리뷰 확인해줘"라고 요청하면 리뷰를 읽고 대응한다.

### 5-1. 리뷰 확인

```bash
# PR 리뷰 목록 조회
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews

# 리뷰 코멘트 조회
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
```

### 5-2. 리뷰 판단 및 대응

| 판단 | 대응 |
|------|------|
| **타당한 리뷰** | 코드 수정 → 커밋 → push → 리뷰에 "반영했습니다" 답글 |
| **논의 필요** | 리뷰 댓글에 근거를 들어 의견을 남김 |

**타당한 리뷰 반영:**
```bash
# 코드 수정 후
git add <files> && git commit -m "fix: PR 리뷰 반영 - <내용>"
git push

# 리뷰 댓글에 답글
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -f body="반영했습니다. <변경 내용 설명>"
```

**논의가 필요한 경우:**
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -f body="<의견 및 근거>"
```

### 5-3. 판단 기준

- **반영**: 버그, 성능 이슈, 보안 취약점, 코드 스타일 위반, 더 나은 구현 제안
- **논의**: 취향 차이, 기존 패턴과 충돌, 과도한 추상화 요구, 요구사항 범위 밖

## Step 6: 완료 처리

PR merge 후 Linear 이슈 상태를 "Done"으로 변경한다.

```graphql
mutation {
  issueUpdate(id: "<issue-id>", input: { stateId: "<done-state-id>" }) {
    success
    issue { id title state { name } }
  }
}
```

- Done 상태 ID는 팀의 워크플로우 상태에서 조회
- `src/utils/linear.ts`의 `linearGraphQL()` 함수 사용

---

## 주요 ID 정보

| 항목 | ID |
|------|-----|
| 팀 (Ldh642) | `83a78e2f-1832-4909-bb75-f455dc974e59` |
| 프로젝트 (post-demo) | `187af142-bb5e-459b-998f-9092c65e5dfd` |

## 사용 도구

| 도구 | 용도 |
|------|------|
| `src/utils/linear.ts` → `linearGraphQL()` | Linear API 호출 |
| `gh pr create` | PR 생성 |
| `gh api` | PR 리뷰 조회/답글 |
| `git` | 브랜치/커밋/push |
