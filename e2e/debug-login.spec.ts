import { test, expect } from '@playwright/test';

test('debug full login flow', async ({ page }) => {
  await page.goto('/login');

  // 페이지 로드 대기
  await page.waitForSelector('input');

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

  // 잠시 대기
  await page.waitForTimeout(2000);

  // 현재 URL 확인
  console.log('Current URL:', page.url());

  // 스크린샷 (버튼 클릭 후)
  await page.screenshot({ path: '/tmp/debug-after-click.png' });
  console.log('Screenshot after click saved');

  // 에러 메시지 확인
  const errorMsg = page.getByText('아이디 또는 비밀번호가 올바르지 않습니다');
  if (await errorMsg.isVisible()) {
    console.log('Login error message is visible');
  } else {
    console.log('No login error message');
  }
});
