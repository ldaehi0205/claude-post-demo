import type { MessageParam, DocumentChunk } from './types';

/**
 * 전략 A: 대화 히스토리 정리
 * 오래된 turn(user+assistant 쌍)부터 제거한다.
 * 마지막 유저 메시지는 항상 보존한다.
 *
 * @param messages - 현재 메시지 배열
 * @param turnsToRemove - 제거할 turn 수
 * @returns 축약된 메시지 배열
 */
export function shrinkHistory(messages: MessageParam[], turnsToRemove: number): MessageParam[] {
  if (messages.length <= 1) return [...messages];

  // 마지막 유저 메시지 인덱스 찾기
  let lastUserIdx = messages.length - 1;
  while (lastUserIdx >= 0 && messages[lastUserIdx].role !== 'user') {
    lastUserIdx--;
  }

  // turn 단위로 그룹핑 (user + assistant = 1 turn)
  const turns: MessageParam[][] = [];
  let currentTurn: MessageParam[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user' && currentTurn.length > 0) {
      turns.push(currentTurn);
      currentTurn = [];
    }
    currentTurn.push(msg);
  }
  if (currentTurn.length > 0) {
    turns.push(currentTurn);
  }

  // 마지막 turn(현재 질문)은 항상 보존
  const removable = turns.slice(0, -1);
  const lastTurn = turns[turns.length - 1];
  const actualRemove = Math.min(turnsToRemove, removable.length);
  const remaining = removable.slice(actualRemove);

  return [...remaining.flat(), ...lastTurn];
}

/**
 * 전략 B: 문서 컨텍스트 슬라이싱
 * relevanceScore 기준 상위 K개만 유지하고, 각 chunk의 길이를 제한한다.
 *
 * @param documents - 문서 청크 배열
 * @param topK - 유지할 상위 문서 수
 * @param maxChunkChars - 각 문서의 최대 문자 수
 * @returns 축약된 문서 배열
 */
export function shrinkDocuments(
  documents: DocumentChunk[],
  topK: number,
  maxChunkChars?: number,
): DocumentChunk[] {
  const sorted = [...documents].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const sliced = sorted.slice(0, topK);

  if (!maxChunkChars) return sliced;

  return sliced.map(doc => ({
    ...doc,
    content: doc.content.slice(0, maxChunkChars),
  }));
}

/**
 * 전략 C: 시스템 프롬프트 중복 제거
 * 문장 단위로 분리하여 중복을 제거한다. 의미(규칙)는 보존한다.
 *
 * @param system - 시스템 프롬프트
 * @returns 중복 제거된 시스템 프롬프트
 */
export function shrinkSystem(system: string): string {
  if (!system) return '';

  // 문장 단위 분리 (마침표/느낌표/물음표 기준)
  const sentences = system
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const sentence of sentences) {
    if (!seen.has(sentence)) {
      seen.add(sentence);
      unique.push(sentence);
    }
  }

  return unique.join(' ');
}

/**
 * 전략 D: 유저 메시지 구조적 요약 (최후 수단)
 * 마지막 유저 메시지를 "의도 + 제약 + 입력 데이터" 형태로 축약한다.
 * 원문의 의미를 보존하면서 길이를 줄인다.
 *
 * @param messages - 메시지 배열
 * @returns 마지막 유저 메시지가 축약된 메시지 배열
 */
export function shrinkUserMessage(messages: MessageParam[]): MessageParam[] {
  if (messages.length === 0) return [];

  const result = [...messages];
  const lastIdx = result.length - 1;
  const lastMsg = result[lastIdx];

  if (lastMsg.role !== 'user') return result;

  let text: string;
  if (typeof lastMsg.content === 'string') {
    text = lastMsg.content;
  } else if (Array.isArray(lastMsg.content)) {
    // ContentBlock[]에서 text 추출
    text = lastMsg.content
      .filter((block): block is { type: 'text'; text: string } =>
        typeof block === 'object' && 'type' in block && block.type === 'text'
      )
      .map(block => block.text)
      .join(' ');
  } else {
    return result;
  }

  // 구조적 요약: 문장을 분리하고 핵심만 추출
  const sentences = text.split(/[.。!?]\s*/).filter(Boolean);
  if (sentences.length <= 2) {
    result[lastIdx] = { role: 'user', content: text };
    return result;
  }

  // 첫 문장(의도) + 키워드 추출
  const intent = sentences[0];
  const keywords = sentences
    .slice(1)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      // 긴 문장은 앞 30자로 축약
      return s.length > 30 ? s.slice(0, 30) + '...' : s;
    });

  const summarized = `${intent}. [요약 키워드: ${keywords.join(', ')}]`;
  result[lastIdx] = { role: 'user', content: summarized };

  return result;
}
