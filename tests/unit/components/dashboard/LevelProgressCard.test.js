// LevelProgressCard 組件測試
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import LevelProgressCard from '@/components/dashboard/LevelProgressCard.vue'

describe('LevelProgressCard 組件', () => {
  let wrapper

  const defaultCurrentTier = {
    tier: 1,
    name: '新手',
    icon: '🌱'
  }

  const defaultNextTier = {
    tier: 2,
    name: '進階',
    icon: '🌿'
  }

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應該正確渲染組件', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: defaultNextTier,
          progressPercentage: 50,
          pointsToNext: 500
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('level-progress-card')
    })

    it('應該顯示卡片標題', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          progressPercentage: 0,
          pointsToNext: 1000
        }
      })

      expect(wrapper.find('.card-title').text()).toContain('等級進度')
    })
  })

  describe('當前等級顯示', () => {
    it('應該顯示當前等級圖示', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: { tier: 3, name: '專家', icon: '🌳' },
          progressPercentage: 30,
          pointsToNext: 700
        }
      })

      expect(wrapper.find('.level-icon').text()).toBe('🌳')
    })

    it('應該顯示當前等級名稱', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: { tier: 2, name: '進階用戶', icon: '🌿' },
          progressPercentage: 50,
          pointsToNext: 500
        }
      })

      expect(wrapper.find('.level-name').text()).toBe('進階用戶')
    })

    it('應該顯示當前等級編號', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: { tier: 5, name: '大師', icon: '🏆' },
          progressPercentage: 80,
          pointsToNext: 200
        }
      })

      expect(wrapper.find('.level-tier').text()).toBe('等級 5')
    })
  })

  describe('進度條', () => {
    it('應該顯示進度條', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          progressPercentage: 60,
          pointsToNext: 400
        }
      })

      expect(wrapper.find('.progress-bar-container').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
    })

    it('應該正確設定進度條寬度', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          progressPercentage: 75,
          pointsToNext: 250
        }
      })

      const progressBar = wrapper.find('.progress-bar')
      expect(progressBar.attributes('style')).toContain('width: 75%')
    })

    it('應該顯示進度百分比', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          progressPercentage: 45,
          pointsToNext: 550
        }
      })

      expect(wrapper.find('.progress-percentage').text()).toBe('45%')
    })

    it('應該顯示升級進度標籤', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          progressPercentage: 50,
          pointsToNext: 500
        }
      })

      expect(wrapper.find('.progress-label').text()).toBe('升級進度')
    })
  })

  describe('下個等級顯示', () => {
    it('應該顯示下個等級區塊當有 nextTier', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: { tier: 2, name: '進階', icon: '🌿' },
          progressPercentage: 50,
          pointsToNext: 500
        }
      })

      expect(wrapper.find('.next-level-section').exists()).toBe(true)
    })

    it('應該顯示下個等級圖示', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: { tier: 2, name: '進階', icon: '🌿' },
          progressPercentage: 50,
          pointsToNext: 500
        }
      })

      expect(wrapper.find('.next-level-icon').text()).toBe('🌿')
    })

    it('應該顯示下個等級名稱', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: { tier: 2, name: '進階用戶', icon: '🌿' },
          progressPercentage: 50,
          pointsToNext: 500
        }
      })

      expect(wrapper.find('.next-level-name').text()).toContain('進階用戶')
    })

    it('應該顯示還需多少點數', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: defaultNextTier,
          progressPercentage: 50,
          pointsToNext: 750
        }
      })

      expect(wrapper.find('.points-needed').text()).toContain('750')
    })
  })

  describe('最高等級狀態', () => {
    it('應該顯示最高等級徽章當沒有 nextTier', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: { tier: 10, name: '傳說', icon: '👑' },
          nextTier: null,
          progressPercentage: 100,
          pointsToNext: 0
        }
      })

      expect(wrapper.find('.max-level-badge').exists()).toBe(true)
      expect(wrapper.find('.max-level-badge').text()).toContain('已達最高等級')
    })

    it('應該隱藏下個等級區塊當沒有 nextTier', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: { tier: 10, name: '傳說', icon: '👑' },
          nextTier: null,
          progressPercentage: 100,
          pointsToNext: 0
        }
      })

      expect(wrapper.find('.next-level-section').exists()).toBe(false)
    })
  })

  describe('邊界情況', () => {
    it('應該處理 0% 進度', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: defaultNextTier,
          progressPercentage: 0,
          pointsToNext: 1000
        }
      })

      expect(wrapper.find('.progress-percentage').text()).toBe('0%')
      expect(wrapper.find('.progress-bar').attributes('style')).toContain('width: 0%')
    })

    it('應該處理 100% 進度', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: defaultNextTier,
          progressPercentage: 100,
          pointsToNext: 0
        }
      })

      expect(wrapper.find('.progress-percentage').text()).toBe('100%')
      expect(wrapper.find('.progress-bar').attributes('style')).toContain('width: 100%')
    })

    it('應該處理 0 點數到下個等級', () => {
      wrapper = mountVueComponent(LevelProgressCard, {
        props: {
          currentTier: defaultCurrentTier,
          nextTier: defaultNextTier,
          progressPercentage: 100,
          pointsToNext: 0
        }
      })

      expect(wrapper.find('.points-needed').text()).toContain('0')
    })
  })
})
