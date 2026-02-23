// ─── 공개 API ───
export { countInputTokens, setClient } from './token-counter';
export { shrinkToBudget } from './budget-manager';
export { buildRequest } from './request-builder';
export { callClaude } from './client';
export { createRequestLog, logRequest, estimateCost } from './logger';

// ─── 축약 전략 (개별 사용 가능) ───
export {
  shrinkHistory,
  shrinkDocuments,
  shrinkSystem,
  shrinkUserMessage,
} from './shrink-strategies';

// ─── 타입 ───
export type {
  ClaudePayload,
  TokenBudgetConfig,
  ShrinkOptions,
  ShrinkStep,
  ShrinkResult,
  TokenCountResult,
  ClaudeRequestBody,
  ClaudeRequestLog,
  ClaudeResponse,
  DocumentChunk,
  OutputGuide,
  MessageParam,
  ToolParam,
} from './types';

export { ShrinkStrategy, MODEL_PRICING } from './types';
