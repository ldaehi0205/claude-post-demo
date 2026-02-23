import Anthropic from '@anthropic-ai/sdk';
import type { ClaudePayload, TokenBudgetConfig, TokenCountResult } from './types';

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic();
  }
  return clientInstance;
}

/** 테스트 시 클라이언트 교체용 */
export function setClient(client: Anthropic): void {
  clientInstance = client;
}

/**
 * Token Counting API를 사용하여 입력 토큰 수를 정확히 측정한다.
 * 로컬 추정이 아닌, 실제 SDK의 countTokens를 호출한다.
 */
export async function countInputTokens(
  payload: ClaudePayload,
  config: TokenBudgetConfig,
): Promise<TokenCountResult> {
  const client = getClient();

  const params: Anthropic.Messages.MessageCountTokensParams = {
    model: payload.model,
    messages: payload.messages,
  };

  if (payload.system) {
    params.system = payload.system;
  }

  if (payload.tools && payload.tools.length > 0) {
    params.tools = payload.tools;
  }

  const result = await client.messages.countTokens(params);
  const inputTokens = result.input_tokens;
  const remainingBudget = config.inputTokenBudget - inputTokens - config.safetyMargin;

  return { inputTokens, remainingBudget };
}
