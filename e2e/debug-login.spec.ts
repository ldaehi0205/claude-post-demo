import { test, expect } from '@playwright/test';

test('로그인 디버깅', async ({ page }) => {
  await page.goto('/login');
  
  // 페이지 로드 대기
  await page.waitForLoadState('networkidle');
  
  // input 요소 개수 확인
  const inputs = await page.locator('input').count();
  console.log('Input count:', inputs);
  
  // 첫 번째 input에 직접 입력
  await page.locator('input').first().fill('testuser');
  await page.locator('input').nth(1).fill('password123');
  
  // 스크린샷
  await page.screenshot({ path: 'debug-screenshot.png' });
  
  // 로그인 버튼 클릭
  await page.getByRole('button', { name: '로그인' }).click();
  
  // 리다이렉트 대기
  await page.waitForURL(/\/(posts)?$/, { timeout: 10000 });
  
  console.log('Login successful, URL:', page.url());
});
