// DailyStreakCard 組件測試
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountVueComponent } from '../../../helpers/vue-test-utils.js'
import DailyStreakCard from '@/components/dashboard/DailyStreakCard.vue'

// 模擬 pointsAPI
vi.mock('@/api/pointsAPI', () => ({
  calculateStreakReward: vi.fn((days) => {
    const rewards = { 1: 10, 3: 30, 7: 70, 14: 150, 30: 300, 100: 1000 }
    return rewards[days] || 10
  })
}))

describe('DailyStreakCard 組件', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('應該正確渲染組件', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('daily-streak-card')
    })

    it('應該顯示卡片標題', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 0,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.card-title').text()).toContain('每日簽到')
    })

    it('應該顯示火焰圖示', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 3,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.streak-icon').text()).toBe('🔥')
    })
  })

  describe('Props 處理', () => {
    it('應該正確顯示連續簽到天數', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 15,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.count-value').text()).toBe('15')
      expect(wrapper.find('.count-unit').text()).toBe('天')
    })

    it('應該顯示連續簽到標籤', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.streak-label').text()).toBe('連續簽到')
    })

    it('應該使用預設值當 props 未提供時', () => {
      wrapper = mountVueComponent(DailyStreakCard)

      expect(wrapper.find('.count-value').text()).toBe('0')
    })
  })

  describe('簽到按鈕狀態', () => {
    it('應該顯示簽到按鈕當今日未簽到', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      const signInBtn = wrapper.find('.signin-btn')
      expect(signInBtn.exists()).toBe(true)
      expect(signInBtn.text()).toContain('立即簽到')
    })

    it('應該顯示已簽到徽章當今日已簽到', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: true
        }
      })

      const signedBadge = wrapper.find('.signed-in-badge')
      expect(signedBadge.exists()).toBe(true)
      expect(signedBadge.text()).toContain('今日已簽到')
    })

    it('應該隱藏簽到按鈕當今日已簽到', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: true
        }
      })

      expect(wrapper.find('.signin-btn').exists()).toBe(false)
    })
  })

  describe('里程碑計算', () => {
    it('應該顯示下個里程碑為 1 天當連續 0 天', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 0,
          hasSignedInToday: false
        }
      })

      // 根據組件邏輯，MILESTONES = [1, 3, 7, 14, 30, 100]，當 streakDays 為 0 時，下個里程碑是 1
      expect(wrapper.find('.milestone-value').text()).toBe('1天')
    })

    it('應該顯示下個里程碑為 7 天當連續 5 天', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.milestone-value').text()).toBe('7天')
    })

    it('應該顯示下個里程碑為 30 天當連續 20 天', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 20,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.milestone-value').text()).toBe('30天')
    })

    it('應該顯示下個里程碑為 100 天當連續 50 天', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 50,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.milestone-value').text()).toBe('100天')
    })
  })

  describe('進度條', () => {
    it('應該顯示進度條', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.milestone-progress').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
    })
  })

  describe('事件發送', () => {
    it('應該在點擊簽到按鈕時發送 sign-in 事件', async () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      await wrapper.find('.signin-btn').trigger('click')

      expect(wrapper.emitted('sign-in')).toBeTruthy()
      expect(wrapper.emitted('sign-in').length).toBe(1)
    })
  })

  describe('獎勵顯示', () => {
    it('應該顯示里程碑獎勵', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 5,
          hasSignedInToday: false
        }
      })

      const rewardText = wrapper.find('.milestone-reward').text()
      expect(rewardText).toContain('獎勵')
      expect(rewardText).toContain('P')
    })
  })

  describe('邊界情況', () => {
    it('應該處理零天連續簽到', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 0,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.count-value').text()).toBe('0')
    })

    it('應該處理超過 100 天的連續簽到', () => {
      wrapper = mountVueComponent(DailyStreakCard, {
        props: {
          streakDays: 150,
          hasSignedInToday: false
        }
      })

      expect(wrapper.find('.count-value').text()).toBe('150')
      expect(wrapper.find('.milestone-value').text()).toBe('100天')
    })
  })
})
