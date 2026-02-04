---
name: review-code
description: TypeScript와 Tailwind CSS 코드의 품질, 타입 안정성, 성능을 검토합니다. 게시판 프로젝트 규칙 준수를 확인합니다.
---

# 코드 리뷰 체크리스트

## TypeScript 규칙

- [ ] `any` 타입 사용 금지
- [ ] Props 인터페이스 정의
- [ ] 함수 반환 타입 명시 (필요시)
- [ ] null/undefined 처리

## React/Next.js 규칙

- [ ] 함수형 컴포넌트만 사용
- [ ] `'use client'` 최소한으로 사용
- [ ] 서버 컴포넌트 우선
- [ ] useState, useEffect 적절히 사용
- [ ] 불필요한 리렌더링 방지

## 프로젝트 구조 규칙

| 파일 종류   | 위치                          |
| ----------- | ----------------------------- |
| 페이지      | `src/app/`                    |
| API         | `src/app/api/`                |
| UI 컴포넌트 | `src/components/ui/`          |
| 레이아웃    | `src/components/layout/`      |
| 게시판      | `src/components/posts/`       |
| API 호출    | `src/apis/`                   |
| 훅          | `src/hooks/`                  |
| DB 접근     | `src/data/prisma.ts` 통해서만 |

## 금지 사항

- [ ] 컴포넌트에서 Prisma 직접 호출
- [ ] `components/ui/`에 비즈니스 로직
- [ ] `any` 타입 사용

## 보안

- [ ] 사용자 입력 검증
- [ ] SQL Injection 방지 (Prisma 사용)
- [ ] XSS 방지
- [ ] 인증 필요 API에 토큰 검증

## 인증/토큰 정책

- [ ] Access Token 60분 만료 설정
- [ ] Refresh Token HttpOnly 쿠키 저장
- [ ] 401 응답에 `code` 필드 포함 (`authorization`, `expired_token`, `invalid_token`)
- [ ] Axios interceptor에서 `expired_token` 시 자동 refresh
- [ ] Refresh Token Rotation 적용 (매 refresh 시 새 토큰 발급)
- [ ] 기존 Refresh Token revoke 처리
- [ ] Idle timeout (14일) / Absolute timeout (30일) 적용

## API 응답 형식

- [ ] 에러 응답에 `{ error, code }` 형식 사용
- [ ] 공통 에러 코드 준수 (`bad_request`, `authorization`, `invalid_token`, `expired_token`, `forbidden`, `not_found`)

## 성능

- [ ] 불필요한 API 호출 제거
- [ ] TanStack Query 캐싱 활용
- [ ] 이미지 최적화 (next/image)
- [ ] 번들 크기 최적화

## 스타일링

- [ ] Tailwind CSS 일관성
- [ ] 반응형 디자인
- [ ] 접근성 (aria 속성 등)

---

# 검증 방법

이 스킬이 호출되면 다음 순서로 검증을 수행합니다:

## 1. TypeScript 검증

```bash
# any 타입 사용 검색
grep -r ":\s*any" src/ --include="*.ts" --include="*.tsx"
```

## 2. 인증/토큰 정책 검증

| 검증 항목          | 확인 파일                           | 확인 내용                                                |
| ------------------ | ----------------------------------- | -------------------------------------------------------- |
| Access Token 만료  | `src/utils/jwt.ts`                  | `expiresIn: '60m'`                                       |
| Refresh Token 쿠키 | `src/app/api/auth/login/route.ts`   | `httpOnly: true`                                         |
| 401 응답 code 필드 | `src/app/api/**/*.ts`               | `code: 'expired_token'` 등                               |
| Axios interceptor  | `src/apis/client.ts`                | `expired_token` 분기 처리                                |
| Token Rotation     | `src/app/api/auth/refresh/route.ts` | `revoked: true` 설정                                     |
| Timeout 설정       | `src/utils/jwt.ts`                  | `REFRESH_TOKEN_IDLE_DAYS`, `REFRESH_TOKEN_ABSOLUTE_DAYS` |

## 3. API 응답 형식 검증

```bash
# code 필드 없는 에러 응답 검색
grep -r "status: 40" src/app/api/ --include="*.ts" -A 2 | grep -v "code:"
```

## 4. 빌드 테스트

```bash
npm run build
```

## 5. 결과 리포트

검증 완료 후 체크리스트를 [x] 또는 [ ] 로 업데이트하여 결과를 보고합니다.
