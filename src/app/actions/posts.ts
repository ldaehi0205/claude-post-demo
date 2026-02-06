'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/data/prisma';
import { uploadImage, deleteImage } from './upload';

/** 게시글 작성 서버 액션 */
export async function createPost(formData: FormData, authorId: number) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const imageFile = formData.get('image') as File | null;

  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const imageFormData = new FormData();
    imageFormData.append('image', imageFile);
    const uploadResult = await uploadImage(imageFormData);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || '이미지 업로드 실패');
    }
    imageUrl = uploadResult.url || null;
  }

  await prisma.post.create({
    data: {
      title,
      content,
      imageUrl,
      authorId,
    },
  });

  revalidatePath('/posts');
  redirect('/posts');
}

/** 게시글 수정 서버 액션 */
export async function updatePost(formData: FormData, postId: number) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const imageFile = formData.get('image') as File | null;
  const removeImage = formData.get('removeImage') === 'true';

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { imageUrl: true },
  });

  let imageUrl: string | null | undefined = undefined;

  if (removeImage && existingPost?.imageUrl) {
    await deleteImage(existingPost.imageUrl);
    imageUrl = null;
  } else if (imageFile && imageFile.size > 0) {
    if (existingPost?.imageUrl) {
      await deleteImage(existingPost.imageUrl);
    }

    const imageFormData = new FormData();
    imageFormData.append('image', imageFile);
    const uploadResult = await uploadImage(imageFormData);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || '이미지 업로드 실패');
    }
    imageUrl = uploadResult.url || null;
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      content,
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });

  revalidatePath('/posts');
  revalidatePath(`/posts/${postId}`);
  redirect('/posts');
}

/** 게시글 삭제 서버 액션 */
export async function deletePost(postId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { imageUrl: true },
  });

  if (post?.imageUrl) {
    await deleteImage(post.imageUrl);
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath('/posts');
  redirect('/posts');
}

/** 게시글 다중 삭제 서버 액션 */
export async function deleteMultiplePosts(postIds: number[], userId: number) {
  const posts = await prisma.post.findMany({
    where: {
      id: { in: postIds },
      authorId: userId,
    },
    select: { imageUrl: true },
  });

  for (const post of posts) {
    if (post.imageUrl) {
      await deleteImage(post.imageUrl);
    }
  }

  await prisma.post.deleteMany({
    where: {
      id: { in: postIds },
      authorId: userId,
    },
  });

  revalidatePath('/posts');
}
