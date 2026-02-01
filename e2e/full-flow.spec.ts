import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  userID: 'testuser',
  password: 'password123',
  name: '테스트유저',
};

// label 텍스트로 input 찾기 헬퍼 함수
async function fillInputByLabel(page: Page, labelText: string, value: string) {
  const label = page.locator(`text=${labelText}`).first();
  const container = label.locator('..');
  const input = container.locator('input');
  await input.fill(value);
}

async function fillTextareaByLabel(page: Page, labelText: string, value: string) {
  const label = page.locator(`text=${labelText}`).first();
  const container = label.locator('..');
  const textarea = container.locator('textarea');
  await textarea.fill(value);
}

test.describe('전체 흐름 E2E 테스트', () => {
  test.describe('1. 로그인 테스트', () => {
    test('로그인 페이지 UI 확인', async ({ page }) => {
      await page.goto('/login');

      // 로그인 폼 요소 확인
      await expect(page.getByText('아이디')).toBeVisible();
      await expect(page.getByText('비밀번호')).toBeVisible();
      await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    });

    test('잘못된 로그인 시 에러 메시지 표시', async ({ page }) => {
      await page.goto('/login');

      await fillInputByLabel(page, '아이디', 'wronguser');
      await fillInputByLabel(page, '비밀번호', 'wrongpassword');
      await page.getByRole('button', { name: '로그인' }).click();

      // 에러 메시지 확인
      await expect(page.getByText('아이디 또는 비밀번호가 올바르지 않습니다')).toBeVisible({ timeout: 5000 });
    });

    test('정상 로그인', async ({ page }) => {
      await page.goto('/login');

      await fillInputByLabel(page, '아이디', TEST_USER.userID);
      await fillInputByLabel(page, '비밀번호', TEST_USER.password);
      await page.getByRole('button', { name: '로그인' }).click();

      // 로그인 후 리다이렉트 확인 (목록 페이지 또는 홈)
      await page.waitForURL(/\/(posts)?$/, { timeout: 5000 });

      // 헤더에 로그아웃 버튼 표시 확인
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('2. 헤더 UI 테스트', () => {
    test('헤더 요소 확인', async ({ page }) => {
      await page.goto('/posts');

      // 로고 확인
      await expect(page.getByText('게시판')).toBeVisible();

      // GNB 메뉴 확인
      await expect(page.getByRole('link', { name: '홈' })).toBeVisible();
      await expect(page.getByRole('link', { name: '게시글 목록' })).toBeVisible();
    });
  });

  test.describe('3. 권한 테스트', () => {
    test('비로그인 상태에서 글쓰기 페이지 접근 시 로그인 리다이렉트', async ({ page }) => {
      // localStorage 클리어하여 비로그인 상태 확보
      await page.goto('/');
      await page.evaluate(() => localStorage.removeItem('accessToken'));

      await page.goto('/posts/new');

      // /login으로 리다이렉트 되었는지 확인
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('4. 게시글 CRUD 테스트', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인
      await page.goto('/login');
      await fillInputByLabel(page, '아이디', TEST_USER.userID);
      await fillInputByLabel(page, '비밀번호', TEST_USER.password);
      await page.getByRole('button', { name: '로그인' }).click();
      await page.waitForURL(/\/(posts)?$/, { timeout: 5000 });
    });

    test('게시글 목록 페이지 확인', async ({ page }) => {
      await page.goto('/posts');
      await expect(page).toHaveURL(/\/posts/);
    });

    test('게시글 작성', async ({ page }) => {
      await page.goto('/posts/new');

      const title = `테스트 게시글 ${Date.now()}`;
      const content = '테스트 내용입니다. E2E 테스트에서 작성되었습니다.';

      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', content);

      await page.getByRole('button', { name: '작성' }).click();

      // 작성 후 목록 페이지로 이동 확인
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 목록에서 작성한 게시글 확인
      await expect(page.getByText(title)).toBeVisible({ timeout: 3000 });
    });

    test('게시글 상세 조회', async ({ page }) => {
      await page.goto('/posts');

      // 첫 번째 게시글 클릭
      const firstPost = page.locator('a[href^="/posts/"]').first();
      if (await firstPost.isVisible()) {
        await firstPost.click();
        await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });
      }
    });

    test('게시글 수정', async ({ page }) => {
      // 새 게시글 작성
      await page.goto('/posts/new');
      const originalTitle = `수정 테스트 ${Date.now()}`;
      await fillInputByLabel(page, '제목', originalTitle);
      await fillTextareaByLabel(page, '내용', '수정 테스트용 게시글');
      await page.getByRole('button', { name: '작성' }).click();
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 작성한 게시글 클릭하여 상세 페이지 이동
      await page.getByText(originalTitle).click();
      await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });

      // 수정 버튼 클릭
      await page.getByRole('button', { name: '수정' }).click();
      await page.waitForURL(/\/edit/, { timeout: 5000 });

      // 제목 수정
      const newTitle = `수정된 제목 ${Date.now()}`;
      await fillInputByLabel(page, '제목', newTitle);
      await page.getByRole('button', { name: '수정' }).click();

      // 수정 후 목록 페이지로 이동
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 수정된 제목 확인
      await expect(page.getByText(newTitle)).toBeVisible({ timeout: 3000 });
    });

    test('게시글 삭제', async ({ page }) => {
      // 새 게시글 작성
      await page.goto('/posts/new');
      const title = `삭제 테스트 ${Date.now()}`;
      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', '삭제 테스트용 게시글');
      await page.getByRole('button', { name: '작성' }).click();
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 작성한 게시글 클릭하여 상세 페이지 이동
      await page.getByText(title).click();
      await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });

      // 다이얼로그 핸들러 설정
      page.on('dialog', dialog => dialog.accept());

      // 삭제 버튼 클릭
      await page.getByRole('button', { name: '삭제' }).click();

      // 목록 페이지로 이동 확인
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 삭제된 게시글이 목록에 없는지 확인
      await expect(page.getByText(title)).not.toBeVisible({ timeout: 3000 });
    });
  });
});
