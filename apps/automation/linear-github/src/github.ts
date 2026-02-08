import { Octokit } from '@octokit/rest';
import { GitHubIssuePayload } from './types';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Find existing GitHub issue by Linear ID
   * Searches for `Linear-ID: <id>` in issue body
   */
  async findIssueByLinearId(linearId: string): Promise<number | null> {
    try {
      const query = `repo:${this.owner}/${this.repo} is:issue "Linear-ID: ${linearId}" in:body`;

      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: query,
        per_page: 1,
      });

      if (data.total_count > 0 && data.items[0]) {
        return data.items[0].number;
      }
      return null;
    } catch (error) {
      console.error('Error searching for existing issue:', error);
      return null;
    }
  }

  /**
   * Create a new GitHub issue
   */
  async createIssue(payload: GitHubIssuePayload): Promise<number> {
    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: payload.title,
      body: payload.body,
      labels: payload.labels,
      assignees: payload.assignees,
    });

    console.log(`Created GitHub issue #${data.number}: ${data.title}`);
    return data.number;
  }

  /**
   * Add a comment to an existing issue
   */
  async addComment(issueNumber: number, body: string): Promise<void> {
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body,
    });

    console.log(`Added comment to issue #${issueNumber}`);
  }

  /**
   * Close an issue
   */
  async closeIssue(issueNumber: number, reason?: string): Promise<void> {
    if (reason) {
      await this.addComment(issueNumber, reason);
    }

    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state: 'closed',
    });

    console.log(`Closed issue #${issueNumber}`);
  }

  /**
   * Ensure labels exist in the repository
   */
  async ensureLabels(labels: string[]): Promise<void> {
    const labelColors: Record<string, string> = {
      'bug': 'd73a4a',
      'priority:p0': 'b60205',
      'priority:p1': 'd93f0b',
      'priority:p2': 'fbca04',
      'priority:p3': '0e8a16',
      'frontend': '1d76db',
      'backend': '5319e7',
      'mobile': 'f9d0c4',
    };

    for (const label of labels) {
      try {
        await this.octokit.issues.getLabel({
          owner: this.owner,
          repo: this.repo,
          name: label,
        });
      } catch {
        // Label doesn't exist, create it
        try {
          await this.octokit.issues.createLabel({
            owner: this.owner,
            repo: this.repo,
            name: label,
            color: labelColors[label] || 'ededed',
          });
          console.log(`Created label: ${label}`);
        } catch (createError) {
          console.error(`Failed to create label ${label}:`, createError);
        }
      }
    }
  }
}
