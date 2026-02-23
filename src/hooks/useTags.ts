'use client';

import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/apis/tags';

const TAGS_KEY = ['tags'];

/** 태그 목록 조회 훅 (postCount > 0인 태그만, 사용 빈도순) */
export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: tagsApi.getAll,
  });
}
