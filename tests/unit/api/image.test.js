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

// Factory mock
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

describe.sequential('image API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageCompression.mockClear();
    
    // Default safe fallback (can be overridden by tests using mockReturnValueOnce)
    supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } })
    });
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.functions.invoke.mockResolvedValue({ data: {}, error: null });
  });

  describe('compressImage', () => {
    it('應該成功壓縮圖片', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCompressedFile = new File(['compressed'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 500 });
      Object.defineProperty(mockCompressedFile, 'size', { value: 1024 * 200 });
      
      imageCompression.mockResolvedValueOnce(mockCompressedFile);

      const result = await compressImage(mockFile);

      expect(result).toBe(mockCompressedFile);
    });

    it('應該在壓縮失敗時返回原始文件', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      imageCompression.mockRejectedValueOnce(new Error('Compression failed'));

      const result = await compressImage(mockFile);
      expect(result).toBe(mockFile);
    });
  });

  describe('uploadItemImage', () => {
    it('應該成功上傳物品圖片', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const publicUrl = 'https://example.com/image.webp';
      
      imageCompression.mockResolvedValueOnce(new File(['c'], 'c.webp'));

      // Local mock
      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } });
      const mockBucket = { upload: mockUpload, getPublicUrl: mockGetPublicUrl };

      // Force return this bucket
      supabase.storage.from.mockReturnValue(mockBucket);

      const result = await uploadItemImage(mockFile, 'u1', 'i1');

      expect(result).toBe(publicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith('items');
    });

    it('應該在不壓縮的情況下上傳', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const publicUrl = 'https://example.com/image.jpg';

      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } });
      
      supabase.storage.from.mockReturnValue({ 
        upload: mockUpload, 
        getPublicUrl: mockGetPublicUrl 
      });

      await uploadItemImage(mockFile, 'u1', 'i1', false);

      // Instead of relying on global call count which is flaky in parallel:
      // Verify that upload was called with the ORIGINAL file (mockFile)
      // If compression ran, it would be a different file (unless compression returns original, but we didn't mock it to)
      expect(mockUpload).toHaveBeenCalledWith(expect.stringContaining('u1/i1/'), mockFile, expect.anything());
    });

    it('應該在上傳失敗時拋出錯誤', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const errorMessage = 'Upload failed';

      imageCompression.mockResolvedValueOnce(mockFile);
      
      const mockBucket = {
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
        getPublicUrl: vi.fn(),
      };
      supabase.storage.from.mockReturnValue(mockBucket);

      await expect(uploadItemImage(mockFile, 'u1', 'i1')).rejects.toThrow(errorMessage);
    });
  });

  describe('uploadItemImages', () => {
    it('應該成功批次上傳多張圖片', async () => {
      const mockFiles = [
        new File(['1'], '1.jpg', { type: 'image/jpeg' }),
        new File(['2'], '2.jpg', { type: 'image/jpeg' })
      ];
      
      imageCompression.mockResolvedValue(mockFiles[0]); // For first file
      imageCompression.mockResolvedValue(mockFiles[1]); // For second file - wait, mockResolvedValue is persistent

      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
      const mockGetPublicUrl = vi.fn()
         .mockReturnValueOnce({ data: { publicUrl: 'url1' } })
         .mockReturnValueOnce({ data: { publicUrl: 'url2' } });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      const result = await uploadItemImages(mockFiles, 'u1', 'i1');

      expect(result).toEqual(['url1', 'url2']);
    });

    it('應該在沒有文件時返回空陣列', async () => {
      const result = await uploadItemImages([], 'u', 'i');
      expect(result).toEqual([]);
    });
  });

  describe('uploadProfilePicture', () => {
    it('應該成功上傳大頭貼', async () => {
      const mockFile = new File(['a'], 'avatar.jpg', { type: 'image/jpeg' });
      const publicUrl = 'https://ex.com/avatar.webp';
      
      imageCompression.mockResolvedValueOnce(new File(['c'], 'c.webp'));

      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      const result = await uploadProfilePicture(mockFile, 'u1');

      expect(result).toBe(publicUrl);
    });

    it('應該跳過 GIF 的壓縮', async () => {
      const mockFile = new File(['g'], 'avatar.gif', { type: 'image/gif' });
      const publicUrl = 'https://ex.com/avatar.gif';

      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } });
      
      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      await uploadProfilePicture(mockFile, 'u1');

      expect(mockUpload).toHaveBeenCalledWith(expect.anything(), mockFile, expect.anything());
    });

    it('應該在上傳失敗時拋出錯誤', async () => {
      const mockFile = new File(['f'], 'fail.jpg', { type: 'image/jpeg' });
      imageCompression.mockResolvedValue(mockFile);
      
      const mockBucket = {
        upload: vi.fn().mockResolvedValue({ error: { message: 'err' } }),
        getPublicUrl: vi.fn()
      };
      supabase.storage.from.mockReturnValue(mockBucket);

      await expect(uploadProfilePicture(mockFile, 'u1')).rejects.toThrow('err');
    });
  });

  describe('analyzeItemImage', () => {
    it('應該成功分析圖片', async () => {
      const mockData = { title: 'T', description: 'D', category: 'C' };
      
      supabase.auth.getSession.mockResolvedValue({ 
        data: { session: { access_token: 'valid' } }, 
        error: null 
      });

      supabase.functions.invoke.mockResolvedValue({
        data: { success: true, data: mockData },
        error: null
      });

      const result = await analyzeItemImage('http://img');
      expect(result).toEqual(mockData);
    });

    it('應該在未登入時拋出錯誤', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      await expect(analyzeItemImage('u')).rejects.toThrow('使用者未登入');
    });

    it('應該在 Edge Function 失敗時拋出錯誤', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'v' } } });
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'EF Error' }
      });
      await expect(analyzeItemImage('u')).rejects.toThrow('EF Error');
    });

    it('應該在回應失敗時拋出錯誤', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'v' } } });
      // Ensure the return value structure enables the 'if (!data.success)' check to fail
      supabase.functions.invoke.mockResolvedValue({
        data: { success: false, error: 'App Error' },
        error: null
      });
      await expect(analyzeItemImage('u')).rejects.toThrow('App Error');
    });
  });
});
