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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey || serviceKey === 'your-supabase-service-role-key') {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return { success: false, error: 'Supabase 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.' };
  }

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

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error.message, error);
      return { success: false, error: `이미지 업로드 실패: ${error.message}` };
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    console.error('Upload exception:', err);
    return { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' };
  }
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
