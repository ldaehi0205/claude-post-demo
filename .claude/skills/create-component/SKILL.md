---
name: create-component
description: Next.js 14 TypeScript 함수형 컴포넌트를 생성합니다. 게시판의 UI 컴포넌트, 레이아웃 컴포넌트, 게시판 컴포넌트를 만들 때 사용합니다.
argument-hint: [component-name] [type: ui|layout|posts]
---

# Next.js 14 컴포넌트 생성

게시판 프로젝트 규칙에 따라 새로운 TypeScript 함수형 컴포넌트를 생성합니다.

## 인자

- `$0`: 컴포넌트 이름 (예: PostCard, Header)
- `$1`: 타입 (`ui`, `layout`, `posts` 중 하나)

## 파일 위치

| 타입   | 경로                           |
| ------ | ------------------------------ |
| ui     | `src/components/ui/$0.tsx`     |
| layout | `src/components/layout/$0.tsx` |
| posts  | `src/components/posts/$0.tsx`  |

## 컴포넌트 규칙

- **함수형 컴포넌트만** 사용
- Props 인터페이스 정의
- Tailwind CSS로 스타일링
- `any` 타입 금지
- `/posts` 는 서버 컴포넌트로 작성한다.

## 클라이언트 컴포넌트 템플릿

```typescript
'use client';

import React from 'react';

interface $0Props {
  // Props 정의
}

export function $0({ }: $0Props) {
  return (
    <div>
      {/* 내용 */}
    </div>
  );
}
```

## 서버 컴포넌트 템플릿

```typescript
interface $0Props {
  // Props 정의
}

export function $0({ }: $0Props) {
  return (
    <div>
      {/* 내용 */}
    </div>
  );
}
```

## 사용 예시

```
/create-component PostCard posts
/create-component Button ui
/create-component Footer layout
```
