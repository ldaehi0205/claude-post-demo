import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';

interface Params {
  params: { id: string };
}

/**
 * PATCH /api/posts/:id/summary
 * n8n 콜백 전용: AI 요약 저장
 */
export async function PATCH(request: Request, { params }: Params) {
  const callbackSecret = process.env.N8N_CALLBACK_SECRET;
  const requestSecret = request.headers.get('x-callback-secret');

  if (callbackSecret && requestSecret !== callbackSecret) {
    return NextResponse.json(
      { error: '인증 실패', code: 'authorization' },
      { status: 401 },
    );
  }

  const postId = Number(params.id);
  if (isNaN(postId)) {
    return NextResponse.json(
      { error: '유효하지 않은 게시글 ID', code: 'bad_request' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { summary } = body;

  if (!summary || typeof summary !== 'string') {
    return NextResponse.json(
      { error: '요약 내용이 필요합니다.', code: 'bad_request' },
      { status: 400 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: { summary: summary.trim() },
  });

  console.log(`[AI Summary] 게시글 #${postId} 요약 저장 완료`);

  return NextResponse.json({
    message: '요약이 저장되었습니다.',
    postId: updatedPost.id,
    summary: updatedPost.summary,
  });
}
