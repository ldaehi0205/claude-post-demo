/**
 * 서버 사이드에서 앱의 Base URL을 반환합니다.
 *
 * 우선순위:
 * 1. NEXT_PUBLIC_BASE_URL 환경변수 (명시적 설정)
 * 2. VERCEL_URL (Vercel 자동 제공, 프리뷰 배포 포함)
 * 3. localhost:3000 (로컬 개발 폴백)
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}
