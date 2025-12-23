// BadgesCard 組件測試
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import BadgesCard from '@/components/dashboard/BadgesCard.vue'

describe('BadgesCard 組件', () => {
  let wrapper

  const mockBadges = [
    {
      badge_id: 'badge-1',
      name: '新手上路',
      description: '完成第一次登入',
      icon: '🌟',
      rarity: 'common',
      points_reward: 10,
      points_rewarded: 10,
      category: 'streak',
      earned_at: '2024-12-01T00:00:00.000Z'
    },
    {
      badge_id: 'badge-2',
      name: '交易達人',
      description: '完成10次交易',
      icon: '🏆',
      rarity: 'rare',
      points_reward: 100,
      points_rewarded: 100,
      category: 'transaction',
      earned_at: '2024-12-05T00:00:00.000Z'
    },
    {
      badge_id: 'badge-3',
      name: '環保先鋒',
      description: '減少碳排放100kg',
      icon: '🌍',
      rarity: 'epic',
      points_reward: 500,
      points_rewarded: 500,
      category: 'carbon',
      earned_at: '2024-12-10T00:00:00.000Z'
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
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('badges-card')
    })

    it('應該顯示卡片標題', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: []
        }
      })

      expect(wrapper.find('.card-title').text()).toContain('成就徽章')
    })

    it('應該顯示徽章數量', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      expect(wrapper.find('.count-value').text()).toBe('3')
      expect(wrapper.find('.count-label').text()).toBe('個徽章')
    })
  })

  describe('空狀態', () => {
    it('應該顯示空狀態當沒有徽章', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: []
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state p').text()).toBe('尚未獲得任何徽章')
    })

    it('應該顯示提示文字', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: []
        }
      })

      expect(wrapper.find('.empty-state small').text()).toContain('完成交易')
    })
  })

  describe('徽章列表', () => {
    it('應該顯示徽章網格當有徽章', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      expect(wrapper.find('.badges-grid').exists()).toBe(true)
      expect(wrapper.findAll('.badge-item').length).toBe(3)
    })

    it('應該顯示徽章圖示', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [mockBadges[0]]
        }
      })

      expect(wrapper.find('.badge-icon').text()).toBe('🌟')
    })

    it('應該顯示徽章名稱', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [mockBadges[0]]
        }
      })

      expect(wrapper.find('.badge-name').text()).toBe('新手上路')
    })

    it('應該顯示徽章描述', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [mockBadges[0]]
        }
      })

      expect(wrapper.find('.badge-description').text()).toBe('完成第一次登入')
    })

    it('應該顯示徽章點數獎勵', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [mockBadges[0]]
        }
      })

      expect(wrapper.find('.badge-points').text()).toBe('+10P')
    })
  })

  describe('稀有度顯示', () => {
    it('應該顯示普通稀有度', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [{ ...mockBadges[0], rarity: 'common' }]
        }
      })

      expect(wrapper.find('.badge-item').classes()).toContain('rarity-common')
      expect(wrapper.find('.badge-rarity').text()).toBe('普通')
    })

    it('應該顯示稀有稀有度', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [{ ...mockBadges[0], rarity: 'rare' }]
        }
      })

      expect(wrapper.find('.badge-item').classes()).toContain('rarity-rare')
      expect(wrapper.find('.badge-rarity').text()).toBe('珍稀')
    })

    it('應該顯示史詩稀有度', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [{ ...mockBadges[0], rarity: 'epic' }]
        }
      })

      expect(wrapper.find('.badge-item').classes()).toContain('rarity-epic')
      expect(wrapper.find('.badge-rarity').text()).toBe('史詩')
    })

    it('應該顯示傳說稀有度', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [{ ...mockBadges[0], rarity: 'legendary' }]
        }
      })

      expect(wrapper.find('.badge-item').classes()).toContain('rarity-legendary')
      expect(wrapper.find('.badge-rarity').text()).toBe('傳說')
    })
  })

  describe('分類標籤', () => {
    it('應該顯示所有分類標籤', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      const tabs = wrapper.findAll('.tab-button')
      expect(tabs.length).toBe(5)
      expect(tabs[0].text()).toBe('全部')
    })

    it('應該預設選中全部標籤', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      const activeTab = wrapper.find('.tab-button.active')
      expect(activeTab.text()).toBe('全部')
    })

    it('應該在點擊標籤時切換', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      const tabs = wrapper.findAll('.tab-button')
      await tabs[1].trigger('click')

      expect(tabs[1].classes()).toContain('active')
    })
  })

  describe('徽章篩選', () => {
    it('應該顯示所有徽章當選擇全部', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      expect(wrapper.findAll('.badge-item').length).toBe(3)
    })

    it('應該篩選連續簽到類別徽章', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      const tabs = wrapper.findAll('.tab-button')
      await tabs[1].trigger('click') // 連續簽到

      const badges = wrapper.findAll('.badge-item')
      expect(badges.length).toBe(1)
      expect(wrapper.find('.badge-name').text()).toBe('新手上路')
    })

    it('應該篩選交易成就類別徽章', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      const tabs = wrapper.findAll('.tab-button')
      await tabs[2].trigger('click') // 交易成就

      const badges = wrapper.findAll('.badge-item')
      expect(badges.length).toBe(1)
      expect(wrapper.find('.badge-name').text()).toBe('交易達人')
    })
  })

  describe('徽章詳情彈窗', () => {
    it('應該在點擊徽章時顯示彈窗', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      await wrapper.find('.badge-item').trigger('click')

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.modal-content').exists()).toBe(true)
    })

    it('應該在彈窗中顯示徽章詳情', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      await wrapper.find('.badge-item').trigger('click')

      expect(wrapper.find('.modal-badge-name').text()).toBe('新手上路')
      expect(wrapper.find('.modal-badge-description').text()).toBe('完成第一次登入')
    })

    it('應該在點擊關閉按鈕時關閉彈窗', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      await wrapper.find('.badge-item').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      await wrapper.find('.modal-close').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('應該在點擊遮罩時關閉彈窗', async () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: mockBadges
        }
      })

      await wrapper.find('.badge-item').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      await wrapper.find('.modal-overlay').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('邊界情況', () => {
    it('應該處理空陣列', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: []
        }
      })

      expect(wrapper.find('.count-value').text()).toBe('0')
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('應該處理缺少 points_reward 的徽章', () => {
      wrapper = mountVueComponent(BadgesCard, {
        props: {
          badges: [{
            badge_id: 'badge-1',
            name: '測試徽章',
            description: '測試',
            icon: '🎯',
            rarity: 'common',
            points_rewarded: 50,
            category: 'test',
            earned_at: '2024-12-01T00:00:00.000Z'
          }]
        }
      })

      expect(wrapper.find('.badge-points').text()).toBe('+50P')
    })
  })
})
