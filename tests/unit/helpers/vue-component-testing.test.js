// Vue 組件測試工具的測試
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, ref, computed } from 'vue'
import { 
  createVueTestEnvironment, 
  mountVueComponent, 
  createComponentTestSuite 
} from '../../helpers/vue-test-utils.js'
import { 
  createMockAuthStore, 
  createMockPointsStore 
} from '../../__mocks__/pinia-stores.js'

// 測試組件
const TestComponent = defineComponent({
  name: 'TestComponent',
  props: {
    title: {
      type: String,
      default: 'Default Title'
    },
    count: {
      type: Number,
      default: 0
    }
  },
  emits: ['click', 'update'],
  setup(props, { emit }) {
    const localCount = ref(props.count)
    
    const doubleCount = computed(() => localCount.value * 2)
    
    const handleClick = () => {
      localCount.value++
      emit('click', localCount.value)
    }
    
    const handleUpdate = (event) => {
      const value = parseInt(event.target.value) || 0
      localCount.value = value
      emit('update', value)
    }
    
    return {
      localCount,
      doubleCount,
      handleClick,
      handleUpdate
    }
  },
  template: `
    <div class="test-component" data-testid="test-component">
      <h1 data-testid="title">{{ title }}</h1>
      <p data-testid="count">Count: {{ localCount }}</p>
      <p data-testid="double-count">Double: {{ doubleCount }}</p>
      <button data-testid="click-btn" @click="handleClick">Click Me</button>
      <input 
        data-testid="count-input" 
        type="number" 
        :value="localCount" 
        @input="handleUpdate"
      />
      <slot name="content"></slot>
    </div>
  `
})

