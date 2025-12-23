// PointsBalanceCard 組件測試
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard.vue'

// 模擬 usePointsProfile composable
vi.mock('@/composables/usePointsProfile', () => ({
  usePointsProfile: vi.fn(() => ({
    profile: { value: null },
    isLoadingProfile: { value: false },
    profileError: { value: null },
    fetchPointsProfile: vi.fn().mockResolvedValue({
      current_balance: 1500,
      total_earned: 3000,
      total_spent: 1500
    })
  }))
}))

// 模擬 vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

describe('PointsBalanceCard 組件', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應該正確渲染組件', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: 1000,
          totalEarned: 2000,
          totalSpent: 1000,
          autoFetch: false
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('points-balance-card')
    })

    it('應該顯示卡片標題', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: 1000,
          autoFetch: false
        }
      })

      expect(wrapper.find('.card-title').text()).toContain('點數餘額')
    })

    it('應該顯示當前餘額標籤', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: 1000,
          autoFetch: false
        }
      })

      expect(wrapper.find('.balance-label').text()).toBe('當前可用點數')
    })
  })

  describe('Props 處理', () => {
    it('應該正確顯示 currentBalance prop', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: 5000,
          autoFetch: false
        }
      })

      expect(wrapper.find('.amount-value').text()).toBe('5,000')
    })

    it('應該正確顯示 totalEarned prop', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          totalEarned: 10000,
          autoFetch: false
        }
      })

      expect(wrapper.find('.stat-item.earning .stat-value').text()).toBe('10,000P')
    })

    it('應該正確顯示 totalSpent prop', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          totalSpent: 3500,
          autoFetch: false
        }
      })

      expect(wrapper.find('.stat-item.spending .stat-value').text()).toBe('3,500P')
    })

    it('應該使用預設值當 props 未提供時', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          autoFetch: false
        }
      })

      expect(wrapper.find('.amount-value').text()).toBe('0')
    })

    it('應該正確格式化大數字', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: 1234567,
          autoFetch: false
        }
      })

      expect(wrapper.find('.amount-value').text()).toBe('1,234,567')
    })
  })

  describe('按鈕互動', () => {
    it('應該渲染查看點數記錄按鈕', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: { autoFetch: false }
      })

      const primaryBtn = wrapper.find('.action-btn.primary')
      expect(primaryBtn.exists()).toBe(true)
      expect(primaryBtn.text()).toContain('查看點數記錄')
    })

    it('應該渲染賺取點數按鈕', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: { autoFetch: false }
      })

      const secondaryBtn = wrapper.find('.action-btn.secondary')
      expect(secondaryBtn.exists()).toBe(true)
      expect(secondaryBtn.text()).toContain('賺取點數')
    })
  })

  describe('統計區塊', () => {
    it('應該顯示累計收入區塊', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          totalEarned: 5000,
          autoFetch: false
        }
      })

      const earningSection = wrapper.find('.stat-item.earning')
      expect(earningSection.exists()).toBe(true)
      expect(earningSection.find('.stat-label').text()).toBe('累計收入')
    })

    it('應該顯示累計支出區塊', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          totalSpent: 2000,
          autoFetch: false
        }
      })

      const spendingSection = wrapper.find('.stat-item.spending')
      expect(spendingSection.exists()).toBe(true)
      expect(spendingSection.find('.stat-label').text()).toBe('累計支出')
    })
  })

  describe('邊界情況', () => {
    it('應該處理零值', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
          autoFetch: false
        }
      })

      expect(wrapper.find('.amount-value').text()).toBe('0')
      expect(wrapper.find('.stat-item.earning .stat-value').text()).toBe('0P')
      expect(wrapper.find('.stat-item.spending .stat-value').text()).toBe('0P')
    })

    it('應該處理非數字值並轉換為 0', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: NaN,
          autoFetch: false
        }
      })

      expect(wrapper.find('.amount-value').text()).toBe('0')
    })

    it('應該處理 undefined 值', () => {
      wrapper = mountVueComponent(PointsBalanceCard, {
        props: {
          currentBalance: undefined,
          autoFetch: false
        }
      })

      expect(wrapper.find('.amount-value').text()).toBe('0')
    })
  })
})
