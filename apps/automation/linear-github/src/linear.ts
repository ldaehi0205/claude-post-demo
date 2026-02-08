import { LinearClient } from '@linear/sdk';

export class LinearAPI {
  private client: LinearClient;

  constructor(apiKey: string) {
    this.client = new LinearClient({ apiKey });
  }

  /**
   * Fetch full issue details from Linear
   */
  async getIssue(issueId: string) {
    const issue = await this.client.issue(issueId);

    const [state, assignee, labels, project] = await Promise.all([
      issue.state,
      issue.assignee,
      issue.labels(),
      issue.project,
    ]);

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      priorityLabel: issue.priorityLabel,
      url: issue.url,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      state: state ? {
        id: state.id,
        name: state.name,
        type: state.type,
      } : null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
      } : null,
      labels: labels.nodes.map(l => ({
        id: l.id,
        name: l.name,
      })),
      project: project ? {
        id: project.id,
        name: project.name,
      } : null,
    };
  }

  /**
   * Check if issue has Bug label or type
   */
  async isBugIssue(issueId: string): Promise<boolean> {
    const issue = await this.client.issue(issueId);
    const labels = await issue.labels();

    return labels.nodes.some(
      label => label.name.toLowerCase() === 'bug'
    );
  }
}
