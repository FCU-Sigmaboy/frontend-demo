import { supabase } from '../lib/supabase';

/**
 * 上傳單張圖片到 Supabase Storage
 * @param {File} file - 要上傳的圖片檔案
 * @param {string} fileName - 在 Supabase 中儲存的檔案名稱 (包含路徑)
 * @returns {Promise<string>} - 成功則回傳圖片的公開 URL
 */
export async function uploadImage(file, fileName) {
  const { data, error } = await supabase.storage
    .from('images') // 指定您的儲存桶名稱
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true, // true = 覆蓋同名檔案, false = 如果已存在則拋出錯誤
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`圖片上傳失敗: ${error.message}`);
  }

  // 獲取公開 URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  if (!publicUrl) {
    throw new Error('無法獲取圖片的公開 URL。');
  }

  return publicUrl;
}
