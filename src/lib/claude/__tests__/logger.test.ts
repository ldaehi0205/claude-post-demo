import { createRequestLog, logRequest, estimateCost } from '../logger';
import { ShrinkStrategy } from '../types';
import type { ShrinkStep } from '../types';

describe('logger', () => {
  describe('createRequestLog', () => {
    it('requestId, timestamp가 자동 생성된다', () => {
      const log = createRequestLog({
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 500,
        maxTokens: 1000,
        shrinkSteps: [],
        latencyMs: 200,
      });

      expect(log.requestId).toBeDefined();
      expect(log.requestId.length).toBeGreaterThan(0);
      expect(log.timestamp).toBeDefined();
      expect(new Date(log.timestamp).getTime()).not.toBeNaN();
    });

    it('전달된 값이 올바르게 포함된다', () => {
      const steps: ShrinkStep[] = [
        {
          strategy: ShrinkStrategy.HISTORY,
          beforeTokens: 8000,
          afterTokens: 4000,
          detail: 'turn 3개 제거',
        },
      ];

      const log = createRequestLog({
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 4000,
        outputTokens: 300,
        maxTokens: 1000,
        shrinkSteps: steps,
        latencyMs: 1500,
      });

      expect(log.model).toBe('claude-sonnet-4-5-20250929');
      expect(log.inputTokens).toBe(4000);
      expect(log.outputTokens).toBe(300);
      expect(log.maxTokens).toBe(1000);
      expect(log.shrinkSteps).toEqual(steps);
      expect(log.latencyMs).toBe(1500);
    });
  });

  describe('estimateCost', () => {
    it('알려진 모델의 비용을 계산한다', () => {
      const cost = estimateCost('claude-sonnet-4-5-20250929', 1000, 500);

      // sonnet: input $3/1M, output $15/1M
      expect(cost).toBeDefined();
      expect(cost!.inputCostUsd).toBeCloseTo(0.003, 4);
      expect(cost!.outputCostUsd).toBeCloseTo(0.0075, 4);
      expect(cost!.totalCostUsd).toBeCloseTo(0.0105, 4);
    });

    it('알 수 없는 모델은 undefined를 반환한다', () => {
      const cost = estimateCost('unknown-model', 1000, 500);
      expect(cost).toBeUndefined();
    });
  });

  describe('logRequest', () => {
    it('console.log를 JSON 형태로 호출한다', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const log = createRequestLog({
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: 500,
        maxTokens: 1000,
        shrinkSteps: [],
        latencyMs: 200,
      });

      logRequest(log);

      expect(spy).toHaveBeenCalledTimes(1);
      const loggedArg = spy.mock.calls[0][0] as string;
      expect(loggedArg).toContain('[Claude]');
      const jsonPart = loggedArg.replace('[Claude] ', '');
      const parsed = JSON.parse(jsonPart);
      expect(parsed.requestId).toBe(log.requestId);

      spy.mockRestore();
    });
  });
});
