import { countInputTokens } from './token-counter';
import { shrinkHistory, shrinkDocuments, shrinkSystem, shrinkUserMessage } from './shrink-strategies';
import {
  ShrinkStrategy,
  type ClaudePayload,
  type TokenBudgetConfig,
  type ShrinkOptions,
  type ShrinkResult,
  type ShrinkStep,
} from './types';

const DEFAULT_SHRINK_OPTIONS: Required<ShrinkOptions> = {
  maxSummaryTokens: 200,
  topK: 3,
  maxChunkChars: 2000,
};

/**
 * 예산 내로 페이로드를 축약한다.
 * 우선순위: A.히스토리 → B.문서 → C.시스템 → D.유저메시지
 * 각 단계마다 Token Counting API로 re-count하여 정확성을 보장한다.
 */
export async function shrinkToBudget(
  payload: ClaudePayload,
  config: TokenBudgetConfig,
  options?: ShrinkOptions,
): Promise<ShrinkResult> {
  const opts = { ...DEFAULT_SHRINK_OPTIONS, ...options };
  const shrinkSteps: ShrinkStep[] = [];
  let current = { ...payload };

  // 초기 토큰 측정
  let tokenResult = await countInputTokens(current, config);

  if (tokenResult.remainingBudget >= 0) {
    return { payload: current, shrinkSteps, finalTokens: tokenResult.inputTokens };
  }

  // ── 전략 A: 히스토리 정리 ──
  if (current.messages.length > 1) {
    const beforeTokens = tokenResult.inputTokens;
    // turn 단위로 점진적 제거 (한 번에 1 turn씩)
    let turnsToRemove = 1;
    while (tokenResult.remainingBudget < 0 && turnsToRemove < current.messages.length) {
      current = {
        ...current,
        messages: shrinkHistory(payload.messages, turnsToRemove),
      };
      tokenResult = await countInputTokens(current, config);
      turnsToRemove++;
    }

    shrinkSteps.push({
      strategy: ShrinkStrategy.HISTORY,
      beforeTokens,
      afterTokens: tokenResult.inputTokens,
      detail: `turn ${turnsToRemove - 1}개 제거`,
    });

    if (tokenResult.remainingBudget >= 0) {
      return { payload: current, shrinkSteps, finalTokens: tokenResult.inputTokens };
    }
  }

  // ── 전략 B: 문서 컨텍스트 슬라이싱 ──
  if (current.documents && current.documents.length > 0) {
    const beforeTokens = tokenResult.inputTokens;

    current = {
      ...current,
      documents: shrinkDocuments(current.documents, opts.topK, opts.maxChunkChars),
    };
    tokenResult = await countInputTokens(current, config);

    shrinkSteps.push({
      strategy: ShrinkStrategy.DOCUMENTS,
      beforeTokens,
      afterTokens: tokenResult.inputTokens,
      detail: `상위 ${opts.topK}개 유지, 최대 ${opts.maxChunkChars}자`,
    });

    if (tokenResult.remainingBudget >= 0) {
      return { payload: current, shrinkSteps, finalTokens: tokenResult.inputTokens };
    }
  }

  // ── 전략 C: 시스템 프롬프트 중복 제거 ──
  if (current.system) {
    const beforeTokens = tokenResult.inputTokens;

    current = {
      ...current,
      system: shrinkSystem(current.system),
    };
    tokenResult = await countInputTokens(current, config);

    shrinkSteps.push({
      strategy: ShrinkStrategy.SYSTEM,
      beforeTokens,
      afterTokens: tokenResult.inputTokens,
      detail: '시스템 프롬프트 중복 문장 제거',
    });

    if (tokenResult.remainingBudget >= 0) {
      return { payload: current, shrinkSteps, finalTokens: tokenResult.inputTokens };
    }
  }

  // ── 전략 D: 유저 메시지 구조적 요약 (최후 수단) ──
  {
    const beforeTokens = tokenResult.inputTokens;

    current = {
      ...current,
      messages: shrinkUserMessage(current.messages),
    };
    tokenResult = await countInputTokens(current, config);

    shrinkSteps.push({
      strategy: ShrinkStrategy.USER_MESSAGE,
      beforeTokens,
      afterTokens: tokenResult.inputTokens,
      detail: '유저 메시지 구조적 요약',
    });
  }

  return { payload: current, shrinkSteps, finalTokens: tokenResult.inputTokens };
}
