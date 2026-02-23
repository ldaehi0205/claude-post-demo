import { countInputTokens } from '../token-counter';
import type { ClaudePayload, TokenBudgetConfig } from '../types';

// Anthropic SDK 모킹
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      countTokens: jest.fn().mockResolvedValue({ input_tokens: 500 }),
    },
  }));
});

describe('token-counter', () => {
  const baseConfig: TokenBudgetConfig = {
    inputTokenBudget: 8000,
    outputTokenBudget: 1000,
    safetyMargin: 300,
  };

  it('기본 메시지의 토큰을 카운팅한다', async () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const result = await countInputTokens(payload, baseConfig);

    expect(result.inputTokens).toBe(500);
    // remainingBudget = 8000 - 500 - 300 = 7200
    expect(result.remainingBudget).toBe(7200);
  });

  it('system 프롬프트가 포함된 경우 처리한다', async () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const result = await countInputTokens(payload, baseConfig);

    expect(result.inputTokens).toBe(500);
  });

  it('tools가 포함된 경우 처리한다', async () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'What is the weather?' }],
      tools: [
        {
          name: 'get_weather',
          description: 'Get weather info',
          input_schema: {
            type: 'object' as const,
            properties: { location: { type: 'string' } },
            required: ['location'],
          },
        },
      ],
    };

    const result = await countInputTokens(payload, baseConfig);

    expect(result.inputTokens).toBe(500);
  });

  it('tool_result가 포함된 멀티 메시지를 처리한다', async () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [
        { role: 'user', content: 'What is the weather?' },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tool_1',
              name: 'get_weather',
              input: { location: 'Seoul' },
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool_1',
              content: 'Sunny, 25°C',
            },
          ],
        },
      ],
    };

    const result = await countInputTokens(payload, baseConfig);

    expect(result.inputTokens).toBe(500);
  });

  it('remaining_budget이 음수일 수 있다 (예산 초과)', async () => {
    // input_tokens가 500이면 budget 600 - margin 300 = remaining -200 이 되는 경우
    const tightConfig: TokenBudgetConfig = {
      inputTokenBudget: 600,
      outputTokenBudget: 1000,
      safetyMargin: 300,
    };

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Long message...' }],
    };

    const result = await countInputTokens(payload, tightConfig);

    expect(result.inputTokens).toBe(500);
    expect(result.remainingBudget).toBe(-200);
  });
});
