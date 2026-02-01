---
name: fix-auth
description: JWT 토큰, 인증 미들웨어, useAuth 훅 관련 버그를 진단하고 수정합니다. 로그인 안됨, 토큰 만료, 인증 에러 시 사용합니다.
---

# 인증 시스템 디버깅

## 게시판 인증 흐름

```
1. 로그인 → JWT 토큰 발급 (/api/auth/login)
2. 토큰 저장 → localStorage('accessToken')
3. API 요청 → Axios interceptor가 헤더에 토큰 추가
4. 서버 검증 → verifyToken으로 JWT 검증
```

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `src/utils/jwt.ts` | JWT 생성/검증 함수 |
| `src/hooks/useAuth.ts` | 인증 상태 관리 훅 |
| `src/apis/client.ts` | Axios interceptor |
| `src/app/api/auth/login/route.ts` | 로그인 API |
| `src/app/api/auth/me/route.ts` | 현재 사용자 조회 API |

## 체크리스트

### 1. 로그인 실패

- [ ] 이메일/비밀번호 확인
- [ ] bcrypt 비교 로직 확인
- [ ] JWT_SECRET 환경변수 설정 확인

### 2. 토큰 저장 안됨

- [ ] `localStorage.setItem('accessToken', token)` 호출 확인
- [ ] 브라우저 DevTools > Application > Local Storage 확인

### 3. API 401 에러

- [ ] Axios interceptor에서 토큰 헤더 추가 확인
- [ ] `Authorization: Bearer {token}` 형식 확인
- [ ] 토큰 만료 여부 확인

### 4. useAuth 항상 로그아웃 상태

- [ ] `/api/auth/me` 응답 확인
- [ ] 토큰 유효성 확인
- [ ] TanStack Query 캐시 확인

## 일반적인 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 로그인 후에도 로그아웃 상태 | 토큰 저장 안됨 | localStorage 키 확인 |
| 새로고침 시 로그아웃 | useAuth 초기화 문제 | 토큰 확인 로직 검토 |
| 게시글 작성 시 401 | 토큰 헤더 누락 | interceptor 확인 |
| 수정/삭제 시 403 | 권한 없음 (작성자 아님) | authorId 비교 로직 확인 |

## 디버깅 명령

```javascript
// 브라우저 콘솔에서 토큰 확인
localStorage.getItem('accessToken')

// 토큰 디코딩 (jwt.io 또는)
JSON.parse(atob(token.split('.')[1]))
```
