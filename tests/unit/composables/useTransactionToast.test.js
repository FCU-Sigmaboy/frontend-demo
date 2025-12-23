import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTransactionToast } from '@/composables/useTransactionToast.js'

// 模擬 bootstrap-vue-next
vi.mock('bootstrap-vue-next', () => ({
  useToast: vi.fn()
}))

import { useToast } from 'bootstrap-vue-next'

describe('useTransactionToast', () => {
  let mockShow
  let mockTransaction

  beforeEach(() => {
    vi.clearAllMocks()

    // 模擬 toast show 函數
    mockShow = vi.fn()
    useToast.mockReturnValue({ show: mockShow })

    // 模擬交易資料
    mockTransaction = {
      transaction_id: 'txn-123',
      item_title: '測試商品',
      other_user_nickname: '測試用戶',
      status: 'waiting'
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize useToast correctly', () => {
      // Act
      useTransactionToast()

      // Assert
      expect(useToast).toHaveBeenCalledOnce()
    })

    it('should return all toast methods', () => {
      // Act
      const toastMethods = useTransactionToast()

      // Assert
      expect(typeof toastMethods.showTransactionReceivedToast).toBe('function')
      expect(typeof toastMethods.showTransactionAcceptedToast).toBe('function')
      expect(typeof toastMethods.showTransactionCompletedToast).toBe('function')
      expect(typeof toastMethods.showTransactionRejectedToast).toBe('function')
      expect(typeof toastMethods.showTransactionCancelledToast).toBe('function')
    })
  })

  describe('showTransactionReceivedToast', () => {
    it('should show correct toast for received transaction', () => {
      // Arrange
      const { showTransactionReceivedToast } = useTransactionToast()

      // Act
      showTransactionReceivedToast(mockTransaction)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🔔 新交易請求',
        body: '測試用戶 想要交易\n測試商品',
        variant: 'info',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle missing user name gracefully', () => {
      // Arrange
      const { showTransactionReceivedToast } = useTransactionToast()
      const transactionWithoutUser = { ...mockTransaction, other_user_nickname: null }

      // Act
      showTransactionReceivedToast(transactionWithoutUser)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🔔 新交易請求',
        body: '對方 想要交易\n測試商品',
        variant: 'info',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle missing item title gracefully', () => {
      // Arrange
      const { showTransactionReceivedToast } = useTransactionToast()
      const transactionWithoutItem = { ...mockTransaction, item_title: null }

      // Act
      showTransactionReceivedToast(transactionWithoutItem)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🔔 新交易請求',
        body: '測試用戶 想要交易\n物品',
        variant: 'info',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle null transaction gracefully', () => {
      // Arrange
      const { showTransactionReceivedToast } = useTransactionToast()

      // Act
      showTransactionReceivedToast(null)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🔔 新交易請求',
        body: '對方 想要交易\n物品',
        variant: 'info',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })
  })

  describe('showTransactionAcceptedToast', () => {
    it('should show correct toast for accepted transaction', () => {
      // Arrange
      const { showTransactionAcceptedToast } = useTransactionToast()

      // Act
      showTransactionAcceptedToast(mockTransaction)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '✅ 交易已接受',
        body: '測試用戶 已接受交易\n測試商品',
        variant: 'success',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle missing data gracefully', () => {
      // Arrange
      const { showTransactionAcceptedToast } = useTransactionToast()

      // Act
      showTransactionAcceptedToast({})

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '✅ 交易已接受',
        body: '對方 已接受交易\n物品',
        variant: 'success',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })
  })

  describe('showTransactionCompletedToast', () => {
    it('should show correct toast for completed transaction', () => {
      // Arrange
      const { showTransactionCompletedToast } = useTransactionToast()

      // Act
      showTransactionCompletedToast(mockTransaction)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🎉 交易已完成',
        body: '恭喜！測試商品 交易成功',
        variant: 'success',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle missing item title gracefully', () => {
      // Arrange
      const { showTransactionCompletedToast } = useTransactionToast()

      // Act
      showTransactionCompletedToast({})

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🎉 交易已完成',
        body: '恭喜！物品 交易成功',
        variant: 'success',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })
  })

  describe('showTransactionRejectedToast', () => {
    it('should show correct toast for rejected transaction', () => {
      // Arrange
      const { showTransactionRejectedToast } = useTransactionToast()

      // Act
      showTransactionRejectedToast(mockTransaction)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '❌ 交易已拒絕',
        body: '測試用戶 拒絕了交易\n測試商品',
        variant: 'warning',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle missing data gracefully', () => {
      // Arrange
      const { showTransactionRejectedToast } = useTransactionToast()

      // Act
      showTransactionRejectedToast({})

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '❌ 交易已拒絕',
        body: '對方 拒絕了交易\n物品',
        variant: 'warning',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })
  })

  describe('showTransactionCancelledToast', () => {
    it('should show correct toast when other user cancels', () => {
      // Arrange
      const { showTransactionCancelledToast } = useTransactionToast()

      // Act
      showTransactionCancelledToast(mockTransaction)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🚫 交易已取消',
        body: '測試用戶 取消了交易\n測試商品',
        variant: 'secondary',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should show correct toast when current user cancels', () => {
      // Arrange
      const { showTransactionCancelledToast } = useTransactionToast()
      const transactionWithoutOtherUser = { ...mockTransaction, other_user_nickname: null }

      // Act
      showTransactionCancelledToast(transactionWithoutOtherUser)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🚫 交易已取消',
        body: '你取消了交易\n測試商品',
        variant: 'secondary',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle missing item title gracefully', () => {
      // Arrange
      const { showTransactionCancelledToast } = useTransactionToast()
      const transactionWithoutItem = { ...mockTransaction, item_title: null }

      // Act
      showTransactionCancelledToast(transactionWithoutItem)

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🚫 交易已取消',
        body: '測試用戶 取消了交易\n物品',
        variant: 'secondary',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })

    it('should handle completely empty transaction', () => {
      // Arrange
      const { showTransactionCancelledToast } = useTransactionToast()

      // Act
      showTransactionCancelledToast({})

      // Assert
      expect(mockShow).toHaveBeenCalledWith({
        title: '🚫 交易已取消',
        body: '你取消了交易\n物品',
        variant: 'secondary',
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      })
    })
  })

  describe('toast configuration', () => {
    it('should use consistent toast options across all methods', () => {
      // Arrange
      const toastMethods = useTransactionToast()
      const expectedOptions = {
        pos: 'top-end',
        value: 0,
        toasterClass: 'custom-toast-position'
      }

      // Act - call each method
      toastMethods.showTransactionReceivedToast(mockTransaction)
      toastMethods.showTransactionAcceptedToast(mockTransaction)
      toastMethods.showTransactionCompletedToast(mockTransaction)
      toastMethods.showTransactionRejectedToast(mockTransaction)
      toastMethods.showTransactionCancelledToast(mockTransaction)

      // Assert - all calls should include the expected options
      expect(mockShow).toHaveBeenCalledTimes(5)
      mockShow.mock.calls.forEach(call => {
        const [options] = call
        expect(options).toMatchObject(expectedOptions)
      })
    })

    it('should use correct variants for different toast types', () => {
      // Arrange
      const toastMethods = useTransactionToast()

      // Act & Assert
      toastMethods.showTransactionReceivedToast(mockTransaction)
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'info' }))

      toastMethods.showTransactionAcceptedToast(mockTransaction)
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'success' }))

      toastMethods.showTransactionCompletedToast(mockTransaction)
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'success' }))

      toastMethods.showTransactionRejectedToast(mockTransaction)
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'warning' }))

      toastMethods.showTransactionCancelledToast(mockTransaction)
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({ variant: 'secondary' }))
    })
  })

  describe('helper functions', () => {
    it('should extract item name correctly', () => {
      // This tests the internal getItemName function indirectly
      const { showTransactionCompletedToast } = useTransactionToast()

      // Test with item_title
      showTransactionCompletedToast({ item_title: '特殊商品' })
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({
        body: '恭喜！特殊商品 交易成功'
      }))

      // Test with empty item_title
      showTransactionCompletedToast({ item_title: '' })
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({
        body: '恭喜！物品 交易成功'
      }))
    })

    it('should extract other user name correctly', () => {
      // This tests the internal getOtherUserName function indirectly
      const { showTransactionAcceptedToast } = useTransactionToast()

      // Test with other_user_nickname
      showTransactionAcceptedToast({ other_user_nickname: '特殊用戶', item_title: '商品' })
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({
        body: '特殊用戶 已接受交易\n商品'
      }))

      // Test with empty other_user_nickname
      showTransactionAcceptedToast({ other_user_nickname: '', item_title: '商品' })
      expect(mockShow).toHaveBeenLastCalledWith(expect.objectContaining({
        body: '對方 已接受交易\n商品'
      }))
    })
  })

  describe('error handling', () => {
    it('should handle toast show function being undefined', () => {
      // Arrange
      useToast.mockReturnValue({ show: undefined })
      const { showTransactionReceivedToast } = useTransactionToast()

      // Act & Assert - should not throw
      expect(() => showTransactionReceivedToast(mockTransaction)).not.toThrow()
    })

    it('should handle toast show function throwing error', () => {
      // Arrange
      const mockShowWithError = vi.fn().mockImplementation(() => {
        throw new Error('Toast error')
      })
      useToast.mockReturnValue({ show: mockShowWithError })
      const { showTransactionReceivedToast } = useTransactionToast()

      // Act & Assert - should not throw (error should be caught internally if handled)
      expect(() => showTransactionReceivedToast(mockTransaction)).toThrow('Toast error')
    })
  })
})