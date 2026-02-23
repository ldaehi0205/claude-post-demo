import type {
  ClaudePayload,
  ClaudeRequestBody,
  TokenBudgetConfig,
  OutputGuide,
  MessageParam,
} from './types';

/**
 * OutputGuide를 시스템 프롬프트 지시문으로 변환한다.
 */
function buildOutputGuideInstruction(guide: OutputGuide): string {
  const parts: string[] = [];

  if (guide.maxBullets) {
    parts.push(`- 불릿 포인트는 ${guide.maxBullets}개 이하로 제한`);
  }
  if (guide.disableCode) {
    parts.push('- 코드 블록 사용 금지');
  }
  if (guide.disableTable) {
    parts.push('- 표(table) 사용 금지');
  }
  if (guide.customInstruction) {
    parts.push(`- ${guide.customInstruction}`);
  }

  return `\n[출력 형식 제약]\n${parts.join('\n')}`;
}

/**
 * documents를 마지막 유저 메시지에 컨텍스트 블록으로 병합한다.
 */
function mergeDocuments(messages: MessageParam[], documents: ClaudePayload['documents']): MessageParam[] {
  if (!documents || documents.length === 0) return messages;

  const result = [...messages];
  const lastIdx = result.length - 1;

  if (lastIdx < 0 || result[lastIdx].role !== 'user') return result;

  const docContext = documents
    .map((doc, i) => `<document index="${i + 1}">\n${doc.content}\n</document>`)
    .join('\n\n');

  const originalContent =
    typeof result[lastIdx].content === 'string'
      ? result[lastIdx].content
      : JSON.stringify(result[lastIdx].content);

  result[lastIdx] = {
    role: 'user',
    content: `<context>\n${docContext}\n</context>\n\n${originalContent}`,
  };

  return result;
}

/**
 * ClaudePayload를 SDK 요청 바디로 변환한다.
 * - documents → 마지막 유저 메시지에 병합
 * - outputGuide → system에 추가
 * - max_tokens → outputTokenBudget으로 강제 제한
 */
export function buildRequest(payload: ClaudePayload, config: TokenBudgetConfig): ClaudeRequestBody {
  // 1. 문서 병합
  const messages = mergeDocuments(payload.messages, payload.documents);

  // 2. 시스템 프롬프트 + 출력 가이드
  let system = payload.system;
  if (payload.outputGuide) {
    const guideInstruction = buildOutputGuideInstruction(payload.outputGuide);
    system = system ? `${system}${guideInstruction}` : guideInstruction;
  }

  // 3. 요청 바디 조립
  const body: ClaudeRequestBody = {
    model: payload.model,
    max_tokens: config.outputTokenBudget,
    messages,
  };

  if (system) {
    body.system = system;
  }

  if (payload.tools && payload.tools.length > 0) {
    body.tools = payload.tools;
  }

  return body;
}
