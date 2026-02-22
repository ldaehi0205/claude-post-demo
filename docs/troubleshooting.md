# 캐시 관리 및 트러블슈팅

## Next.js 캐시 관리

Next.js의 `.next` 캐시와 `node_modules/.cache`는 설정 변경 시 오래된 모듈 정보를 유지하여 런타임 오류를 발생시킬 수 있다.

### 캐시 삭제가 필요한 경우

다음 상황에서는 **반드시** 캐시를 삭제한다:

1. `next.config.js` 설정 변경 시
2. ESM 모듈 관련 설정 변경 시 (`transpilePackages`, `serverComponentsExternalPackages`)
3. dynamic import 패턴 변경 시
4. webpack 관련 설정 변경 시
5. 패키지 추가/삭제/버전 변경 시
6. 원인 불명의 런타임 오류 발생 시

### 캐시 삭제 명령어

```bash
# 기본 캐시 삭제
rm -rf .next

# 전체 캐시 삭제 (권장)
rm -rf .next node_modules/.cache

# 캐시 삭제 후 재시작
rm -rf .next node_modules/.cache && npm run dev
```

### 주요 오류와 해결법

| 오류 메시지                                             | 원인                                      | 해결                                                |
| ------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| `missing required error components`                     | error.tsx/global-error.tsx 누락 또는 캐시 | 파일 생성 + 캐시 삭제                               |
| `__webpack_modules__[moduleId] is not a function`       | transpilePackages 설정 충돌               | `serverComponentsExternalPackages` 사용 + 캐시 삭제 |
| `Loading chunk failed (undefined)`                      | dynamic import 경로 해석 실패             | default export 사용 + 캐시 삭제                     |
| `Cannot read properties of null (reading 'useContext')` | React context 초기화 실패                 | 캐시 삭제 + 서버 재시작                             |

### ESM 모듈 사용 시 권장 설정

`react-markdown` 등 ESM 모듈 사용 시:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['react-markdown', 'remark-gfm'],
  },
};
```

```typescript
// dynamic import는 default export 사용
const Component = dynamic(() => import('./Component'), {
  ssr: false,
  loading: () => <p>로딩 중...</p>,
});
```
