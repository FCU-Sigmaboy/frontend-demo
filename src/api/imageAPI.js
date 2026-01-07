import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

// ===================================================================
// ### 圖片壓縮、上傳與 AI 分析整合 API
// ===================================================================

/**
 * 【功能】壓縮圖片
 * @param {File} file - 圖片檔案
 * @returns {Promise<File>} - 回傳壓縮後的圖片檔案
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: 0.3, // 限制 300KB
    maxWidthOrHeight: 1000, // 最大解析度
    useWebWorker: true, // 使用多執行緒
    fileType: 'image/webp', // 轉換為 WebP
  }

  try {
    const compressedFile = await imageCompression(file, options)
    console.log(
      `Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`
    )
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    return file // Fallback to original file
  }
}

/**
 * 【功能】產生安全的檔名（移除特殊字元和中文）
 * @param {string} originalName - 原始檔名
 * @returns {string} - 安全的檔名
 */
function generateSafeFilename(originalName) {
  // 取得副檔名
  const extension = originalName.split('.').pop().toLowerCase()

  // 產生唯一的檔名：時間戳 + 隨機字串
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)

  return `${timestamp}-${randomStr}.${extension}`
}

/**
 * 【功能】上傳單張圖片到 Supabase Storage
 * @param {File} file - 圖片檔案
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 物品 ID (可用臨時 ID)
 * @param {boolean} shouldCompress - 是否需要壓縮（預設 true）
 * @returns {Promise<string>} - 回傳圖片的公開 URL
 */
export async function uploadItemImage(file, userId, itemId, shouldCompress = true) {
  const fileToUpload = shouldCompress ? await compressImage(file) : file

  const safeFilename = generateSafeFilename(fileToUpload.name)
  const filePath = `${userId}/${itemId}/${safeFilename}`

  const { data, error } = await supabase.storage.from('items').upload(filePath, fileToUpload, {
    cacheControl: 'public, max-age=31536000, immutable',
    upsert: false,
  })

  if (error) {
    console.error('圖片上傳失敗:', error)
    throw new Error(error.message)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('items').getPublicUrl(data.path, { download: false })

  return publicUrl
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
    return []
  }

  const uploadPromises = files.map((file) => uploadItemImage(file, userId, itemId, shouldCompress))

  return Promise.all(uploadPromises)
}

/**
 * 【功能】上傳大頭貼到 Supabase Storage (自動壓縮靜態圖片)
 * @param {File} file - 圖片檔案
 * @param {string} userId - 使用者 ID
 * @param {boolean} shouldCompress - 是否需要壓縮（預設 true，但 GIF 會自動跳過壓縮）
 * @returns {Promise<string>} - 回傳圖片的公開 URL
 */
export async function uploadProfilePicture(file, userId, shouldCompress = true) {
  const isAnimated = file.type === 'image/gif'
  const fileToUpload = shouldCompress && !isAnimated ? await compressImage(file) : file

  if (isAnimated) {
    console.log('🎬 Detected GIF animation, skipping compression')
  }

  const safeFilename = generateSafeFilename(fileToUpload.name)
  const filePath = `${userId}/${safeFilename}`

  const { data, error } = await supabase.storage.from('avatars').upload(filePath, fileToUpload, {
    cacheControl: 'public, max-age=31536000, immutable',
    upsert: true,
  })

  if (error) {
    console.error('大頭貼上傳失敗:', error)
    throw new Error(error.message)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(data.path, { download: false })

  console.log(`✅ 大頭貼上傳成功: ${publicUrl}`)
  return publicUrl
}

/**
 * 【功能】使用 AI 分析物品圖片
 * @param {string} imageUrl - 圖片的 URL（已上傳到 Supabase Storage）
 * @returns {Promise<object>} - AI 分析結果
 */
export async function analyzeItemImage(imageUrl) {
  try {
    console.log('[analyzeItemImage] Calling AI to analyze image:', imageUrl)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session) {
      throw new Error('使用者未登入')
    }

    const { data, error } = await supabase.functions.invoke('analyze-item-image', {
      body: {
        image_url: imageUrl,
      },
    })

    if (error) {
      console.error('[analyzeItemImage] AI 分析失敗:', error)
      throw new Error(error.message || 'AI 分析失敗')
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'AI 分析失敗：未知錯誤')
    }

    console.log('[analyzeItemImage] AI 分析成功:', data.data)
    return data.data
  } catch (error) {
    console.error('[analyzeItemImage] AI 分析過程發生錯誤:', error)
    throw error
  }
}

export default {
  compressImage,
  uploadItemImage,
  uploadItemImages,
  uploadProfilePicture,
  analyzeItemImage,
}
