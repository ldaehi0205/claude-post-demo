import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { UpdatePostInput } from '@/types/post';
import { parseTagsFromContent } from '@/utils/tagParser';
import { upsertTagsForPost } from '@/utils/tagService';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          userID: true,
        },
      },
      postTags: {
        include: {
          tag: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  // 조회수 증가 (비동기, 응답 지연 없음)
  prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.json({ ...post, viewCount: post.viewCount + 1 });
}

export async function PUT(request: Request, { params }: Params) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: '인증이 필요합니다.', code: 'authorization' },
      { status: 401 },
    );
  }

  const { payload, expired } = verifyToken(token);

  if (expired) {
    return NextResponse.json(
      { error: '토큰이 만료되었습니다.', code: 'expired_token' },
      { status: 401 },
    );
  }

  if (!payload) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.', code: 'invalid_token' },
      { status: 401 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  if (post.authorId !== payload.userId) {
    return NextResponse.json(
      { error: '수정 권한이 없습니다.', code: 'forbidden' },
      { status: 403 },
    );
  }

  const body: UpdatePostInput = await request.json();
  const postId = Number(params.id);

  const updatedPost = await prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({
      where: { id: postId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content, summary: null }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            userID: true,
          },
        },
      },
    });

    if (body.content) {
      const tagNames = parseTagsFromContent(body.content);
      await tx.postTag.deleteMany({ where: { postId } });
      await upsertTagsForPost(tx, postId, tagNames);
    }

    return updated;
  });

  return NextResponse.json(updatedPost);
}
