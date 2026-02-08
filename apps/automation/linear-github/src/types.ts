/** Linear webhook payload for issue events */
export interface LinearWebhookPayload {
  action: 'create' | 'update' | 'remove';
  type: 'Issue';
  data: LinearIssueData;
  createdAt: string;
  url: string;
  webhookId: string;
  webhookTimestamp: number;
}

export interface LinearIssueData {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  priorityLabel: string;
  state: {
    id: string;
    name: string;
    type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled';
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  labels: Array<{
    id: string;
    name: string;
  }>;
  project?: {
    id: string;
    name: string;
  };
  url: string;
  createdAt: string;
  updatedAt: string;
}

/** GitHub Issue creation payload */
export interface GitHubIssuePayload {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

/** Mapping from Linear user email to GitHub username */
export interface UserMapping {
  [linearEmail: string]: string;
}

/** Priority mapping from Linear (1-4) to GitHub label */
export const PRIORITY_MAP: Record<number, string> = {
  1: 'priority:p0', // Urgent
  2: 'priority:p1', // High
  3: 'priority:p2', // Medium
  4: 'priority:p3', // Low
};

/** Labels to sync from Linear to GitHub */
export const SYNC_LABELS = ['frontend', 'backend', 'mobile'];

/** Linear states that should close GitHub issue */
export const CLOSE_STATES = ['completed', 'canceled'];
