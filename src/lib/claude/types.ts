import Anthropic from '@anthropic-ai/sdk';

// ─── SDK 타입 re-export ───
export type MessageParam = Anthropic.MessageParam;
export type ContentBlockParam = Anthropic.ContentBlockParam;
export type ToolParam = Anthropic.Tool;
export type TextBlockParam = Anthropic.TextBlockParam;
export type ToolUseBlockParam = Anthropic.ToolUseBlockParam;
export type ToolResultBlockParam = Anthropic.ToolResultBlockParam;

// ─── 축약 전략 ───
export enum ShrinkStrategy {
  HISTORY = 'HISTORY',
  DOCUMENTS = 'DOCUMENTS',
  SYSTEM = 'SYSTEM',
  USER_MESSAGE = 'USER_MESSAGE',
}

// ─── 축약 단계 기록 ───
export interface ShrinkStep {
  strategy: ShrinkStrategy;
  beforeTokens: number;
  afterTokens: number;
  detail: string; // 예: "오래된 turn 3개 제거", "문서 5→2개 축소"
}

// ─── RAG 문서 청크 ───
export interface DocumentChunk {
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

// ─── 출력 가이드 (응답 형식 제약) ───
export interface OutputGuide {
  maxBullets?: number;
  disableCode?: boolean;
  disableTable?: boolean;
  customInstruction?: string;
}

// ─── 토큰 예산 설정 ───
export interface TokenBudgetConfig {
  inputTokenBudget: number;   // 예: 8_000
  outputTokenBudget: number;  // 예: 1_000 (= max_tokens)
  safetyMargin: number;       // 예: 300
}

// ─── 축약 파라미터 ───
export interface ShrinkOptions {
  /** 히스토리 요약 시 최대 토큰 수 */
  maxSummaryTokens?: number;
  /** 문서 상위 K개만 유지 */
  topK?: number;
  /** 각 문서 청크 최대 문자 수 */
  maxChunkChars?: number;
}

// ─── 사용자 입력 페이로드 ───
export interface ClaudePayload {
  model: string;
  system?: string;
  messages: MessageParam[];
  tools?: ToolParam[];
  documents?: DocumentChunk[];
  outputGuide?: OutputGuide;
}

// ─── 토큰 카운트 결과 ───
export interface TokenCountResult {
  inputTokens: number;
  remainingBudget: number; // inputBudget - inputTokens - margin
}

// ─── 축약 결과 ───
export interface ShrinkResult {
  payload: ClaudePayload;
  shrinkSteps: ShrinkStep[];
  finalTokens: number;
}

// ─── SDK 요청 바디 (buildRequest 결과) ───
export interface ClaudeRequestBody {
  model: string;
  max_tokens: number;
  messages: MessageParam[];
  system?: string;
  tools?: ToolParam[];
}

// ─── 요청 로그 ───
export interface ClaudeRequestLog {
  requestId: string;
  model: string;
  inputTokens: number;
  outputTokens?: number;
  maxTokens: number;
  estimatedCost?: {
    inputCostUsd: number;
    outputCostUsd: number;
    totalCostUsd: number;
  };
  shrinkSteps: ShrinkStep[];
  latencyMs: number;
  timestamp: string;
}

// ─── callClaude 응답 ───
export interface ClaudeResponse {
  content: Anthropic.ContentBlock[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stopReason: string | null;
  log: ClaudeRequestLog;
}

// ─── 모델별 토큰 단가 (USD per 1M tokens) ───
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4 },
};
