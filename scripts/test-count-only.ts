/**
 * Token Counting API만 테스트 (무료, Claude 호출 없음)
 * 실행: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/test-count-only.ts
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

async function main() {
  // 1. 간단한 메시지
  const result1 = await client.messages.countTokens({
    model: 'claude-sonnet-4-5-20250929',
    messages: [{ role: 'user', content: '안녕하세요' }],
  });
  console.log('=== 간단한 메시지 ===');
  console.log(`입력 토큰: ${result1.input_tokens}`);

  // 2. 시스템 프롬프트 + 메시지
  const result2 = await client.messages.countTokens({
    model: 'claude-sonnet-4-5-20250929',
    system: '당신은 한국어 게시판 도우미입니다. 간결하게 답변하세요.',
    messages: [{ role: 'user', content: '이 게시글을 요약해주세요.' }],
  });
  console.log('\n=== 시스템 + 메시지 ===');
  console.log(`입력 토큰: ${result2.input_tokens}`);

  // 3. 대화 히스토리 포함
  const result3 = await client.messages.countTokens({
    model: 'claude-sonnet-4-5-20250929',
    messages: [
      { role: 'user', content: '첫 번째 질문입니다.' },
      { role: 'assistant', content: '첫 번째 답변입니다.' },
      { role: 'user', content: '두 번째 질문입니다.' },
      { role: 'assistant', content: '두 번째 답변입니다.' },
      { role: 'user', content: '세 번째 질문입니다.' },
    ],
  });
  console.log('\n=== 대화 히스토리 (5개 메시지) ===');
  console.log(`입력 토큰: ${result3.input_tokens}`);

  // 4. 도구 정의 포함
  const result4 = await client.messages.countTokens({
    model: 'claude-sonnet-4-5-20250929',
    messages: [{ role: 'user', content: '서울 날씨 알려줘' }],
    tools: [{
      name: 'get_weather',
      description: '특정 도시의 현재 날씨 정보를 조회합니다.',
      input_schema: {
        type: 'object' as const,
        properties: {
          city: { type: 'string', description: '도시명' },
        },
        required: ['city'],
      },
    }],
  });
  console.log('\n=== 도구 정의 포함 ===');
  console.log(`입력 토큰: ${result4.input_tokens}`);

  // 5. 비교 요약
  console.log('\n=== 비교 요약 ===');
  console.log(`간단한 메시지:      ${result1.input_tokens} 토큰`);
  console.log(`시스템 + 메시지:     ${result2.input_tokens} 토큰`);
  console.log(`대화 히스토리 5개:   ${result3.input_tokens} 토큰`);
  console.log(`도구 정의 포함:      ${result4.input_tokens} 토큰`);
}

main().catch(console.error);
