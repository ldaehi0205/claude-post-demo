import { buildRequest } from '../request-builder';
import type { ClaudePayload, TokenBudgetConfig } from '../types';

describe('request-builder', () => {
  const config: TokenBudgetConfig = {
    inputTokenBudget: 8000,
    outputTokenBudget: 1000,
    safetyMargin: 300,
  };

  it('기본 요청 바디를 생성한다', () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const body = buildRequest(payload, config);

    expect(body.model).toBe('claude-sonnet-4-5-20250929');
    expect(body.max_tokens).toBe(1000);
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(body.system).toBeUndefined();
    expect(body.tools).toBeUndefined();
  });

  it('system 프롬프트를 포함한다', () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      system: 'You are helpful.',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const body = buildRequest(payload, config);
    expect(body.system).toBe('You are helpful.');
  });

  it('tools를 포함한다', () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
      tools: [
        {
          name: 'get_weather',
          description: 'Get weather',
          input_schema: {
            type: 'object' as const,
            properties: { location: { type: 'string' } },
            required: ['location'],
          },
        },
      ],
    };

    const body = buildRequest(payload, config);
    expect(body.tools).toHaveLength(1);
    expect(body.tools![0].name).toBe('get_weather');
  });

  it('documents를 마지막 유저 메시지에 컨텍스트로 병합한다', () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Summarize the docs' }],
      documents: [
        { content: 'Document 1 text', relevanceScore: 0.9 },
        { content: 'Document 2 text', relevanceScore: 0.7 },
      ],
    };

    const body = buildRequest(payload, config);

    // 마지막 유저 메시지에 문서가 병합됨
    const lastMsg = body.messages[body.messages.length - 1];
    expect(lastMsg.role).toBe('user');
    expect(lastMsg.content).toContain('Document 1 text');
    expect(lastMsg.content).toContain('Document 2 text');
    expect(lastMsg.content).toContain('Summarize the docs');
  });

  it('outputGuide가 system에 추가된다', () => {
    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      system: 'Base instructions.',
      messages: [{ role: 'user', content: 'Hello' }],
      outputGuide: {
        maxBullets: 5,
        disableCode: true,
        customInstruction: 'JSON으로 응답',
      },
    };

    const body = buildRequest(payload, config);
    expect(body.system).toContain('Base instructions.');
    expect(body.system).toContain('5개 이하');
    expect(body.system).toContain('코드 블록 사용 금지');
    expect(body.system).toContain('JSON으로 응답');
  });

  it('max_tokens는 outputTokenBudget으로 제한된다', () => {
    const tightConfig: TokenBudgetConfig = {
      inputTokenBudget: 8000,
      outputTokenBudget: 500,
      safetyMargin: 300,
    };

    const payload: ClaudePayload = {
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const body = buildRequest(payload, tightConfig);
    expect(body.max_tokens).toBe(500);
  });
});
