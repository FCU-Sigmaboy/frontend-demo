import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

// ===================================================================
// ### 圖片壓縮與上傳 API (Image Compression & Upload APIs)
// ===================================================================

/**
 * 【功能】壓縮圖片
 * @param {File} file - 圖片檔案
 * @returns {Promise<File>} - 回傳壓縮後的圖片檔案
 */
export async function compressImage(file) {
    const options = {
        maxSizeMB: 0.3,              // 限制 300KB
        maxWidthOrHeight: 1000,      // 最大解析度
        useWebWorker: true,          // 使用多執行緒
        fileType: 'image/webp'       // 轉換為 WebP
    };

    try {
        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original file
    }
}

/**
 * 【功能】產生安全的檔名（移除特殊字元和中文）
 * @param {string} originalName - 原始檔名
 * @returns {string} - 安全的檔名
 */
function generateSafeFilename(originalName) {
    // 取得副檔名
    const extension = originalName.split('.').pop().toLowerCase();

    // 產生唯一的檔名：時間戳 + 隨機字串
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);

    return `${timestamp}-${randomStr}.${extension}`;
}

/**
 * 【功能】上傳單張圖片到 Supabase Storage
 * @param {File} file - 圖片檔案
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 物品 ID (可用臨時 ID)
 * @param {boolean} shouldCompress - 是否需要壓縮（預設 true）
 * @returns {Promise<string>} - 回傳圖片的公開 URL
 *
 * @example
 * // 自動壓縮（建議）
 * const url = await uploadItemImage(file, userId, itemId);
 *
 * @example
 * // 檔案已經壓縮過，跳過壓縮
 * const url = await uploadItemImage(compressedFile, userId, itemId, false);
 */
export async function uploadItemImage(file, userId, itemId, shouldCompress = true) {
    // 如果需要壓縮，則先壓縮
    const fileToUpload = shouldCompress ? await compressImage(file) : file;

    // 產生安全的檔名（避免中文或特殊字元）
    const safeFilename = generateSafeFilename(fileToUpload.name);
    const filePath = `${userId}/${itemId}/${safeFilename}`;

    // 上傳檔案到 items bucket
    const { data, error } = await supabase.storage
        .from('items')
        .upload(filePath, fileToUpload, {
            cacheControl: 'public, max-age=31536000, immutable',
            upsert: false
        });

    if (error) {
        console.error('圖片上傳失敗:', error);
        throw new Error(error.message);
    }

    // 獲取公開 URL
    const { data: { publicUrl } } = supabase.storage
        .from('items')
        .getPublicUrl(data.path, { download: false });

    return publicUrl;
}

/**
 * 【功能】批次上傳多張圖片
 * @param {File[]} files - 圖片檔案陣列
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 物品 ID (可用臨時 ID)
 * @param {boolean} shouldCompress - 是否需要壓縮（預設 true）
 * @returns {Promise<string[]>} - 回傳所有圖片的 URL 陣列
 */
export async function uploadItemImages(files, userId, itemId, shouldCompress = true) {
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = files.map(file =>
        uploadItemImage(file, userId, itemId, shouldCompress)
    );

    return Promise.all(uploadPromises);
}

/**
 * 【功能】上傳大頭貼到 Supabase Storage (自動壓縮)
 * @param {File} file - 圖片檔案
 * @param {string} userId - 使用者 ID
 * @param {boolean} shouldCompress - 是否需要壓縮（預設 true）
 * @returns {Promise<string>} - 回傳圖片的公開 URL
 *
 * @example
 * // 上傳大頭貼（自動壓縮）
 * const avatarUrl = await uploadProfilePicture(file, userId);
 *
 * // 然後更新 profile
 * await updateMyProfile({ profile_picture_url: avatarUrl }, null, null);
 */
export async function uploadProfilePicture(file, userId, shouldCompress = true) {
    // 如果需要壓縮，則先壓縮
    const fileToUpload = shouldCompress ? await compressImage(file) : file;

    // 產生安全的檔名（避免中文或特殊字元）
    const safeFilename = generateSafeFilename(fileToUpload.name);
    const filePath = `${userId}/${safeFilename}`;

    // 上傳檔案到 avatars bucket
    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileToUpload, {
            cacheControl: 'public, max-age=31536000, immutable',
            upsert: true // 允許覆蓋舊頭貼
        });

    if (error) {
        console.error('大頭貼上傳失敗:', error);
        throw new Error(error.message);
    }

    // 獲取公開 URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path, { download: false });

    console.log(`✅ 大頭貼上傳成功: ${publicUrl}`);
    return publicUrl;
}
