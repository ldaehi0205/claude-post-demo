import { test, expect } from '@playwright/test';

test('debug full login flow', async ({ page }) => {
  // 브라우저 콘솔 로그 수집
  page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Browser error:', err.message));

  // 네트워크 요청 실패 로그
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url(), request.failure()?.errorText);
  });

  // 페이지 로드 대기 (networkidle로 JavaScript 로드 완료 대기)
  await page.goto('/login', { waitUntil: 'networkidle' });

  // React hydration 완료 대기
  await page.waitForFunction(() => {
    // 입력 필드가 React에 의해 controlled 되는지 확인
    const input = document.querySelector('input');
    return input && input.value !== undefined;
  });

  // 추가 대기 (hydration 완료 보장)
  await page.waitForTimeout(1000);

  console.log('Page loaded and hydrated');

  // 아이디 입력
  await page.locator('input').nth(0).fill('testuser');
  console.log('Filled username');

  // 비밀번호 입력
  await page.locator('input').nth(1).fill('password123');
  console.log('Filled password');

  // 스크린샷 (버튼 클릭 전)
  await page.screenshot({ path: '/tmp/debug-before-click.png' });
  console.log('Screenshot before click saved');

  // 로그인 버튼 클릭
  await page.getByRole('button', { name: '로그인' }).click();
  console.log('Clicked login button');

  // 리다이렉트 또는 로그아웃 버튼 대기
  try {
    await Promise.race([
      page.waitForURL(/\/(posts)?$/, { timeout: 10000 }),
      page.waitForSelector('button:has-text("로그아웃")', { timeout: 10000 }),
    ]);
    console.log('Login completed, current URL:', page.url());
  } catch (e) {
    console.log('Login timeout, current URL:', page.url());
    // 스크린샷
    await page.screenshot({ path: '/tmp/debug-login-timeout.png' });
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
