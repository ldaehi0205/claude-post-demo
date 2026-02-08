import * as dotenv from 'dotenv';
import { GitHubClient } from './github';
import { LinearAPI } from './linear';
import {
  LinearWebhookPayload,
  LinearIssueData,
  GitHubIssuePayload,
  UserMapping,
  PRIORITY_MAP,
  SYNC_LABELS,
  CLOSE_STATES,
} from './types';

dotenv.config();

// Environment variables
const LINEAR_API_KEY = process.env.LINEAR_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;

// User mapping from Linear email to GitHub username
const USER_MAPPING: UserMapping = process.env.USER_MAPPING
  ? JSON.parse(process.env.USER_MAPPING)
  : {};

/**
 * Extract sections from Linear description
 */
function parseDescription(description?: string): {
  summary: string;
  stepsToReproduce: string;
  expected: string;
  actual: string;
  environment: string;
} {
  if (!description) {
    return {
      summary: 'No description provided.',
      stepsToReproduce: 'TBD',
      expected: 'TBD',
      actual: 'TBD',
      environment: '',
    };
  }

  // Extract first 3-5 lines as summary
  const lines = description.split('\n').filter(l => l.trim());
  const summary = lines.slice(0, 5).join('\n') || 'No description provided.';

  // Try to extract sections (case insensitive)
  const extractSection = (text: string, ...patterns: string[]): string => {
    for (const pattern of patterns) {
      const regex = new RegExp(`(?:^|\\n)(?:#{1,3}\\s*)?${pattern}[:\\s]*\\n?([\\s\\S]*?)(?=\\n(?:#{1,3}\\s*)?(?:steps|expected|actual|environment|$)|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return 'TBD';
  };

  return {
    summary,
    stepsToReproduce: extractSection(description, 'steps to reproduce', 'reproduction steps', 'how to reproduce', 'steps'),
    expected: extractSection(description, 'expected', 'expected behavior', 'expected result'),
    actual: extractSection(description, 'actual', 'actual behavior', 'actual result', 'current behavior'),
    environment: extractSection(description, 'environment', 'env', 'platform'),
  };
}

/**
 * Build GitHub issue body from Linear issue data
 */
function buildIssueBody(issue: LinearIssueData): string {
  const parsed = parseDescription(issue.description);

  const assigneeName = issue.assignee?.name || 'Unassigned';
  const assigneeEmail = issue.assignee?.email || '';
  const githubAssignee = assigneeEmail ? USER_MAPPING[assigneeEmail] : null;

  let body = `## Linear Issue

🔗 **Linear URL:** ${issue.url}

---

## Summary

${parsed.summary}

---

## Steps to Reproduce

${parsed.stepsToReproduce}

---

## Expected Behavior

${parsed.expected}

---

## Actual Behavior

${parsed.actual}

`;

  if (parsed.environment && parsed.environment !== 'TBD') {
    body += `---

## Environment

${parsed.environment}

`;
  }

  body += `---

## Metadata

| Field | Value |
|-------|-------|
| **Priority** | ${issue.priorityLabel} |
| **Status** | ${issue.state.name} |
| **Assignee** | ${githubAssignee ? `@${githubAssignee}` : assigneeName} |
| **Labels** | ${issue.labels.map(l => l.name).join(', ') || 'None'} |
${issue.project ? `| **Project** | ${issue.project.name} |` : ''}

---

<!-- Linear-ID: ${issue.id} -->
`;

  return body;
}

/**
 * Build GitHub labels from Linear issue
 */
function buildLabels(issue: LinearIssueData): string[] {
  const labels: string[] = ['bug'];

  // Add priority label
  if (issue.priority > 0 && issue.priority <= 4) {
    const priorityLabel = PRIORITY_MAP[issue.priority];
    if (priorityLabel) {
      labels.push(priorityLabel);
    }
  }

  // Add synced labels
  for (const linearLabel of issue.labels) {
    const labelName = linearLabel.name.toLowerCase();
    if (SYNC_LABELS.includes(labelName)) {
      labels.push(labelName);
    }
  }

  return labels;
}

/**
 * Get GitHub assignees from Linear assignee
 */
function getAssignees(issue: LinearIssueData): string[] | undefined {
  if (!issue.assignee?.email) return undefined;

  const githubUsername = USER_MAPPING[issue.assignee.email];
  return githubUsername ? [githubUsername] : undefined;
}

/**
 * Main handler for Linear webhook events
 */
export async function handleLinearWebhook(payload: LinearWebhookPayload): Promise<void> {
  console.log(`Received Linear webhook: action=${payload.action}, type=${payload.type}`);

  if (payload.type !== 'Issue') {
    console.log('Skipping non-issue event');
    return;
  }

  const github = new GitHubClient(GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO);
  const linear = new LinearAPI(LINEAR_API_KEY);
  const issue = payload.data;

  // Check if this is a bug issue
  const isBug = issue.labels.some(l => l.name.toLowerCase() === 'bug');

  if (!isBug && payload.action === 'create') {
    console.log('Skipping non-bug issue creation');
    return;
  }

  // Check for existing GitHub issue
  const existingIssueNumber = await github.findIssueByLinearId(issue.id);

  // Handle update/status change
  if (payload.action === 'update' && existingIssueNumber) {
    const stateType = issue.state.type;

    if (CLOSE_STATES.includes(stateType)) {
      const reason = stateType === 'completed'
        ? `✅ Linear issue marked as **Done**.\n\nStatus: ${issue.state.name}`
        : `🚫 Linear issue was **Cancelled**.\n\nStatus: ${issue.state.name}`;

      if (stateType === 'completed') {
        await github.closeIssue(existingIssueNumber, reason);
      } else {
        // Just add comment for cancelled, don't close
        await github.addComment(existingIssueNumber, reason);
      }
      return;
    }

    // Add update comment for other status changes
    if (isBug) {
      const updateComment = `🔄 **Linear Issue Updated**\n\n` +
        `- Status: ${issue.state.name}\n` +
        `- Priority: ${issue.priorityLabel}\n` +
        `- Updated at: ${new Date().toISOString()}`;

      await github.addComment(existingIssueNumber, updateComment);
    }
    return;
  }

  // Handle remove
  if (payload.action === 'remove' && existingIssueNumber) {
    await github.addComment(
      existingIssueNumber,
      `⚠️ Linear issue was deleted.`
    );
    return;
  }

  // Create new issue if it's a bug and doesn't exist
  if (isBug && !existingIssueNumber) {
    const labels = buildLabels(issue);

    // Ensure labels exist
    await github.ensureLabels(labels);

    const githubIssue: GitHubIssuePayload = {
      title: `[Linear Bug] ${issue.title}`,
      body: buildIssueBody(issue),
      labels,
      assignees: getAssignees(issue),
    };

    const issueNumber = await github.createIssue(githubIssue);
    console.log(`Successfully created GitHub issue #${issueNumber} for Linear issue ${issue.identifier}`);
  } else if (isBug && existingIssueNumber) {
    console.log(`GitHub issue #${existingIssueNumber} already exists for Linear issue ${issue.id}`);
  }
}

/**
 * Process webhook from environment variable (for GitHub Actions)
 */
async function main() {
  const webhookPayload = process.env.LINEAR_WEBHOOK_PAYLOAD;

  if (!webhookPayload) {
    console.error('No LINEAR_WEBHOOK_PAYLOAD environment variable found');
    process.exit(1);
  }

  try {
    const payload: LinearWebhookPayload = JSON.parse(webhookPayload);
    await handleLinearWebhook(payload);
    console.log('Webhook processing completed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
