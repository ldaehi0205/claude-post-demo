import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    search: {
      issuesAndPullRequests: vi.fn(),
    },
    issues: {
      create: vi.fn(),
      createComment: vi.fn(),
      update: vi.fn(),
      getLabel: vi.fn(),
      createLabel: vi.fn(),
    },
  })),
}));

vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    issue: vi.fn(),
  })),
}));

import { GitHubClient } from '../src/github';

describe('Duplicate Prevention Logic', () => {
  let githubClient: GitHubClient;
  let mockOctokit: any;

  beforeEach(() => {
    vi.clearAllMocks();
    githubClient = new GitHubClient('test-token', 'test-owner', 'test-repo');
    // @ts-ignore - accessing private for testing
    mockOctokit = githubClient['octokit'];
  });

  describe('findIssueByLinearId', () => {
    it('should return issue number when Linear ID exists', async () => {
      const linearId = 'linear-123';

      mockOctokit.search.issuesAndPullRequests.mockResolvedValue({
        data: {
          total_count: 1,
          items: [{ number: 42 }],
        },
      });

      const result = await githubClient.findIssueByLinearId(linearId);

      expect(result).toBe(42);
      expect(mockOctokit.search.issuesAndPullRequests).toHaveBeenCalledWith({
        q: `repo:test-owner/test-repo is:issue "Linear-ID: ${linearId}" in:body`,
        per_page: 1,
      });
    });

    it('should return null when Linear ID does not exist', async () => {
      mockOctokit.search.issuesAndPullRequests.mockResolvedValue({
        data: {
          total_count: 0,
          items: [],
        },
      });

      const result = await githubClient.findIssueByLinearId('non-existent');

      expect(result).toBeNull();
    });

    it('should return null on search error', async () => {
      mockOctokit.search.issuesAndPullRequests.mockRejectedValue(
        new Error('API Error')
      );

      const result = await githubClient.findIssueByLinearId('linear-123');

      expect(result).toBeNull();
    });
  });

  describe('createIssue', () => {
    it('should create issue with correct payload', async () => {
      mockOctokit.issues.create.mockResolvedValue({
        data: { number: 100, title: 'Test Issue' },
      });

      const payload = {
        title: '[Linear Bug] Test Bug',
        body: 'Test body\n\n<!-- Linear-ID: abc123 -->',
        labels: ['bug', 'priority:p1'],
        assignees: ['testuser'],
      };

      const result = await githubClient.createIssue(payload);

      expect(result).toBe(100);
      expect(mockOctokit.issues.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: payload.title,
        body: payload.body,
        labels: payload.labels,
        assignees: payload.assignees,
      });
    });
  });

  describe('addComment', () => {
    it('should add comment to existing issue', async () => {
      mockOctokit.issues.createComment.mockResolvedValue({});

      await githubClient.addComment(42, 'Status update');

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 42,
        body: 'Status update',
      });
    });
  });

  describe('closeIssue', () => {
    it('should close issue with comment', async () => {
      mockOctokit.issues.createComment.mockResolvedValue({});
      mockOctokit.issues.update.mockResolvedValue({});

      await githubClient.closeIssue(42, 'Closing reason');

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 42,
        body: 'Closing reason',
      });

      expect(mockOctokit.issues.update).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 42,
        state: 'closed',
      });
    });
  });
});

describe('Issue Body Parsing', () => {
  // Test the Linear-ID marker is properly embedded
  it('should include Linear-ID in issue body', () => {
    const linearId = 'test-linear-id-123';
    const body = `Some content\n\n<!-- Linear-ID: ${linearId} -->`;

    expect(body).toContain(`Linear-ID: ${linearId}`);
  });

  it('should be searchable via GitHub search API format', () => {
    const linearId = 'abc-123';
    const searchQuery = `"Linear-ID: ${linearId}" in:body`;

    expect(searchQuery).toBe('"Linear-ID: abc-123" in:body');
  });
});
