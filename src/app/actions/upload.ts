'use server';

import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const file = formData.get('image') as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: '이미지 파일이 없습니다.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)' };
  }

  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `posts/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    return { success: false, error: '이미지 업로드에 실패했습니다.' };
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return { success: true, url: publicUrlData.publicUrl };
}

export async function deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!imageUrl) {
    return { success: true };
  }

  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === STORAGE_BUCKET);

    if (bucketIndex === -1) {
      return { success: false, error: '잘못된 이미지 URL입니다.' };
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: '이미지 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: '이미지 삭제 중 오류가 발생했습니다.' };
  }
}
