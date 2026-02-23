import { callClaude } from '../client';
import type { ClaudePayload, TokenBudgetConfig } from '../types';

// Anthropic SDK 모킹
const mockCreate = jest.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Hello!' }],
  usage: { input_tokens: 500, output_tokens: 100 },
  stop_reason: 'end_turn',
});

const mockCountTokens = jest.fn().mockResolvedValue({ input_tokens: 500 });

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
      countTokens: mockCountTokens,
    },
  }));
});

// logger 모킹
jest.mock('../logger', () => ({
  createRequestLog: jest.fn().mockReturnValue({
    requestId: 'test-id',
    model: 'claude-sonnet-4-5-20250929',
    inputTokens: 500,
    outputTokens: 100,
    maxTokens: 1000,
    shrinkSteps: [],
    latencyMs: 200,
    timestamp: '2026-02-23T00:00:00.000Z',
  }),
  logRequest: jest.fn(),
  estimateCost: jest.fn(),
}));

describe('client', () => {
  const config: TokenBudgetConfig = {
    inputTokenBudget: 8000,
    outputTokenBudget: 1000,
    safetyMargin: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCountTokens.mockResolvedValue({ input_tokens: 500 });
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello!' }],
      usage: { input_tokens: 500, output_tokens: 100 },
      stop_reason: 'end_turn',
    });
  });

  it('전체 파이프라인이 정상 동작한다 (count → build → call)', async () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const response = await callClaude(payload, config);

    expect(response.content).toEqual([{ type: 'text', text: 'Hello!' }]);
    expect(response.usage.input_tokens).toBe(500);
    expect(response.usage.output_tokens).toBe(100);
    expect(response.stopReason).toBe('end_turn');
    expect(response.log).toBeDefined();
    expect(response.log.requestId).toBe('test-id');
  });

  it('messages.create를 올바른 인자로 호출한다', async () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      system: 'Be helpful.',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    await callClaude(payload, config);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const createArgs = mockCreate.mock.calls[0][0];
    expect(createArgs.model).toBe('claude-sonnet-4-5-20250929');
    expect(createArgs.max_tokens).toBe(1000);
    expect(createArgs.system).toBe('Be helpful.');
  });

  it('logRequest가 호출된다', async () => {
    const { logRequest } = require('../logger');

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    await callClaude(payload, config);

    expect(logRequest).toHaveBeenCalledTimes(1);
  });

  it('API 호출 실패 시 에러를 전파한다', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    await expect(callClaude(payload, config)).rejects.toThrow('API Error');
  });
});
