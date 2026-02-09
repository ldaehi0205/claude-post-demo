/**
 * n8n Webhook 연동 유틸리티
 * 게시글 작성 시 Slack 등 외부 서비스로 알림을 전송합니다.
 */

interface NewPostPayload {
  id: number;
  title: string;
  authorName: string;
  authorId: string;
  createdAt: Date;
  url: string;
}

/**
 * n8n webhook으로 새 게시글 알림을 전송합니다.
 * webhook 호출 실패 시에도 에러를 throw하지 않고 로그만 남깁니다.
 */
export async function notifyNewPost(payload: NewPostPayload): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[n8n] N8N_WEBHOOK_URL이 설정되지 않아 알림을 스킵합니다.');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'new_post',
        post: {
          id: payload.id,
          title: payload.title,
          author: payload.authorName,
          authorId: payload.authorId,
          createdAt: payload.createdAt.toISOString(),
          url: payload.url,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`[n8n] Webhook 호출 실패: ${response.status} ${response.statusText}`);
    } else {
      console.log(`[n8n] 새 게시글 알림 전송 완료: ${payload.title}`);
    }
  } catch (error) {
    console.error('[n8n] Webhook 호출 중 오류:', error);
  }
}
