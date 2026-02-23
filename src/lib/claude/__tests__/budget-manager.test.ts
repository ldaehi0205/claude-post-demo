import { shrinkToBudget } from '../budget-manager';
import { ShrinkStrategy } from '../types';
import type { ClaudePayload, TokenBudgetConfig, ShrinkOptions } from '../types';

// countInputTokens를 모킹하여 토큰 수를 제어
let mockTokenCount = 8500;
jest.mock('../token-counter', () => ({
  countInputTokens: jest.fn().mockImplementation(
    (_payload: ClaudePayload, config: TokenBudgetConfig) => {
      const remaining = config.inputTokenBudget - mockTokenCount - config.safetyMargin;
      return Promise.resolve({ inputTokens: mockTokenCount, remainingBudget: remaining });
    },
  ),
}));

describe('budget-manager', () => {
  const config: TokenBudgetConfig = {
    inputTokenBudget: 8000,
    outputTokenBudget: 1000,
    safetyMargin: 300,
  };

  beforeEach(() => {
    mockTokenCount = 8500; // 기본: 예산 초과
  });

  it('예산 내이면 축약 없이 그대로 반환한다', async () => {
    mockTokenCount = 5000;

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const result = await shrinkToBudget(payload, config);

    expect(result.shrinkSteps).toHaveLength(0);
    expect(result.finalTokens).toBe(5000);
  });

  it('예산 초과 시 히스토리 축약을 먼저 시도한다', async () => {
    let callCount = 0;
    const { countInputTokens } = require('../token-counter');
    countInputTokens.mockImplementation(
      (_payload: ClaudePayload, cfg: TokenBudgetConfig) => {
        callCount++;
        // 첫 번째 호출: 초과, 히스토리 축약 후: 예산 내
        const tokens = callCount === 1 ? 8500 : 6000;
        return Promise.resolve({
          inputTokens: tokens,
          remainingBudget: cfg.inputTokenBudget - tokens - cfg.safetyMargin,
        });
      },
    );

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [
        { role: 'user', content: 'Old question' },
        { role: 'assistant', content: 'Old answer' },
        { role: 'user', content: 'Current question' },
      ],
    };

    const result = await shrinkToBudget(payload, config);

    expect(result.shrinkSteps.length).toBeGreaterThanOrEqual(1);
    expect(result.shrinkSteps[0].strategy).toBe(ShrinkStrategy.HISTORY);
  });

  it('히스토리 축약으로 부족하면 문서 축약도 적용한다', async () => {
    let callCount = 0;
    const { countInputTokens } = require('../token-counter');
    countInputTokens.mockImplementation(
      (_payload: ClaudePayload, cfg: TokenBudgetConfig) => {
        callCount++;
        // 히스토리 축약 후에도 초과, 문서 축약 후 예산 내
        const tokens = callCount <= 2 ? 8500 : 5000;
        return Promise.resolve({
          inputTokens: tokens,
          remainingBudget: cfg.inputTokenBudget - tokens - cfg.safetyMargin,
        });
      },
    );

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Question' }],
      documents: [
        { content: 'Doc 1 content', relevanceScore: 0.9 },
        { content: 'Doc 2 content', relevanceScore: 0.5 },
        { content: 'Doc 3 content', relevanceScore: 0.3 },
      ],
    };

    const result = await shrinkToBudget(payload, config);

    const strategies = result.shrinkSteps.map(s => s.strategy);
    expect(strategies).toContain(ShrinkStrategy.DOCUMENTS);
  });

  it('shrinkSteps에 전/후 토큰 수가 기록된다', async () => {
    let callCount = 0;
    const { countInputTokens } = require('../token-counter');
    countInputTokens.mockImplementation(
      (_payload: ClaudePayload, cfg: TokenBudgetConfig) => {
        callCount++;
        const tokens = callCount === 1 ? 8500 : 6000;
        return Promise.resolve({
          inputTokens: tokens,
          remainingBudget: cfg.inputTokenBudget - tokens - cfg.safetyMargin,
        });
      },
    );

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [
        { role: 'user', content: 'Old' },
        { role: 'assistant', content: 'Reply' },
        { role: 'user', content: 'Current' },
      ],
    };

    const result = await shrinkToBudget(payload, config);

    expect(result.shrinkSteps[0].beforeTokens).toBe(8500);
    expect(result.shrinkSteps[0].afterTokens).toBe(6000);
  });
});
