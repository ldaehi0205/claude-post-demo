'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/data/prisma';
import { notifyNewPost } from '@/utils/n8n';
import { getBaseUrl } from '@/utils/url';
import { parseTagsFromContent } from '@/utils/tagParser';
import { upsertTagsForPost } from '@/utils/tagService';

/** 게시글 작성 서버 액션 */
export async function createPost(formData: FormData, authorId: number) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const tagNames = parseTagsFromContent(content);

  const post = await prisma.$transaction(async (tx) => {
    const newPost = await tx.post.create({
      data: {
        title,
        content,
        authorId,
      },
      include: {
        author: {
          select: {
            name: true,
            userID: true,
          },
        },
      },
    });

    await upsertTagsForPost(tx, newPost.id, tagNames);

    return newPost;
  });

  // n8n webhook으로 새 게시글 알림 전송
  notifyNewPost({
    id: post.id,
    title: post.title,
    authorName: post.author.name,
    authorId: post.author.userID,
    createdAt: post.createdAt,
    url: `${getBaseUrl()}/posts/${post.id}`,
  }).catch(() => {});

  revalidatePath('/posts');
  redirect('/posts');
}

/** 게시글 수정 서버 액션 */
export async function updatePost(formData: FormData, postId: number) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const tagNames = parseTagsFromContent(content);

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        summary: null,
      },
    });

    await tx.postTag.deleteMany({ where: { postId } });
    await upsertTagsForPost(tx, postId, tagNames);
  });

  revalidatePath('/posts');
  revalidatePath(`/posts/${postId}`);
  redirect('/posts');
}

/** 게시글 삭제 서버 액션 */
export async function deletePost(postId: number) {
  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath('/posts');
  redirect('/posts');
}

/** 게시글 다중 삭제 서버 액션 */
export async function deleteMultiplePosts(postIds: number[], userId: number) {
  await prisma.post.deleteMany({
    where: {
      id: { in: postIds },
      authorId: userId,
    },
  });

  revalidatePath('/posts');
}
