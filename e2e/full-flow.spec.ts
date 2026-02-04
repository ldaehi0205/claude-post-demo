import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  userID: 'testuser',
  password: 'password123',
  name: '테스트유저',
};

// label 텍스트로 input 찾기 헬퍼 함수
async function fillInputByLabel(page: Page, labelText: string, value: string) {
  if (labelText === '아이디') {
    await page.locator('input').first().fill(value);
  } else if (labelText === '비밀번호') {
    await page.locator('input').nth(1).fill(value);
  } else if (labelText === '제목') {
    await page.locator('input').first().fill(value);
  } else if (labelText === '이름') {
    await page.locator('input').nth(2).fill(value);
  }
}

async function fillTextareaByLabel(page: Page, _labelText: string, value: string) {
  await page.locator('textarea').first().fill(value);
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

      // 페이지 리로드하여 캐시 갱신
      await page.reload();

      // 삭제된 게시글이 목록에 없는지 확인
      await expect(page.getByText(title)).not.toBeVisible({ timeout: 3000 });
    });

    test('게시글 다중 삭제', async ({ page }) => {
      const timestamp = Date.now();
      const title1 = `다중삭제 테스트1 ${timestamp}`;
      const title2 = `다중삭제 테스트2 ${timestamp}`;

      // 첫 번째 게시글 작성
      await page.goto('/posts/new');
      await fillInputByLabel(page, '제목', title1);
      await fillTextareaByLabel(page, '내용', '다중 삭제 테스트용 게시글 1');
      await page.getByRole('button', { name: '작성' }).click();
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 두 번째 게시글 작성
      await page.goto('/posts/new');
      await fillInputByLabel(page, '제목', title2);
      await fillTextareaByLabel(page, '내용', '다중 삭제 테스트용 게시글 2');
      await page.getByRole('button', { name: '작성' }).click();
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 게시글 목록에서 두 게시글 확인
      await expect(page.getByText(title1)).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(title2)).toBeVisible({ timeout: 3000 });

      // 체크박스 선택 (두 게시글 모두)
      // 구조: div.flex > input[checkbox] + Link > div > h2(title)
      const card1 = page.locator('h2', { hasText: title1 }).locator('..').locator('..').locator('..');
      const card2 = page.locator('h2', { hasText: title2 }).locator('..').locator('..').locator('..');

      await card1.locator('input[type="checkbox"]').check();
      await card2.locator('input[type="checkbox"]').check();

      // 다이얼로그 핸들러 설정
      page.on('dialog', dialog => dialog.accept());

      // 삭제 버튼 클릭
      await page.getByRole('button', { name: '삭제' }).click();

      // 페이지 새로고침 대기
      await page.waitForTimeout(1000);

      // 삭제된 게시글이 목록에 없는지 확인
      await expect(page.getByText(title1)).not.toBeVisible({ timeout: 3000 });
      await expect(page.getByText(title2)).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('5. 댓글 CRUD 테스트', () => {
    let accessToken: string;
    let testPostId: number;

    test.beforeAll(async ({ request }) => {
      // API로 로그인하여 토큰 획득
      const loginRes = await request.post('http://localhost:3000/api/auth/login', {
        data: { userID: TEST_USER.userID, password: TEST_USER.password },
      });
      const loginData = await loginRes.json();
      accessToken = loginData.accessToken;

      // 테스트용 게시글 API로 생성
      const postRes = await request.post('http://localhost:3000/api/posts', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: '댓글 테스트용 게시글', content: '댓글 테스트를 위한 게시글입니다.' },
      });
      const postData = await postRes.json();
      testPostId = postData.id;
    });

    test('비로그인 상태에서 댓글 목록 조회 가능, 작성 폼 미표시', async ({ page }) => {
      // localStorage 클리어하여 비로그인 상태 확보
      await page.goto('/');
      await page.evaluate(() => localStorage.removeItem('accessToken'));

      // 비로그인 상태로 게시글 상세 페이지 접근
      await page.goto(`/posts/${testPostId}`);

      // 댓글 섹션이 로드될 때까지 대기
      await expect(page.getByText(/댓글 \d+개/)).toBeVisible({ timeout: 10000 });

      // 댓글 작성 폼(textarea)이 없어야 함
      await expect(page.locator('textarea[placeholder="댓글을 작성하세요"]')).not.toBeVisible();
    });

    test('로그인 상태에서 댓글 작성', async ({ page }) => {
      // 로그인 상태 설정
      await page.goto('/');
      await page.evaluate((token) => localStorage.setItem('accessToken', token), accessToken);

      // 게시글 상세 페이지로 이동
      await page.goto(`/posts/${testPostId}`);

      // 댓글 작성 폼이 로드될 때까지 대기
      await expect(page.locator('textarea[placeholder="댓글을 작성하세요"]')).toBeVisible({ timeout: 10000 });

      // 댓글 작성
      const commentContent = `테스트 댓글 ${Date.now()}`;
      await page.locator('textarea[placeholder="댓글을 작성하세요"]').fill(commentContent);
      await page.getByRole('button', { name: '댓글 등록' }).click();

      // 댓글이 목록에 표시되는지 확인
      await expect(page.getByText(commentContent)).toBeVisible({ timeout: 5000 });
    });

    test('본인 댓글 수정', async ({ page }) => {
      // 로그인 상태 설정
      await page.goto('/');
      await page.evaluate((token) => localStorage.setItem('accessToken', token), accessToken);

      await page.goto(`/posts/${testPostId}`);

      // 댓글 작성 폼이 로드될 때까지 대기
      await expect(page.locator('textarea[placeholder="댓글을 작성하세요"]')).toBeVisible({ timeout: 10000 });

      // 새 댓글 작성
      const originalComment = `원본 댓글 ${Date.now()}`;
      await page.locator('textarea[placeholder="댓글을 작성하세요"]').fill(originalComment);
      await page.getByRole('button', { name: '댓글 등록' }).click();
      await expect(page.getByText(originalComment)).toBeVisible({ timeout: 5000 });

      // 수정 버튼 클릭
      const commentItem = page.locator('li').filter({ hasText: originalComment });
      await commentItem.getByText('수정').click();

      // 수정 textarea에 새 내용 입력
      const editedComment = `수정된 댓글 ${Date.now()}`;
      await commentItem.locator('textarea').fill(editedComment);
      await commentItem.getByRole('button', { name: '저장' }).click();

      // 수정된 댓글 확인
      await expect(page.getByText(editedComment)).toBeVisible({ timeout: 5000 });
    });

    test('본인 댓글 삭제', async ({ page }) => {
      // 로그인 상태 설정
      await page.goto('/');
      await page.evaluate((token) => localStorage.setItem('accessToken', token), accessToken);

      await page.goto(`/posts/${testPostId}`);

      // 댓글 작성 폼이 로드될 때까지 대기
      await expect(page.locator('textarea[placeholder="댓글을 작성하세요"]')).toBeVisible({ timeout: 10000 });

      // 새 댓글 작성
      const commentToDelete = `삭제할 댓글 ${Date.now()}`;
      await page.locator('textarea[placeholder="댓글을 작성하세요"]').fill(commentToDelete);
      await page.getByRole('button', { name: '댓글 등록' }).click();
      await expect(page.getByText(commentToDelete)).toBeVisible({ timeout: 5000 });

      // 다이얼로그 핸들러 설정
      page.on('dialog', dialog => dialog.accept());

      // 삭제 버튼 클릭
      const commentItem = page.locator('li').filter({ hasText: commentToDelete });
      await commentItem.getByText('삭제').click();

      // 삭제 확인
      await expect(page.getByText(commentToDelete)).not.toBeVisible({ timeout: 5000 });
    });

    test('타인 댓글에 수정/삭제 버튼 미표시', async ({ page }) => {
      // 로그인 상태 설정
      await page.goto('/');
      await page.evaluate((token) => localStorage.setItem('accessToken', token), accessToken);

      await page.goto(`/posts/${testPostId}`);
      await page.waitForLoadState('networkidle');

      // 타인의 댓글이 있는 경우 테스트 (조건부)
      const otherUserComments = page.locator('li').filter({
        hasNot: page.locator(`text=${TEST_USER.name}`),
      });

      const count = await otherUserComments.count();
      if (count > 0) {
        const firstOtherComment = otherUserComments.first();
        await expect(firstOtherComment.getByText('수정')).not.toBeVisible();
        await expect(firstOtherComment.getByText('삭제')).not.toBeVisible();
      }
    });
  });
});
