# Suggested Commands

## Development
- `npm install` - 의존성 설치
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드 (prisma generate 포함)
- `npm run start` - 프로덕션 서버 실행

## Testing
- `npm test` or `npm run test:unit` - Jest 단위/통합 테스트 실행
- `npm run test:e2e` - Playwright E2E 테스트 실행
- `npm run test:e2e:ui` - Playwright E2E 테스트 (UI 모드)

## Linting
- `npm run lint` - Next.js lint 실행

## Database
- `npx prisma generate` - Prisma 클라이언트 생성
- `npx prisma migrate dev` - 마이그레이션 실행
- `npx prisma studio` - Prisma Studio (DB GUI)

## Cache Management
- `rm -rf .next node_modules/.cache` - 캐시 삭제 (설정 변경/패키지 변경/원인 불명 오류 시)

## System Utils (macOS/Darwin)
- `git`, `ls`, `cd`, `grep`, `find` - 표준 유닉스 명령어 사용 가능
