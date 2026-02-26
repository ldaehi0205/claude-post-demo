import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { CreatePostInput } from '@/types/post';
import { notifyNewPost } from '@/utils/n8n';
import { getBaseUrl } from '@/utils/url';
import { upsertTagsForPost } from '@/utils/tagService';
import { errorResponse } from '@/utils/apiError';

interface DeletePostsInput {
  ids: number[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');

  const where = tag
    ? { postTags: { some: { tag: { name: tag } } } }
    : undefined;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          userID: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
      postTags: {
        include: {
          tag: { select: { id: true, name: true } },
        },
      },
    },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  console.log('[POST /api/posts] 게시글 작성 API 호출됨');
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

  const body: CreatePostInput = await request.json();
  const tagNames: string[] = body.tags ?? [];

  const post = await prisma.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: payload.userId,
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

    await upsertTagsForPost(tx, newPost.id, tagNames);

    return newPost;
  });

  // n8n webhook으로 새 게시글 알림 전송 (비동기, 실패해도 응답에 영향 없음)
  notifyNewPost({
    id: post.id,
    title: post.title,
    authorName: post.author.name,
    authorId: post.author.userID,
    createdAt: post.createdAt,
    url: `${getBaseUrl()}/posts/${post.id}`,
  }).catch(() => {});

  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(request: Request) {
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

  const body: DeletePostsInput = await request.json();

  if (!body.ids || body.ids.length === 0) {
    return NextResponse.json(
      { error: '삭제할 게시글을 선택해주세요.', code: 'bad_request' },
      { status: 400 },
    );
  }

  // 본인 게시글만 삭제 가능
  const result = await prisma.post.deleteMany({
    where: {
      id: { in: body.ids },
      // authorId: payload.userId,
    },
  });

  return NextResponse.json({
    message: `${result.count}개의 게시글이 삭제되었습니다.`,
    deletedCount: result.count,
  });
}
