import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requestAISummary } from '@/utils/n8n';
import { getBaseUrl } from '@/utils/url';

interface Params {
  params: { id: string };
}

/**
 * GET /api/posts/:id/summary
 * 요약 조회 전용: summary가 없으면 n8n webhook으로 요약 생성 요청
 */
export async function GET(request: Request, { params }: Params) {
  const postId = Number(params.id);
  if (isNaN(postId)) {
    return NextResponse.json(
      { error: '유효하지 않은 게시글 ID', code: 'bad_request' },
      { status: 400 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, title: true, content: true, summary: true },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  // summary가 없으면 AI 요약 생성 요청 (비동기, 실패해도 응답에 영향 없음)
  if (!post.summary) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    requestAISummary({
      id: post.id,
      title: post.title,
      content: post.content,
      callbackUrl: `${baseUrl}/api/posts/${post.id}/summary`,
    }).catch(() => {});
  }

  return NextResponse.json({ summary: post.summary });
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
