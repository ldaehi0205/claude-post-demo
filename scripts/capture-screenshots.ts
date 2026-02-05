import { chromium, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './screenshots';

const TEST_USER = {
  userID: 'testuser',
  password: 'password123',
};

async function fillInput(page: Page, index: number, value: string) {
  await page.locator('input').nth(index).fill(value);
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input');
  await fillInput(page, 0, TEST_USER.userID);
  await fillInput(page, 1, TEST_USER.password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForSelector('button:has-text("로그아웃")', { timeout: 10000 });
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('📸 스크린샷 캡처 시작...\n');

  // 1. 로그인 페이지 (비로그인 상태)
  console.log('1. 로그인 페이지');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });

  // 2. 회원가입 페이지
  console.log('2. 회원가입 페이지');
  await page.goto(`${BASE_URL}/register`);
  await page.waitForSelector('input');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-register-page.png`, fullPage: true });

  // 로그인
  console.log('\n🔐 로그인 중...');
  await login(page);
  console.log('✓ 로그인 완료\n');

  // 3. 게시글 목록 (홈)
  console.log('3. 게시글 목록 페이지');
  await page.goto(`${BASE_URL}/posts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-posts-list.png`, fullPage: true });

  // 4. 게시글 작성 페이지
  console.log('4. 게시글 작성 페이지');
  await page.goto(`${BASE_URL}/posts/new`);
  await page.waitForSelector('input');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-post-create.png`, fullPage: true });

  // 5. 게시글 상세 페이지
  console.log('5. 게시글 상세 페이지');
  await page.goto(`${BASE_URL}/posts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  // 게시글 링크 선택 (숫자 ID가 포함된 링크만 - /posts/숫자)
  const postLinks = page.locator('a[href^="/posts/"]');
  const linkCount = await postLinks.count();
  console.log(`  - 게시글 링크 수: ${linkCount}`);

  // /posts/숫자 형식의 링크만 찾기
  let postDetailHref: string | null = null;
  for (let i = 0; i < linkCount; i++) {
    const href = await postLinks.nth(i).getAttribute('href');
    if (href && /^\/posts\/\d+$/.test(href)) {
      postDetailHref = href;
      break;
    }
  }

  if (postDetailHref) {
    console.log(`  - 클릭할 링크: ${postDetailHref}`);
    await page.goto(`${BASE_URL}${postDetailHref}`);
    // 로딩 완료 대기 (댓글 섹션이 나타날 때까지)
    await page.waitForSelector('text=/댓글 \\d+개/', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-post-detail.png`, fullPage: true });

    // 6. 게시글 상세 - 댓글 섹션
    console.log('6. 게시글 상세 - 댓글 섹션');
    const commentSection = page.getByText(/댓글 \d+개/);
    if (await commentSection.isVisible()) {
      await commentSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-post-detail-comments.png`, fullPage: true });
    }

    // 7. 게시글 수정 페이지
    console.log('7. 게시글 수정 페이지');
    // 게시글 수정 버튼 (댓글 수정 버튼과 구분하기 위해 first() 사용)
    const editButton = page.getByRole('button', { name: '수정' }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForURL(/\/edit/);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-post-edit.png`, fullPage: true });
    }
  } else {
    console.log('  - 게시글이 없습니다. 상세 페이지 스킵');
  }

  // 8. 비로그인 상태 - 게시글 목록
  console.log('\n🔓 로그아웃 후 비로그인 상태 캡처');
  await page.evaluate(() => localStorage.removeItem('accessToken'));
  await page.goto(`${BASE_URL}/posts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/08-posts-list-guest.png`, fullPage: true });

  // 9. 비로그인 상태 - 게시글 상세
  console.log('9. 비로그인 상태 - 게시글 상세');
  const guestPostLinks = page.locator('a[href^="/posts/"]');
  const guestLinkCount = await guestPostLinks.count();

  let guestPostDetailHref: string | null = null;
  for (let i = 0; i < guestLinkCount; i++) {
    const href = await guestPostLinks.nth(i).getAttribute('href');
    if (href && /^\/posts\/\d+$/.test(href)) {
      guestPostDetailHref = href;
      break;
    }
  }

  if (guestPostDetailHref) {
    await page.goto(`${BASE_URL}${guestPostDetailHref}`);
    await page.waitForSelector('text=/댓글 \\d+개/', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-post-detail-guest.png`, fullPage: true });
  }

  await browser.close();

  console.log('\n✅ 스크린샷 캡처 완료!');
  console.log(`📁 저장 위치: ${SCREENSHOT_DIR}/`);
}

captureScreenshots().catch(console.error);
