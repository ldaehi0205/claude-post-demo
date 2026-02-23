import {
  shrinkHistory,
  shrinkDocuments,
  shrinkSystem,
  shrinkUserMessage,
} from '../shrink-strategies';
import type { MessageParam, DocumentChunk } from '../types';

describe('shrink-strategies', () => {
  describe('shrinkHistory', () => {
    it('오래된 turn부터 제거한다 (첫 번째 user 메시지는 보존)', () => {
      const messages: MessageParam[] = [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Second question' },
        { role: 'assistant', content: 'Second answer' },
        { role: 'user', content: 'Current question' },
      ];

      const result = shrinkHistory(messages, 1);

      // turn 1개 제거 → 첫 user/assistant 쌍 제거, 나머지 유지
      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ role: 'user', content: 'Second question' });
      expect(result[result.length - 1]).toEqual({ role: 'user', content: 'Current question' });
    });

    it('마지막 유저 메시지는 항상 보존한다', () => {
      const messages: MessageParam[] = [
        { role: 'user', content: 'Old message' },
        { role: 'assistant', content: 'Old reply' },
        { role: 'user', content: 'Current message' },
      ];

      const result = shrinkHistory(messages, 10);

      // 모든 히스토리 제거해도 마지막 유저 메시지는 남김
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ role: 'user', content: 'Current message' });
    });

    it('메시지가 1개면 그대로 반환한다', () => {
      const messages: MessageParam[] = [{ role: 'user', content: 'Only message' }];
      const result = shrinkHistory(messages, 5);
      expect(result).toEqual(messages);
    });
  });

  describe('shrinkDocuments', () => {
    it('relevanceScore 기준 상위 K개만 유지한다', () => {
      const docs: DocumentChunk[] = [
        { content: 'Low relevance doc', relevanceScore: 0.3 },
        { content: 'High relevance doc', relevanceScore: 0.9 },
        { content: 'Medium relevance doc', relevanceScore: 0.6 },
        { content: 'Highest relevance doc', relevanceScore: 0.95 },
      ];

      const result = shrinkDocuments(docs, 2);

      expect(result.length).toBe(2);
      expect(result[0].relevanceScore).toBe(0.95);
      expect(result[1].relevanceScore).toBe(0.9);
    });

    it('maxChunkChars로 각 문서의 길이를 제한한다', () => {
      const docs: DocumentChunk[] = [
        { content: 'A'.repeat(1000), relevanceScore: 0.9 },
        { content: 'B'.repeat(500), relevanceScore: 0.8 },
      ];

      const result = shrinkDocuments(docs, 10, 200);

      expect(result[0].content.length).toBe(200);
      expect(result[1].content.length).toBe(200);
    });

    it('K가 문서 수보다 크면 모든 문서를 반환한다', () => {
      const docs: DocumentChunk[] = [
        { content: 'doc1', relevanceScore: 0.9 },
        { content: 'doc2', relevanceScore: 0.8 },
      ];

      const result = shrinkDocuments(docs, 10);
      expect(result.length).toBe(2);
    });
  });

  describe('shrinkSystem', () => {
    it('중복 문장을 제거한다', () => {
      const system = '규칙1: 한국어로 답변. 규칙2: 간결하게. 규칙1: 한국어로 답변.';
      const result = shrinkSystem(system);

      expect(result).toBe('규칙1: 한국어로 답변. 규칙2: 간결하게.');
    });

    it('빈 문자열은 빈 문자열을 반환한다', () => {
      expect(shrinkSystem('')).toBe('');
    });

    it('중복이 없으면 원문 그대로 반환한다', () => {
      const system = '규칙1: 한국어로 답변. 규칙2: 간결하게.';
      const result = shrinkSystem(system);
      expect(result).toBe(system);
    });
  });

  describe('shrinkUserMessage', () => {
    it('마지막 유저 메시지를 구조적 요약 형태로 변환한다', () => {
      const messages: MessageParam[] = [
        {
          role: 'user',
          content:
            '이 코드를 리뷰해주세요. TypeScript로 작성되어 있고, 성능이 중요합니다. 코드는 다음과 같습니다: function add(a: number, b: number) { return a + b; } 그리고 이 함수는 반복적으로 호출될 수 있습니다. 메모리 누수가 없는지 확인해주세요. 또한 에러 핸들링도 검토해주세요.',
        },
      ];

      const result = shrinkUserMessage(messages);
      const lastMessage = result[result.length - 1];

      expect(lastMessage.role).toBe('user');
      expect(typeof lastMessage.content).toBe('string');
      // 축약 후 원문보다 짧아야 함
      expect((lastMessage.content as string).length).toBeLessThan(
        (messages[0].content as string).length,
      );
    });

    it('content가 배열 형태(ContentBlock[])인 경우도 처리한다', () => {
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: [
            { type: 'text' as const, text: '이 코드를 리뷰해주세요. 성능 최적화가 필요합니다. 자세한 분석을 부탁합니다. 특히 메모리 사용량과 CPU 사용량을 확인해주세요.' },
          ],
        },
      ];

      const result = shrinkUserMessage(messages);
      expect(result.length).toBe(1);
    });
  });
});
