'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/data/prisma';

/** 게시글 작성 서버 액션 */
export async function createPost(formData: FormData, authorId: number) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await prisma.post.create({
    data: {
      title,
      content,
      authorId,
    },
  });

  revalidatePath('/posts'); // 캐시무효화
  redirect('/posts');
}

/** 게시글 수정 서버 액션 */
export async function updatePost(formData: FormData, postId: number) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await prisma.post.update({
    where: { id: postId },
    data: { title, content },
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
  // 본인 게시글만 삭제 가능하도록 필터링
  await prisma.post.deleteMany({
    where: {
      id: { in: postIds },
      authorId: userId,
    },
  });

  revalidatePath('/posts');
}
