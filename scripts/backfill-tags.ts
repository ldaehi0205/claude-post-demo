/**
 * 기존 게시글에서 태그를 추출하여 Tag/PostTag 테이블에 저장하는 백필 스크립트.
 *
 * 실행: npx ts-node scripts/backfill-tags.ts
 */

import { PrismaClient } from '@prisma/client';

// tagParser를 직접 구현 (ts-node에서 path alias 미지원 대응)
const TAG_REGEX = /(?:^|[\s([\]])#([a-zA-Z0-9\u3131-\u318E\uAC00-\uD7A3][a-zA-Z0-9\u3131-\u318E\uAC00-\uD7A3.]*)/g;

function parseTagsFromContent(content: string): string[] {
  if (!content) return [];
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(content)) !== null) {
    const tag = match[1].toLowerCase().replace(/\.+$/, '');
    if (tag) tags.push(tag);
  }
  return Array.from(new Set(tags));
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const posts = await prisma.post.findMany({
      select: { id: true, content: true },
    });

    console.log(`${posts.length}개 게시글에서 태그를 추출합니다...`);

    let totalTags = 0;

    for (const post of posts) {
      const tagNames = parseTagsFromContent(post.content);
      if (tagNames.length === 0) continue;

      await prisma.$transaction(async (tx) => {
        const tags = await Promise.all(
          tagNames.map((name) =>
            tx.tag.upsert({
              where: { name },
              create: { name },
              update: {},
            }),
          ),
        );

        await tx.postTag.createMany({
          data: tags.map((tag) => ({ postId: post.id, tagId: tag.id })),
          skipDuplicates: true,
        });
      });

      totalTags += tagNames.length;
      console.log(`  Post #${post.id}: ${tagNames.join(', ')}`);
    }

    console.log(`\n완료! 총 ${totalTags}개 태그 연결이 생성되었습니다.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
