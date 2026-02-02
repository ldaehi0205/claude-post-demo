import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { CreatePostInput } from '@/types/post';

interface DeletePostsInput {
  ids: number[];
}

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
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
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 401 },
    );
  }

  const body: CreatePostInput = await request.json();
  const post = await prisma.post.create({
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

  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 401 },
    );
  }

  const body: DeletePostsInput = await request.json();

  if (!body.ids || body.ids.length === 0) {
    return NextResponse.json(
      { error: '삭제할 게시글을 선택해주세요.' },
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
