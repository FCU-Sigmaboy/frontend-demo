import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  updateMyItem, 
  toggleItemStatus, 
  relistMyItem, 
  unlistItem, 
  deleteMyItem 
} from '@/api/update_myItemAPI'
import { supabase } from '@/lib/supabase'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        }))
      }))
    })),
    rpc: vi.fn()
  }
}))

describe('update_myItemAPI', () => {
  const mockUser = { id: 'user-123' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateMyItem', () => {
    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      await expect(updateMyItem(1, { title: '測試' }))
        .rejects.toThrow('使用者未登入，無法更新物品')
    })

    it('should throw error when update fails', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { message: '資料庫錯誤' } 
              })
            })
          })
        })
      })

      supabase.from.mockReturnValue({ update: mockUpdate })

      await expect(updateMyItem(1, { title: '測試' }))
        .rejects.toThrow('資料庫錯誤')
    })
  })

  // toggleItemStatus 是一個包裝函數,它會在內部呼叫 relistMyItem 或 unlistItem
  // 這兩個函數已經在下面單獨測試,所以這裡不需要額外的測試

  describe('relistMyItem', () => {
    it('should relist item successfully', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockResult = { 
        success: true, 
        message: '物品已重新上架',
        item_id: 1,
        new_listing_status: true
      }

      supabase.rpc.mockResolvedValueOnce({ data: mockResult, error: null })

      const result = await relistMyItem(1)

      expect(supabase.rpc).toHaveBeenCalledWith('relist_item', { p_item_id: 1 })
      expect(result).toEqual(mockResult)
    })

    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      await expect(relistMyItem(1))
        .rejects.toThrow('使用者未登入')
    })

    it('should throw error when item has active transaction', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: '此物品已綁定於一個進行中或已完成的交易，無法重新上架' } 
      })

      await expect(relistMyItem(1))
        .rejects.toThrow('此物品已綁定於一個進行中或已完成的交易，無法重新上架')
    })

    it('should throw error when item is already listed', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: '物品已經是上架狀態' } 
      })

      await expect(relistMyItem(1))
        .rejects.toThrow('物品已經是上架狀態')
    })
  })

  describe('unlistItem', () => {
    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      await expect(unlistItem(1))
        .rejects.toThrow('使用者未登入')
    })

    it('should throw error when item has pending transaction', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      supabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: '物品正在交易中，無法下架。請先取消該筆交易。' } 
      })

      await expect(unlistItem(1))
        .rejects.toThrow('物品正在交易中，無法下架。請先取消該筆交易。')
    })
  })

  describe('deleteMyItem', () => {
    it('should throw error when user is not logged in', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: null }, 
        error: null 
      })

      await expect(deleteMyItem(1))
        .rejects.toThrow('使用者未登入，無法刪除物品')
    })

    it('should throw error when delete fails', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { message: '物品不存在或已被刪除' } 
              })
            })
          })
        })
      })

      supabase.from.mockReturnValue({ delete: mockDelete })

      await expect(deleteMyItem(1))
        .rejects.toThrow('物品不存在或已被刪除')
    })
  })
})
