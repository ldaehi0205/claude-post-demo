import Anthropic from '@anthropic-ai/sdk';
import { countInputTokens, setClient } from './token-counter';
import { shrinkToBudget } from './budget-manager';
import { buildRequest } from './request-builder';
import { createRequestLog, logRequest } from './logger';
import type {
  ClaudePayload,
  TokenBudgetConfig,
  ShrinkOptions,
  ClaudeResponse,
  ShrinkStep,
} from './types';

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic();
    // token-counter도 동일 클라이언트 사용
    setClient(clientInstance);
  }
  return clientInstance;
}

/**
 * Claude API 호출 전체 파이프라인:
 * 1. 토큰 카운트 → 2. 예산 초과 시 축약 → 3. 요청 빌드 → 4. API 호출 → 5. 로깅
 */
export async function callClaude(
  payload: ClaudePayload,
  config: TokenBudgetConfig,
  shrinkOptions?: ShrinkOptions,
): Promise<ClaudeResponse> {
  const client = getClient();
  const startTime = Date.now();
  let shrinkSteps: ShrinkStep[] = [];

  // 1. 토큰 카운트 + 필요 시 축약
  const tokenResult = await countInputTokens(payload, config);
  let finalPayload = payload;

  if (tokenResult.remainingBudget < 0) {
    const shrinkResult = await shrinkToBudget(payload, config, shrinkOptions);
    finalPayload = shrinkResult.payload;
    shrinkSteps = shrinkResult.shrinkSteps;
  }

  // 2. SDK 요청 바디 생성
  const requestBody = buildRequest(finalPayload, config);

  // 3. API 호출
  const message = await client.messages.create(requestBody);

  const latencyMs = Date.now() - startTime;

  // 4. 로깅
  const log = createRequestLog({
    model: payload.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    maxTokens: config.outputTokenBudget,
    shrinkSteps,
    latencyMs,
  });

  logRequest(log);

  return {
    content: message.content,
    usage: message.usage,
    stopReason: message.stop_reason,
    log,
  };
}
