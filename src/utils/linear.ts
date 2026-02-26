/**
 * Linear API 연동 유틸리티
 * API 라우트에서 400+ 에러 발생 시 Linear에 Bug 이슈를 자동 생성합니다.
 */

interface LinearErrorPayload {
  method: string;
  url: string;
  status: number;
  errorMessage: string;
  errorCode: string;
}

// 인메모리 중복 방지 (5분 이내 동일 에러 무시)
const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

function generateErrorKey(payload: LinearErrorPayload): string {
  const urlPath = new URL(payload.url).pathname;
  return `${payload.method}:${urlPath}:${payload.status}:${payload.errorCode}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();

  recentErrors.forEach((timestamp, k) => {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentErrors.delete(k);
    }
  });

  if (recentErrors.has(key)) {
    return true;
  }

  recentErrors.set(key, now);
  return false;
}

// Linear GraphQL API 호출
async function linearGraphQL(
  query: string,
  variables?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.LINEAR_API_KEY;

  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey!,
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

// 팀 ID 캐시
let cachedTeamId: string | null = null;

async function getTeamId(): Promise<string | null> {
  if (cachedTeamId) return cachedTeamId;

  const result = (await linearGraphQL(
    `query { teams { nodes { id name } } }`,
  )) as { data?: { teams?: { nodes: { id: string; name: string }[] } } };

  const teams = result.data?.teams?.nodes;
  if (teams && teams.length > 0) {
    cachedTeamId = teams[0].id;
    return cachedTeamId;
  }
  return null;
}

// Bug 라벨 ID 캐시
let cachedBugLabelId: string | null = null;

async function getBugLabelId(): Promise<string | null> {
  if (cachedBugLabelId) return cachedBugLabelId;

  const result = (await linearGraphQL(
    `query { issueLabels(filter: { name: { eq: "Bug" } }) { nodes { id name } } }`,
  )) as { data?: { issueLabels?: { nodes: { id: string; name: string }[] } } };

  const labels = result.data?.issueLabels?.nodes;
  if (labels && labels.length > 0) {
    cachedBugLabelId = labels[0].id;
    return cachedBugLabelId;
  }
  return null;
}

/**
 * Linear에 Bug 이슈를 자동 생성합니다.
 * LINEAR_API_KEY 미설정 시 graceful skip합니다.
 * 5분 이내 동일 에러는 중복 방지로 스킵합니다.
 */
export async function reportErrorToLinear(
  payload: LinearErrorPayload,
): Promise<void> {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    console.log(
      '[Linear] LINEAR_API_KEY가 설정되지 않아 이슈 생성을 스킵합니다.',
    );
    return;
  }

  const errorKey = generateErrorKey(payload);
  if (isDuplicate(errorKey)) {
    console.log(`[Linear] 중복 에러 스킵: ${errorKey}`);
    return;
  }

  try {
    const teamId = await getTeamId();
    if (!teamId) {
      console.error('[Linear] 팀 ID를 가져올 수 없습니다.');
      return;
    }

    const bugLabelId = await getBugLabelId();

    const urlPath = new URL(payload.url).pathname;
    const title = `[API Error] ${payload.method} ${urlPath} - ${payload.status} (${payload.errorCode})`;

    const description = [
      `## API 에러 자동 보고`,
      ``,
      `| 항목 | 값 |`,
      `|---|---|`,
      `| **HTTP Method** | \`${payload.method}\` |`,
      `| **URL** | \`${payload.url}\` |`,
      `| **상태 코드** | ${payload.status} |`,
      `| **에러 코드** | \`${payload.errorCode}\` |`,
      `| **에러 메시지** | ${payload.errorMessage} |`,
      `| **발생 시각** | ${new Date().toISOString()} |`,
      ``,
      `> 이 이슈는 API 에러 모니터링 시스템에 의해 자동 생성되었습니다.`,
    ].join('\n');

    const input: Record<string, unknown> = {
      title,
      description,
      teamId,
      projectId: '187af142-bb5e-459b-998f-9092c65e5dfd',
      priority: payload.status >= 500 ? 1 : 3,
    };

    if (bugLabelId) {
      input.labelIds = [bugLabelId];
    }

    const result = (await linearGraphQL(
      `mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id title identifier }
        }
      }`,
      { input },
    )) as {
      data?: {
        issueCreate?: {
          success: boolean;
          issue?: { id: string; title: string; identifier: string };
        };
      };
      errors?: { message: string }[];
    };

    if (result.data?.issueCreate?.success) {
      const issue = result.data.issueCreate.issue;
      console.log(
        `[Linear] Bug 이슈 생성 완료: ${issue?.identifier} - ${issue?.title}`,
      );
    } else {
      console.error('[Linear] 이슈 생성 실패:', result.errors);
    }
  } catch (error) {
    console.error('[Linear] 이슈 생성 중 오류:', error);
  }
}
