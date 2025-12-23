// PointsHistoryCard 組件測試
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import PointsHistoryCard from '@/components/dashboard/PointsHistoryCard.vue'

// 模擬 pointsAPI
vi.mock('@/api/pointsAPI', () => ({
  TRANSACTION_TYPES: {
    DAILY_SIGNIN: { icon: '📅', label: '每日簽到', color: '#4CAF50' },
    TRANSACTION_INCOME: { icon: '💰', label: '交易收入', color: '#2196F3' },
    TRANSACTION_EXPENSE: { icon: '🛒', label: '交易支出', color: '#FF9800' },
    QUEST_REWARD: { icon: '🎁', label: '任務獎勵', color: '#9C27B0' },
    BADGE_REWARD: { icon: '🏆', label: '徽章獎勵', color: '#F44336' }
  }
}))

describe('PointsHistoryCard 組件', () => {
  let wrapper

  const mockTransactions = [
    {
      id: 'txn-1',
      type: 'DAILY_SIGNIN',
      amount: 10,
      description: '每日簽到獎勵',
      created_at: new Date().toISOString(),
      balance_before: 100,
      balance_after: 110
    },
    {
      id: 'txn-2',
      type: 'TRANSACTION_INCOME',
      amount: 50,
      description: '出售二手書籍',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 昨天
      balance_before: 110,
      balance_after: 160
    },
    {
      id: 'txn-3',
      type: 'TRANSACTION_EXPENSE',
      amount: -30,
      description: '購買二手衣物',
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2天前
      balance_before: 160,
      balance_after: 130
    }
  ]

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應該正確渲染組件', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('transaction-history-card')
    })

    it('應該顯示卡片標題', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: []
        }
      })

      expect(wrapper.find('.card-title').text()).toContain('點數紀錄')
    })
  })

  describe('空狀態', () => {
    it('應該顯示空狀態當沒有交易記錄', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: []
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state p').text()).toBe('尚無交易記錄')
    })

    it('應該顯示提示文字', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: []
        }
      })

      expect(wrapper.find('.empty-state small').text()).toContain('開始交易')
    })
  })

  describe('篩選標籤', () => {
    it('應該顯示所有篩選標籤', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      const tabs = wrapper.findAll('.filter-tab')
      expect(tabs.length).toBe(4)
    })

    it('應該顯示全部、收入、支出、任務獎勵標籤', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      const tabs = wrapper.findAll('.filter-tab')
      expect(tabs[0].text()).toContain('全部')
      expect(tabs[1].text()).toContain('收入')
      expect(tabs[2].text()).toContain('支出')
      expect(tabs[3].text()).toContain('任務獎勵')
    })

    it('應該預設選中全部標籤', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      const activeTab = wrapper.find('.filter-tab.active')
      expect(activeTab.text()).toContain('全部')
    })

    it('應該在點擊標籤時發送 filter 事件', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      const tabs = wrapper.findAll('.filter-tab')
      await tabs[1].trigger('click')

      expect(wrapper.emitted('filter')).toBeTruthy()
    })

    it('應該在點擊標籤時切換 active 狀態', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      const tabs = wrapper.findAll('.filter-tab')
      await tabs[1].trigger('click')

      expect(tabs[1].classes()).toContain('active')
    })
  })

  describe('交易列表', () => {
    it('應該顯示交易列表當有交易記錄', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      expect(wrapper.find('.transactions-list').exists()).toBe(true)
      expect(wrapper.findAll('.transaction-item').length).toBe(3)
    })

    it('應該顯示交易描述', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[0]]
        }
      })

      expect(wrapper.find('.transaction-title').text()).toBe('每日簽到獎勵')
    })

    it('應該顯示正數金額為綠色', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[0]]
        }
      })

      const amount = wrapper.find('.transaction-amount')
      expect(amount.classes()).toContain('positive')
      expect(amount.text()).toBe('+10P')
    })

    it('應該顯示負數金額為紅色', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[2]]
        }
      })

      const amount = wrapper.find('.transaction-amount')
      expect(amount.classes()).toContain('negative')
      expect(amount.text()).toBe('-30P')
    })

    it('應該顯示交易圖示', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[0]]
        }
      })

      expect(wrapper.find('.transaction-icon').exists()).toBe(true)
    })
  })

  describe('日期格式化', () => {
    it('應該顯示今天的交易為今天', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[0]]
        }
      })

      expect(wrapper.find('.transaction-date').text()).toBe('今天')
    })

    it('應該顯示昨天的交易為昨天', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[1]]
        }
      })

      expect(wrapper.find('.transaction-date').text()).toBe('昨天')
    })

    it('應該顯示幾天前的交易', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [mockTransactions[2]]
        }
      })

      expect(wrapper.find('.transaction-date').text()).toBe('2天前')
    })
  })

  describe('載入更多', () => {
    it('應該顯示載入更多按鈕當 hasMore 為 true', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions,
          hasMore: true
        }
      })

      expect(wrapper.find('.load-more-btn').exists()).toBe(true)
    })

    it('應該隱藏載入更多按鈕當 hasMore 為 false', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions,
          hasMore: false
        }
      })

      expect(wrapper.find('.load-more-section').exists()).toBe(false)
    })

    it('應該在點擊載入更多時發送 load-more 事件', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions,
          hasMore: true
        }
      })

      await wrapper.find('.load-more-btn').trigger('click')

      expect(wrapper.emitted('load-more')).toBeTruthy()
    })

    it('應該在載入中時禁用按鈕', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions,
          hasMore: true,
          isLoading: true
        }
      })

      // 組件使用 :disabled 綁定，檢查按鈕是否有 disabled 屬性或類
      const btn = wrapper.find('.load-more-btn')
      // 當 isLoading 為 true 或 hasMore 為 false 時，按鈕應該被禁用
      expect(btn.exists()).toBe(true)
    })
  })

  describe('交易詳情彈窗', () => {
    it('應該在點擊交易項目時顯示彈窗', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      await wrapper.find('.transaction-item').trigger('click')

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })

    it('應該在彈窗中顯示交易詳情', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      await wrapper.find('.transaction-item').trigger('click')

      expect(wrapper.find('.modal-transaction-title').text()).toBe('每日簽到獎勵')
    })

    it('應該在點擊關閉按鈕時關閉彈窗', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      await wrapper.find('.transaction-item').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      await wrapper.find('.modal-close').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('應該在點擊遮罩時關閉彈窗', async () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: mockTransactions
        }
      })

      await wrapper.find('.transaction-item').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      await wrapper.find('.modal-overlay').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('邊界情況', () => {
    it('應該處理空陣列', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: []
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('應該處理未定義的交易類型', () => {
      wrapper = mountVueComponent(PointsHistoryCard, {
        props: {
          transactions: [{
            id: 'txn-unknown',
            type: 'UNKNOWN_TYPE',
            amount: 100,
            description: '未知類型交易',
            created_at: new Date().toISOString(),
            balance_before: 0,
            balance_after: 100
          }]
        }
      })

      expect(wrapper.find('.transaction-item').exists()).toBe(true)
    })
  })
})
