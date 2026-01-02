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

describe.sequential('update_myItemAPI', () => {
  const mockUser = { id: 'user-123' }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default implementation for supabase.from to avoid "not a function" errors
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
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
    })
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

      const mockSingle = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: '資料庫錯誤' } 
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      })

      supabase.from.mockReturnValueOnce({ update: mockUpdate })

      await expect(updateMyItem(1, { title: '測試' }))
        .rejects.toThrow('資料庫錯誤')
    })

    it('should update item successfully', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockData = { id: 1, title: 'Updated' }
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: mockData, 
        error: null 
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      })

      supabase.from.mockReturnValueOnce({ update: mockUpdate })

      const result = await updateMyItem(1, { title: 'Updated' })
      expect(result).toEqual(mockData)
    })

    it('should validate location ownership when location_id provided', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      // We need to chain TWO calls to supabase.from
      // 1. locations select
      // 2. items update
      
      const mockSelectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 99 }, error: null })
          })
        })
      }
      
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 1, location_id: 99 }, error: null })
            })
          })
        })
      }

      // Mock implementation of supabase.from to return different things based on table name
      supabase.from.mockImplementation((table) => {
        if (table === 'locations') return { select: vi.fn(() => mockSelectChain) }
        if (table === 'items') return { update: vi.fn(() => mockUpdateChain) }
        return {}
      })

      await updateMyItem(1, { location_id: 99 })
    })

    it('should throw error if location is invalid', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockSelectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      }

      supabase.from.mockImplementation((table) => {
        if (table === 'locations') return { select: vi.fn(() => mockSelectChain) }
        return {}
      })

      await expect(updateMyItem(1, { location_id: 999 }))
        .rejects.toThrow('無效的地點 ID')
    })
  })

  describe('toggleItemStatus', () => {
    it('should call relistMyItem when status is true', async () => {
      supabase.auth.getUser
        .mockResolvedValue({ data: { user: mockUser }, error: null })

      supabase.rpc.mockResolvedValue({ 
        data: { success: true }, 
        error: null 
      })

      await toggleItemStatus(1, true)
      
      expect(supabase.rpc).toHaveBeenCalledWith('relist_item', { p_item_id: 1 })
    })

    it('should call unlistItem when status is false', async () => {
      supabase.auth.getUser
        .mockResolvedValue({ data: { user: mockUser }, error: null })

      supabase.rpc.mockResolvedValue({ 
        data: { success: true }, 
        error: null 
      })

      await toggleItemStatus(1, false)
      
      expect(supabase.rpc).toHaveBeenCalledWith('unlist_item', { p_item_id: 1 })
    })
  })

  describe('unlistItem', () => {
    it('should unlist item successfully', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockData = { success: true }
      supabase.rpc.mockResolvedValueOnce({ data: mockData, error: null })

      const result = await unlistItem(1)
      expect(result).toEqual(mockData)
      expect(supabase.rpc).toHaveBeenCalledWith('unlist_item', { p_item_id: 1 })
    })

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
    it('should delete item successfully', async () => {
      supabase.auth.getUser.mockResolvedValueOnce({ 
        data: { user: mockUser }, 
        error: null 
      })

      const mockData = { id: 1 }
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: mockData, 
                error: null 
              })
            })
          })
        })
      })

      supabase.from.mockReturnValue({ delete: mockDelete })

      const result = await deleteMyItem(1)
      expect(result).toEqual(mockData)
    })

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
