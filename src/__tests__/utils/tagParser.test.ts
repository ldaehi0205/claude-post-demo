import { parseTagsFromContent } from '@/utils/tagParser';

describe('parseTagsFromContent', () => {
  it('빈 문자열에서 빈 배열을 반환해야 한다', () => {
    expect(parseTagsFromContent('')).toEqual([]);
  });

  it('태그가 없는 글에서 빈 배열을 반환해야 한다', () => {
    expect(parseTagsFromContent('태그 없는 글')).toEqual([]);
  });

  it('단일 태그를 파싱해야 한다', () => {
    expect(parseTagsFromContent('#React')).toEqual(['react']);
  });

  it('대소문자 중복 태그를 1개로 처리해야 한다', () => {
    expect(parseTagsFromContent('#React #react #REACT')).toEqual(['react']);
  });

  it('여러 태그를 파싱해야 한다', () => {
    expect(parseTagsFromContent('#React #Next.js 공부')).toEqual([
      'react',
      'next.js',
    ]);
  });

  it('구두점으로 태그가 종료되어야 한다', () => {
    expect(parseTagsFromContent('#React, #Vue! #Svelte?')).toEqual([
      'react',
      'vue',
      'svelte',
    ]);
  });

  it('한글 태그를 파싱해야 한다', () => {
    expect(parseTagsFromContent('#한글태그 #english')).toEqual([
      '한글태그',
      'english',
    ]);
  });

  it('# 뒤에 공백이 있으면 파싱하지 않아야 한다', () => {
    expect(parseTagsFromContent('# 공백')).toEqual([]);
  });

  it('마크다운 헤딩(##)을 태그로 인식하지 않아야 한다', () => {
    expect(parseTagsFromContent('## 마크다운 제목')).toEqual([]);
  });

  it('줄바꿈으로 구분된 태그를 파싱해야 한다', () => {
    expect(parseTagsFromContent('#tag1\n#tag2')).toEqual(['tag1', 'tag2']);
  });

  it('숫자 태그를 파싱해야 한다', () => {
    expect(parseTagsFromContent('#2024')).toEqual(['2024']);
  });

  it('예시 입력을 올바르게 파싱해야 한다', () => {
    expect(parseTagsFromContent('오늘은 #React #react #Next.js 공부')).toEqual([
      'react',
      'next.js',
    ]);
  });

  it('괄호로 태그가 종료되어야 한다', () => {
    expect(parseTagsFromContent('(#React) [#Vue]')).toEqual([
      'react',
      'vue',
    ]);
  });

  it('문자열 끝에 있는 태그를 파싱해야 한다', () => {
    expect(parseTagsFromContent('내용 #React')).toEqual(['react']);
  });
});
