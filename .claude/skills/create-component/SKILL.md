---
name: create-component
description: Next.js 14 TypeScript 함수형 컴포넌트를 생성합니다. UI 컴포넌트, 레이아웃 컴포넌트, 서버 컴포넌트, 클라이언트 컴포넌트를 만들 때 사용합니다.
argument-hint: '[component-name] [type: ui|layout|posts]'
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
- 초기 데이터 패칭은 반드시 Server Component에서 수행한다.
- 재사용 가능하며 비즈니스 로직이 없는 컴포넌트는 /components 디렉토리 하위에 위치한다.
- 비즈니스 로직이 포함된 Client Component는 /app 하위의 기능(페이지) 단위 디렉토리에 위치한다.
- 컴포넌트는 기능 또는 역할 단위의 폴더로 분리한다.
- 여러 페이지에서 공통으로 재사용되는 atomic 컴포넌트는 /components/ui에 작성한다.

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
