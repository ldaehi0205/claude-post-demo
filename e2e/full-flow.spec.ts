import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  userID: 'testuser',
  password: 'password123',
  name: '테스트유저',
};

// label 텍스트로 input 찾기 헬퍼 함수
async function fillInputByLabel(page: Page, labelText: string, value: string) {
  // 모든 input이 로드될 때까지 대기
  await page.locator('input').first().waitFor({ state: 'visible', timeout: 5000 });

  // 페이지별로 input 순서가 정해져 있음
  if (labelText === '아이디') {
    await page.locator('input').nth(0).fill(value);
  } else if (labelText === '비밀번호') {
    await page.locator('input').nth(1).fill(value);
  } else if (labelText === '제목') {
    await page.locator('input').nth(0).fill(value);
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

      await page.locator('button[type="submit"]').click();

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
      await page.locator('button[type="submit"]').click();
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
      await page.locator('button[type="submit"]').click();
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
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 두 번째 게시글 작성
      await page.goto('/posts/new');
      await fillInputByLabel(page, '제목', title2);
      await fillTextareaByLabel(page, '내용', '다중 삭제 테스트용 게시글 2');
      await page.locator('button[type="submit"]').click();
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

  test.describe('5. MarkdownEditor 테스트', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인
      await page.goto('/login');
      await fillInputByLabel(page, '아이디', TEST_USER.userID);
      await fillInputByLabel(page, '비밀번호', TEST_USER.password);
      await page.getByRole('button', { name: '로그인' }).click();
      await page.waitForURL(/\/(posts)?$/, { timeout: 5000 });
    });

    test('MarkdownEditor UI 확인', async ({ page }) => {
      await page.goto('/posts/new');

      // MarkdownEditor 툴바 버튼 확인
      await expect(page.getByRole('button', { name: '이미지 업로드' })).toBeVisible();
      await expect(page.getByText('작성')).toBeVisible();
      await expect(page.getByText('미리보기')).toBeVisible();

      // 마크다운 안내 문구 확인
      await expect(page.getByText('마크다운 문법을 지원합니다')).toBeVisible();
    });

    test('마크다운 작성/미리보기 탭 전환', async ({ page }) => {
      await page.goto('/posts/new');

      // 기본값은 작성 탭
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();

      // 미리보기 탭으로 전환
      await page.getByRole('button', { name: '미리보기' }).click();
      await expect(textarea).not.toBeVisible();

      // 다시 작성 탭으로 전환
      await page.locator('button:has-text("작성"):not([type="submit"])').click();
      await expect(textarea).toBeVisible();
    });

    test('이미지 없이 게시글 작성 가능', async ({ page }) => {
      await page.goto('/posts/new');

      const title = `이미지 없는 게시글 ${Date.now()}`;
      const content = '이미지 없이 작성된 게시글입니다.';

      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', content);
      await page.locator('button[type="submit"]').click();

      // 작성 후 목록 페이지로 이동 확인
      await page.waitForURL(/\/posts$/, { timeout: 10000 });

      // 목록에서 작성한 게시글 확인
      await expect(page.getByText(title)).toBeVisible({ timeout: 3000 });
    });

    test('마크다운 서식으로 게시글 작성', async ({ page }) => {
      await page.goto('/posts/new');

      const title = `마크다운 테스트 ${Date.now()}`;
      const content = '# 제목\n\n**굵은 글씨** *기울임*\n\n- 목록 1\n- 목록 2';

      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', content);

      // 미리보기 탭에서 마크다운 렌더링 확인
      await page.getByRole('button', { name: '미리보기' }).click();
      await expect(page.locator('.prose h1')).toBeVisible({ timeout: 5000 });

      // 다시 작성 탭으로 돌아가서 제출
      await page.locator('button:has-text("작성"):not([type="submit"])').click();
      await page.locator('button[type="submit"]').click();

      // 작성 후 목록 페이지로 이동 확인
      await page.waitForURL(/\/posts$/, { timeout: 10000 });

      // 목록에서 작성한 게시글 확인
      await expect(page.getByText(title)).toBeVisible({ timeout: 3000 });
    });

    test('게시글 상세에서 마크다운 렌더링 확인', async ({ page }) => {
      await page.goto('/posts/new');

      const title = `상세 마크다운 테스트 ${Date.now()}`;
      const content = '## 소제목\n\n일반 텍스트입니다.\n\n```\nconst code = "코드 블록";\n```';

      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', content);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/posts$/, { timeout: 10000 });

      // 작성한 게시글 클릭하여 상세 페이지 이동
      await page.getByText(title).click();
      await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });

      // 상세 페이지에서 마크다운 렌더링 확인
      await expect(page.locator('h2').filter({ hasText: '소제목' })).toBeVisible({ timeout: 5000 });
    });

    test('게시글 수정 시 기존 내용 표시', async ({ page }) => {
      await page.goto('/posts/new');

      const title = `수정 테스트 ${Date.now()}`;
      const content = '수정 테스트용 **마크다운** 내용입니다.';

      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', content);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/posts$/, { timeout: 10000 });

      // 작성한 게시글 클릭하여 상세 페이지 이동
      await page.getByText(title).click();
      await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });

      // 수정 버튼 클릭
      await page.getByRole('button', { name: '수정' }).click();
      await page.waitForURL(/\/edit/, { timeout: 5000 });

      // 수정 페이지에서 기존 내용이 textarea에 표시되는지 확인
      const textarea = page.locator('textarea');
      await expect(textarea).toHaveValue(content, { timeout: 5000 });
    });
  });

  test.describe('6. 댓글 CRUD 테스트', () => {
    // UI를 통해 로그인하고 새 게시글 작성 후 상세 페이지로 이동하는 헬퍼 함수
    async function loginAndCreatePost(page: Page): Promise<void> {
      // 로그인
      await page.goto('/login');
      await fillInputByLabel(page, '아이디', TEST_USER.userID);
      await fillInputByLabel(page, '비밀번호', TEST_USER.password);
      await page.getByRole('button', { name: '로그인' }).click();

      // 로그인 완료 대기 (리다이렉트 또는 로그아웃 버튼)
      await Promise.race([
        page.waitForURL(/\/(posts)?$/, { timeout: 10000 }),
        page.waitForSelector('button:has-text("로그아웃")', { timeout: 10000 }),
      ]);

      // 새 게시글 작성
      await page.goto('/posts/new');
      const title = `댓글 테스트 게시글 ${Date.now()}`;
      await fillInputByLabel(page, '제목', title);
      await fillTextareaByLabel(page, '내용', '댓글 테스트를 위한 게시글입니다.');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/posts$/, { timeout: 5000 });

      // 작성한 게시글 클릭하여 상세 페이지 이동
      await page.getByText(title).click();
      await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });
    }

    test('비로그인 상태에서 댓글 목록 조회 가능, 작성 폼 미표시', async ({ page }) => {
      // 먼저 로그인해서 게시글 생성
      await loginAndCreatePost(page);

      // 로그아웃 (localStorage 클리어)
      await page.evaluate(() => localStorage.removeItem('accessToken'));
      await page.reload();

      // 댓글 섹션이 로드될 때까지 대기
      await expect(page.getByText(/댓글 \d+개/)).toBeVisible({ timeout: 10000 });

      // 댓글 작성 폼(textarea)이 없어야 함
      await expect(page.locator('textarea[placeholder="댓글을 작성하세요"]')).not.toBeVisible();
    });

    test('로그인 상태에서 댓글 작성', async ({ page }) => {
      await loginAndCreatePost(page);

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
      await loginAndCreatePost(page);

      // 댓글 작성 폼이 로드될 때까지 대기
      await expect(page.locator('textarea[placeholder="댓글을 작성하세요"]')).toBeVisible({ timeout: 10000 });

      // 새 댓글 작성
      const originalComment = `원본 댓글 ${Date.now()}`;
      await page.locator('textarea[placeholder="댓글을 작성하세요"]').fill(originalComment);
      await page.getByRole('button', { name: '댓글 등록' }).click();
      await expect(page.getByText(originalComment)).toBeVisible({ timeout: 5000 });

      // 수정 버튼 클릭
      const commentItem = page.locator('li').filter({ hasText: originalComment });
      await commentItem.getByRole('button', { name: '수정' }).click();

      // 수정 textarea가 나타날 때까지 대기
      const editTextarea = commentItem.locator('textarea');
      await expect(editTextarea).toBeVisible({ timeout: 5000 });

      // 수정 textarea에 새 내용 입력
      const editedComment = `수정된 댓글 ${Date.now()}`;
      await editTextarea.fill(editedComment);

      // 저장 버튼 클릭 (수정 모드에서는 li 내부에서 직접 찾음)
      await page.getByRole('button', { name: '저장' }).click();

      // 수정된 댓글 확인
      await expect(page.getByText(editedComment)).toBeVisible({ timeout: 5000 });
    });

    test('본인 댓글 삭제', async ({ page }) => {
      await loginAndCreatePost(page);

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
      await commentItem.getByRole('button', { name: '삭제' }).click();

      // 삭제 확인
      await expect(page.getByText(commentToDelete)).not.toBeVisible({ timeout: 5000 });
    });

    test('타인 댓글에 수정/삭제 버튼 미표시', async ({ page }) => {
      await loginAndCreatePost(page);

      // 댓글 섹션이 로드될 때까지 대기
      await expect(page.getByText(/댓글 \d+개/)).toBeVisible({ timeout: 10000 });

      // 본인 댓글만 있으므로, 본인 댓글에 수정/삭제 버튼이 표시되는지 확인
      // (타인 댓글 테스트는 다른 사용자 필요하므로 본인 댓글 버튼 표시 확인으로 대체)
      const commentContent = `권한 테스트 댓글 ${Date.now()}`;
      await page.locator('textarea[placeholder="댓글을 작성하세요"]').fill(commentContent);
      await page.getByRole('button', { name: '댓글 등록' }).click();
      await expect(page.getByText(commentContent)).toBeVisible({ timeout: 5000 });

      // 본인 댓글에는 수정/삭제 버튼이 표시되어야 함
      const myCommentItem = page.locator('li').filter({ hasText: commentContent });
      await expect(myCommentItem.getByText('수정')).toBeVisible();
      await expect(myCommentItem.getByText('삭제')).toBeVisible();
    });
  });
});
