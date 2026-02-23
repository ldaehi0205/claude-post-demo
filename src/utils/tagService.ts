import { PrismaClient } from '@prisma/client';

type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * 게시글에 태그를 연결한다. 존재하지 않는 태그는 생성한다.
 * 트랜잭션 내에서 호출되어야 한다.
 */
export async function upsertTagsForPost(
  tx: PrismaTransactionClient,
  postId: number,
  tagNames: string[],
): Promise<void> {
  if (tagNames.length === 0) return;

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
    data: tags.map((tag) => ({ postId, tagId: tag.id })),
    skipDuplicates: true,
  });
}
