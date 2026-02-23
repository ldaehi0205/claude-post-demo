/**
 * Token Budget Manager 동작 확인 스크립트
 * 실행: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-claude.ts
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig(); // .env 파일 로드

import { callClaude, countInputTokens } from '../src/lib/claude';
import type { ClaudePayload, TokenBudgetConfig } from '../src/lib/claude';

const config: TokenBudgetConfig = {
  inputTokenBudget: 8_000,
  outputTokenBudget: 1_000,
  safetyMargin: 300,
};

const payload: ClaudePayload = {
  model: 'claude-sonnet-4-5-20250929',
  system: '당신은 한국어 게시판 도우미입니다. 간결하게 답변하세요.',
  messages: [
    { role: 'user', content: '안녕하세요! 게시판 서비스에 대해 한 줄로 설명해주세요.' },
  ],
};

async function main() {
  console.log('=== 1. 토큰 카운트 ===');
  const tokenResult = await countInputTokens(payload, config);
  console.log(`입력 토큰: ${tokenResult.inputTokens}`);
  console.log(`남은 예산: ${tokenResult.remainingBudget}`);

  console.log('\n=== 2. callClaude 호출 ===');
  const response = await callClaude(payload, config);

  console.log('\n=== 3. 응답 ===');
  for (const block of response.content) {
    if (block.type === 'text') {
      console.log(block.text);
    }
  }

  console.log('\n=== 4. 사용량 ===');
  console.log(`입력 토큰: ${response.usage.input_tokens}`);
  console.log(`출력 토큰: ${response.usage.output_tokens}`);
  console.log(`종료 사유: ${response.stopReason}`);

  if (response.log.estimatedCost) {
    console.log(`예상 비용: $${response.log.estimatedCost.totalCostUsd.toFixed(6)}`);
  }
}

main().catch(console.error);
