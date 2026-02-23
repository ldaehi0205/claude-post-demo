/**
 * 게시글 본문에서 #태그를 파싱하여 정규화된 태그 배열을 반환한다.
 *
 * 규칙:
 * - # 바로 뒤에 오는 문자열을 태그로 인식
 * - 공백/줄바꿈/구두점(. , ! ? ) ] })에서 종료
 * - 소문자로 정규화, 중복 제거
 * - ## 같은 마크다운 헤딩은 무시
 */

// 한글(가-힣, ㄱ-ㅎ) + 영문 + 숫자 + 점을 태그 문자로 허용
const TAG_REGEX = /(?:^|[\s([\]])#([a-zA-Z0-9\u3131-\u318E\uAC00-\uD7A3][a-zA-Z0-9\u3131-\u318E\uAC00-\uD7A3.]*)/g;

export function parseTagsFromContent(content: string): string[] {
  if (!content) return [];

  const tags: string[] = [];
  let match: RegExpExecArray | null;

  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(content)) !== null) {
    const tag = match[1].toLowerCase().replace(/\.+$/, '');
    if (tag) {
      tags.push(tag);
    }
  }

  return Array.from(new Set(tags));
}
