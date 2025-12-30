import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import {
  compressImage,
  uploadItemImage,
  uploadItemImages,
  uploadProfilePicture,
  analyzeItemImage
} from '@/api/image';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    storage: {
      from: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

vi.mock('browser-image-compression', () => ({
  default: vi.fn()
}));

describe('image API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('compressImage', () => {
    it('應該成功壓縮圖片', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCompressedFile = new File(['compressed'], 'test.webp', { type: 'image/webp' });
      
      Object.defineProperty(mockFile, 'size', { value: 1024 * 500 }); // 500KB
      Object.defineProperty(mockCompressedFile, 'size', { value: 1024 * 200 }); // 200KB
      
      imageCompression.mockResolvedValueOnce(mockCompressedFile);

      // Act
      const result = await compressImage(mockFile);

      // Assert
      expect(result).toBe(mockCompressedFile);
      expect(imageCompression).toHaveBeenCalledWith(mockFile, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
        fileType: 'image/webp'
      });
    });

    it('應該在壓縮失敗時返回原始文件', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      imageCompression.mockRejectedValueOnce(new Error('Compression failed'));

      // Act
      const result = await compressImage(mockFile);

      // Assert
      expect(result).toBe(mockFile);
    });
  });

  describe('uploadItemImage', () => {
    it('應該成功上傳物品圖片', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCompressedFile = new File(['compressed'], 'test.webp', { type: 'image/webp' });
      const userId = 'user-123';
      const itemId = 'item-456';
      const publicUrl = 'https://example.com/image.webp';

      imageCompression.mockResolvedValueOnce(mockCompressedFile);

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/item-456/12345-abc.webp' },
        error: null
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl }
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      // Act
      const result = await uploadItemImage(mockFile, userId, itemId);

      // Assert
      expect(result).toBe(publicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith('items');
    });

    it('應該在不壓縮的情況下上傳', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';
      const itemId = 'item-456';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/item-456/12345-abc.jpg' },
        error: null
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      // Act
      await uploadItemImage(mockFile, userId, itemId, false);

      // Assert
      expect(imageCompression).not.toHaveBeenCalled();
    });

    it('應該在上傳失敗時拋出錯誤', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const errorMessage = 'Upload failed';

      imageCompression.mockResolvedValueOnce(mockFile);

      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage }
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload
      });

      // Act & Assert
      await expect(uploadItemImage(mockFile, 'user-123', 'item-456')).rejects.toThrow(errorMessage);
    });
  });

  describe('uploadItemImages', () => {
    it('應該成功批次上傳多張圖片', async () => {
      // Arrange
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];
      const userId = 'user-123';
      const itemId = 'item-456';

      imageCompression.mockResolvedValue(mockFiles[0]);

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/item-456/12345-abc.webp' },
        error: null
      });

      const mockGetPublicUrl = vi.fn()
        .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/image1.webp' } })
        .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/image2.webp' } });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      // Act
      const result = await uploadItemImages(mockFiles, userId, itemId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('https://example.com/image1.webp');
      expect(result[1]).toBe('https://example.com/image2.webp');
    });

    it('應該在沒有文件時返回空陣列', async () => {
      // Act
      const result = await uploadItemImages([], 'user-123', 'item-456');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('uploadProfilePicture', () => {
    it('應該成功上傳大頭貼', async () => {
      // Arrange
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockCompressedFile = new File(['compressed'], 'avatar.webp', { type: 'image/webp' });
      const userId = 'user-123';
      const publicUrl = 'https://example.com/avatar.webp';

      imageCompression.mockResolvedValueOnce(mockCompressedFile);

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/12345-abc.webp' },
        error: null
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl }
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      // Act
      const result = await uploadProfilePicture(mockFile, userId);

      // Assert
      expect(result).toBe(publicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
    });

    it('應該跳過 GIF 的壓縮', async () => {
      // Arrange
      const mockFile = new File(['test'], 'avatar.gif', { type: 'image/gif' });
      const userId = 'user-123';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/12345-abc.gif' },
        error: null
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.gif' }
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      // Act
      await uploadProfilePicture(mockFile, userId);

      // Assert
      expect(imageCompression).not.toHaveBeenCalled();
    });

    it('應該在上傳失敗時拋出錯誤', async () => {
      // Arrange
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const errorMessage = 'Upload failed';

      imageCompression.mockResolvedValueOnce(mockFile);

      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage }
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload
      });

      // Act & Assert
      await expect(uploadProfilePicture(mockFile, 'user-123')).rejects.toThrow(errorMessage);
    });
  });

  describe('analyzeItemImage', () => {
    it('應該成功分析圖片', async () => {
      // Arrange
      const imageUrl = 'https://example.com/image.jpg';
      const mockAnalysisData = {
        title: 'iPhone 15 Pro',
        description: '全新未拆封',
        category: '3C產品'
      };

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token-123' } },
        error: null
      });

      supabase.functions.invoke.mockResolvedValueOnce({
        data: { success: true, data: mockAnalysisData },
        error: null
      });

      // Act
      const result = await analyzeItemImage(imageUrl);

      // Assert
      expect(result).toEqual(mockAnalysisData);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-item-image', {
        body: { image_url: imageUrl }
      });
    });

    it('應該在未登入時拋出錯誤', async () => {
      // Arrange
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

      // Act & Assert
      await expect(analyzeItemImage('https://example.com/image.jpg')).rejects.toThrow('使用者未登入');
    });

    it('應該在 Edge Function 失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'AI analysis failed';

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token-123' } },
        error: null
      });

      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: errorMessage }
      });

      // Act & Assert
      await expect(analyzeItemImage('https://example.com/image.jpg')).rejects.toThrow(errorMessage);
    });

    it('應該在回應失敗時拋出錯誤', async () => {
      // Arrange
      const errorMessage = 'Analysis failed';

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token-123' } },
        error: null
      });

      supabase.functions.invoke.mockResolvedValueOnce({
        data: { success: false, error: errorMessage },
        error: null
      });

      // Act & Assert
      await expect(analyzeItemImage('https://example.com/image.jpg')).rejects.toThrow(errorMessage);
    });
  });
});