describe('Vue 組件測試工具', () => {
  describe('createVueTestEnvironment', () => {
    it('應該創建完整的測試環境', () => {
      const env = createVueTestEnvironment()
      
      expect(env.pinia).toBeDefined()
      expect(env.stores).toBeDefined()
      expect(env.stores.auth).toBeDefined()
      expect(env.stores.points).toBeDefined()
      expect(env.stores.transaction).toBeDefined()
      expect(env.mockSupabase).toBeDefined()
      expect(env.mockRouter).toBeDefined()
      expect(env.mockRoute).toBeDefined()
      expect(env.globalConfig).toBeDefined()
    })

    it('應該支援自訂 store 狀態', () => {
      const customStoreState = {
        auth: {
          isLoggedIn: true,
          user: { id: 'test-user', email: 'test@example.com' }
        },
        points: {
          profile: { current_balance: 1000 }
        }
      }
      
      const env = createVueTestEnvironment({
        mockStores: customStoreState
      })
      
      expect(env.stores.auth.isLoggedIn.value).toBe(true)
      expect(env.stores.auth.user.value.id).toBe('test-user')
      expect(env.stores.points.profile.value.current_balance).toBe(1000)
    })

    it('應該支援自訂路由配置', () => {
      const routerConfig = {
        path: '/test',
        name: 'test',
        params: { id: '123' },
        query: { tab: 'info' }
      }
      
      const env = createVueTestEnvironment({
        routerConfig
      })
      
      expect(env.mockRoute.path).toBe('/test')
      expect(env.mockRoute.name).toBe('test')
      expect(env.mockRoute.params.id).toBe('123')
      expect(env.mockRoute.query.tab).toBe('info')
    })
  })

  describe('mountVueComponent', () => {
    it('應該成功掛載組件', () => {
      const wrapper = mountVueComponent(TestComponent)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findByTestId('test-component').exists()).toBe(true)
      expect(wrapper.findByTestId('title').text()).toBe('Default Title')
    })

    it('應該支援 props 傳遞', () => {
      const wrapper = mountVueComponent(TestComponent, {
        props: {
          title: 'Custom Title',
          count: 5
        }
      })
      
      expect(wrapper.findByTestId('title').text()).toBe('Custom Title')
      expect(wrapper.findByTestId('count').text()).toBe('Count: 5')
      expect(wrapper.findByTestId('double-count').text()).toBe('Double: 10')
    })

    it('應該支援插槽', () => {
      const wrapper = mountVueComponent(TestComponent, {
        slots: {
          content: '<p data-testid="slot-content">Slot Content</p>'
        }
      })
      
      expect(wrapper.findByTestId('slot-content').exists()).toBe(true)
      expect(wrapper.findByTestId('slot-content').text()).toBe('Slot Content')
    })

    it('應該提供增強的查找方法', () => {
      const wrapper = mountVueComponent(TestComponent)
      
      // 測試 findByTestId
      expect(wrapper.findByTestId('title').exists()).toBe(true)
      
      // 測試 findByText
      const titleElement = wrapper.findByText('Default Title')
      expect(titleElement.exists()).toBe(true)
    })

    it('應該提供便利的事件觸發方法', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      // 測試 clickByTestId
      await wrapper.clickByTestId('click-btn')
      
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([1])
      expect(wrapper.findByTestId('count').text()).toBe('Count: 1')
    })

    it('應該提供輸入操作方法', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      // 測試 typeInInput
      await wrapper.typeInInput('[data-testid="count-input"]', '10')
      
      expect(wrapper.emitted('update')).toBeTruthy()
      expect(wrapper.emitted('update')[0]).toEqual([10])
    })

    it('應該提供 Store 操作方法', () => {
      const wrapper = mountVueComponent(TestComponent)
      
      // 測試 getStore
      const authStore = wrapper.getStore('auth')
      expect(authStore).toBeDefined()
      expect(authStore.$id).toBe('auth')
      
      // 測試 updateStore
      wrapper.updateStore('auth', { isLoggedIn: true })
      expect(authStore.isLoggedIn.value).toBe(true)
      
      // 測試 resetStore
      wrapper.resetStore('auth')
      expect(authStore.isLoggedIn.value).toBe(false)
    })

    it('應該提供路由操作方法', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      // 測試 navigateTo
      await wrapper.navigateTo('/test')
      expect(wrapper.testEnv.mockRouter.push).toHaveBeenCalledWith('/test')
      
      // 測試 setRoute
      wrapper.setRoute({ path: '/new-path', name: 'new' })
      expect(wrapper.testEnv.mockRoute.path).toBe('/new-path')
      expect(wrapper.testEnv.mockRoute.name).toBe('new')
    })

    it('應該提供等待方法', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      // 測試 waitForNextTick
      await wrapper.waitForNextTick()
      
      // 測試 waitForElement
      await wrapper.waitForElement('[data-testid="title"]')
      
      // 測試 waitForText
      await wrapper.waitForText('Default Title')
    })

    it('應該支援淺層掛載', () => {
      const wrapper = mountVueComponent(TestComponent, {
        shallow: true
      })
      
      expect(wrapper.exists()).toBe(true)
      // 淺層掛載應該仍然能找到組件的根元素
      // 由於 wrapper 本身就是根元素，檢查其屬性
      expect(wrapper.attributes('data-testid')).toBe('test-component')
    })
  })

  describe('createComponentTestSuite', () => {
    let testSuite

    beforeEach(() => {
      testSuite = createComponentTestSuite('TestComponent', TestComponent, {
        props: { title: 'Suite Title' }
      })
    })

    it('應該創建測試套件', () => {
      expect(testSuite.componentName).toBe('TestComponent')
      expect(testSuite.component).toBe(TestComponent)
      expect(testSuite.defaultOptions.props.title).toBe('Suite Title')
    })

    it('應該提供 mount 方法', () => {
      const wrapper = testSuite.mount()
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findByTestId('title').text()).toBe('Suite Title')
    })

    it('應該提供 shallowMount 方法', () => {
      const wrapper = testSuite.shallowMount()
      
      expect(wrapper.exists()).toBe(true)
    })

    it('應該提供 testBasicRendering 方法', () => {
      const wrapper = testSuite.testBasicRendering({ count: 3 })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findByTestId('title').text()).toBe('Suite Title')
      expect(wrapper.findByTestId('count').text()).toBe('Count: 3')
    })

    it('應該提供 testPropsHandling 方法', () => {
      const results = testSuite.testPropsHandling({
        title: 'Test Title 1',
        count: 5
      })
      
      expect(results.title.findByTestId('title').text()).toBe('Test Title 1')
      expect(results.count.findByTestId('count').text()).toBe('Count: 5')
    })

    it('應該提供 testEvents 方法', async () => {
      const { wrapper, results } = await testSuite.testEvents({
        click: async (w) => await w.clickByTestId('click-btn'),
        update: async (w) => await w.typeInInput('[data-testid="count-input"]', '7')
      })
      
      expect(results.click).toBeTruthy()
      expect(results.update).toBeTruthy()
      expect(results.click[0]).toEqual([1])
      expect(results.update[0]).toEqual([7])
    })
  })

  describe('Store 模擬', () => {
    it('應該正確模擬 Auth Store', () => {
      const authStore = createMockAuthStore({
        isLoggedIn: true,
        user: { id: 'test', email: 'test@example.com' }
      })
      
      expect(authStore.isLoggedIn.value).toBe(true)
      expect(authStore.user.value.id).toBe('test')
      expect(authStore.userName.value).toBe('使用者')
      
      // 測試 actions
      expect(vi.isMockFunction(authStore.signInWithGoogle)).toBe(true)
      expect(vi.isMockFunction(authStore.signOut)).toBe(true)
    })

    it('應該正確模擬 Points Store', async () => {
      const pointsStore = createMockPointsStore({
        profile: { current_balance: 500, daily_streak: 3 }
      })
      
      expect(pointsStore.currentBalance.value).toBe(500)
      expect(pointsStore.dailyStreak.value).toBe(3)
      
      // 測試 actions
      const result = await pointsStore.performDailySignIn()
      expect(result.success).toBe(true)
      expect(result.points_awarded).toBe(10)
      expect(pointsStore.currentBalance.value).toBe(510)
    })
  })

  describe('錯誤處理', () => {
    it('應該在元素不存在時拋出錯誤', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      await expect(wrapper.clickByTestId('non-existent')).rejects.toThrow(
        'Element with data-testid="non-existent" not found'
      )
    })

    it('應該在輸入元素不存在時拋出錯誤', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      await expect(wrapper.typeInInput('.non-existent', 'value')).rejects.toThrow(
        'Input element ".non-existent" not found'
      )
    })

    it('應該在等待超時時拋出錯誤', async () => {
      const wrapper = mountVueComponent(TestComponent)
      
      await expect(wrapper.waitFor(() => false, 100)).rejects.toThrow(
        'Condition not met within 100ms'
      )
    })
  })
})