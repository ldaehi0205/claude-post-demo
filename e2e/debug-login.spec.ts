import { test, expect } from '@playwright/test';

test('debug full login flow', async ({ page }) => {
  await page.goto('/login');

  // JavaScript hydration 대기 - 버튼이 활성화될 때까지
  // disabled 속성이 없는 버튼이 나타날 때까지 대기
  await page.waitForSelector('button:not([disabled])');
  // 추가 대기 (hydration 완료 보장)
  await page.waitForTimeout(500);

  // 아이디 입력
  await page.locator('input').nth(0).fill('testuser');
  console.log('Filled username');

  // 비밀번호 입력
  await page.locator('input').nth(1).fill('password123');
  console.log('Filled password');

  // 스크린샷 (버튼 클릭 전)
  await page.screenshot({ path: '/tmp/debug-before-click.png' });
  console.log('Screenshot before click saved');

  // 로그인 버튼 클릭 (네트워크 요청 대기)
  await Promise.all([
    page.waitForResponse(response =>
      response.url().includes('/api/auth/login') && response.status() === 200
    ),
    page.getByRole('button', { name: '로그인' }).click(),
  ]);
  console.log('Login API response received');

  // 리다이렉트 대기
  try {
    await page.waitForURL(/\/(posts)?$/, { timeout: 5000 });
    console.log('Redirected to:', page.url());
  } catch (e) {
    console.log('No redirect, current URL:', page.url());
  }

  // 스크린샷 (버튼 클릭 후)
  await page.screenshot({ path: '/tmp/debug-after-click.png' });
  console.log('Screenshot after click saved');

  // 로그아웃 버튼 확인
  const logoutBtn = page.getByRole('button', { name: '로그아웃' });
  if (await logoutBtn.isVisible()) {
    console.log('Logout button is visible - login successful');
  } else {
    console.log('Logout button not visible');
  }
});
