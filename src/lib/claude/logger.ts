import crypto from 'crypto';
import { ClaudeRequestLog, MODEL_PRICING, ShrinkStep } from './types';

interface CreateLogInput {
  model: string;
  inputTokens: number;
  outputTokens?: number;
  maxTokens: number;
  shrinkSteps: ShrinkStep[];
  latencyMs: number;
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): { inputCostUsd: number; outputCostUsd: number; totalCostUsd: number } | undefined {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return undefined;

  const inputCostUsd = (inputTokens / 1_000_000) * pricing.input;
  const outputCostUsd = (outputTokens / 1_000_000) * pricing.output;

  return {
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: inputCostUsd + outputCostUsd,
  };
}

export function createRequestLog(input: CreateLogInput): ClaudeRequestLog {
  const cost = input.outputTokens
    ? estimateCost(input.model, input.inputTokens, input.outputTokens)
    : undefined;

  return {
    requestId: crypto.randomUUID(),
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    maxTokens: input.maxTokens,
    estimatedCost: cost,
    shrinkSteps: input.shrinkSteps,
    latencyMs: input.latencyMs,
    timestamp: new Date().toISOString(),
  };
}

export function logRequest(log: ClaudeRequestLog): void {
  console.log(`[Claude] ${JSON.stringify(log)}`);
}
