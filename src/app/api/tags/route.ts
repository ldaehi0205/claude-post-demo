import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';

export async function GET() {
  const tags = await prisma.tag.findMany({
    where: {
      postTags: {
        some: {},
      },
    },
    select: {
      name: true,
      _count: {
        select: { postTags: true },
      },
    },
    orderBy: {
      postTags: {
        _count: 'desc',
      },
    },
  });

  return NextResponse.json({
    tags: tags.map((tag) => ({
      name: tag.name,
      postCount: tag._count.postTags,
    })),
  });
}
