// Vue 組件測試專用工具
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'
import { createMockStores, createMockStorePlugin } from '../__mocks__/pinia-stores.js'
import { createMockSupabaseClient } from './test-utils.js'

/**
 * 創建 Vue 組件測試環境
 * @param {Object} options - 配置選項
 * @returns {Object} 測試環境物件
 */
export function createVueTestEnvironment(options = {}) {
  const {
    mockStores = {},
    supabaseOverrides = {},
    routerConfig = {},
    globalComponents = {},
    globalDirectives = {},
    globalMocks = {}
  } = options

  // 創建 Pinia 實例和模擬 stores
  const pinia = createPinia()
  const stores = createMockStores(mockStores)
  pinia.use(createMockStorePlugin(stores))

  // 創建模擬的 Supabase 客戶端
  const mockSupabase = createMockSupabaseClient(supabaseOverrides)

  // 創建模擬的路由器
  const mockRouter = {
    push: vi.fn().mockResolvedValue(),
    replace: vi.fn().mockResolvedValue(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        params: {},
        query: {},
        path: '/',
        name: 'home',
        meta: {},
        ...routerConfig
      }
    }
  }

  const mockRoute = mockRouter.currentRoute.value

  return {
    pinia,
    stores,
    mockSupabase,
    mockRouter,
    mockRoute,
    globalConfig: {
      plugins: [pinia],
      components: {
        // 常用組件存根
        'router-link': {
          template: '<a><slot /></a>',
          props: ['to']
        },
        'router-view': {
          template: '<div><slot /></div>'
        },
        ...globalComponents
      },
      directives: {
        // 常用指令存根
        tooltip: vi.fn(),
        loading: vi.fn(),
        ...globalDirectives
      },
      mocks: {
        $router: mockRouter,
        $route: mockRoute,
        $supabase: mockSupabase,
        $t: (key, params) => params ? `${key}(${JSON.stringify(params)})` : key,
        $tc: (key, count) => `${key}(${count})`,
        $d: (date, format) => date ? date.toString() : '',
        $n: (number, format) => number ? number.toString() : '0',
        ...globalMocks
      },
      provide: {
        supabase: mockSupabase
      },
      stubs: {
        'transition': false,
        'transition-group': false,
        'keep-alive': false,
        'teleport': true
      }
    }
  }
}

/**
 * 增強的組件掛載函數
 * @param {Component} component - Vue 組件
 * @param {Object} options - 掛載選項
 * @returns {VueWrapper} 增強的組件包裝器
 */
export function mountVueComponent(component, options = {}) {
  const {
    props = {},
    slots = {},
    shallow = false,
    attachTo = null,
    testEnvironment = {},
    ...restOptions
  } = options

  // 創建測試環境
  const env = createVueTestEnvironment(testEnvironment)

  // 合併全域配置
  const mountOptions = {
    props,
    slots,
    attachTo,
    global: {
      ...env.globalConfig,
      ...restOptions.global,
      plugins: [
        ...env.globalConfig.plugins,
        ...(restOptions.global?.plugins || [])
      ],
      components: {
        ...env.globalConfig.components,
        ...restOptions.global?.components
      },
      mocks: {
        ...env.globalConfig.mocks,
        ...restOptions.global?.mocks
      }
    },
    ...restOptions
  }

  // 選擇掛載方式
  const mountFn = shallow ? shallowMount : mount
  const wrapper = mountFn(component, mountOptions)

  // 增強包裝器
  enhanceWrapper(wrapper, env)

  return wrapper
}

/**
 * 增強組件包裝器，添加便利方法
 * @param {VueWrapper} wrapper - 組件包裝器
 * @param {Object} env - 測試環境
 */
function enhanceWrapper(wrapper, env) {
  // 添加測試環境引用
  wrapper.testEnv = env

  // 添加便利的查找方法
  wrapper.findByTestId = (testId) => {
    // 首先檢查 wrapper 本身是否有這個 testId
    if (wrapper.attributes('data-testid') === testId) {
      return wrapper
    }
    // 然後在子元素中查找
    const element = wrapper.find(`[data-testid="${testId}"]`)
    return element
  }
  wrapper.findAllByTestId = (testId) => wrapper.findAll(`[data-testid="${testId}"]`)
  wrapper.findByRole = (role) => wrapper.find(`[role="${role}"]`)
  wrapper.findAllByRole = (role) => wrapper.findAll(`[role="${role}"]`)
  wrapper.findByText = (text) => {
    const elements = wrapper.findAll('*')
    return elements.find(el => el.text().includes(text)) || { exists: () => false }
  }
  wrapper.findByPlaceholder = (placeholder) => wrapper.find(`[placeholder="${placeholder}"]`)
  wrapper.findByLabel = (label) => wrapper.find(`[aria-label="${label}"]`)

  // 添加便利的事件觸發方法
  wrapper.clickByTestId = async (testId) => {
    const element = wrapper.findByTestId(testId)
    if (!element.exists()) {
      throw new Error(`Element with data-testid="${testId}" not found`)
    }
    await element.trigger('click')
    await wrapper.vm.$nextTick()
  }

  wrapper.typeInInput = async (selector, value) => {
    const input = wrapper.find(selector)
    if (!input.exists()) {
      throw new Error(`Input element "${selector}" not found`)
    }
    await input.setValue(value)
    await input.trigger('input')
    await wrapper.vm.$nextTick()
  }

  wrapper.selectOption = async (selector, value) => {
    const select = wrapper.find(selector)
    if (!select.exists()) {
      throw new Error(`Select element "${selector}" not found`)
    }
    await select.setValue(value)
    await select.trigger('change')
    await wrapper.vm.$nextTick()
  }

  wrapper.submitForm = async (selector = 'form') => {
    const form = wrapper.find(selector)
    if (!form.exists()) {
      throw new Error(`Form element "${selector}" not found`)
    }
    await form.trigger('submit')
    await wrapper.vm.$nextTick()
  }

  // 添加狀態檢查方法
  wrapper.isVisible = (selector) => {
    const element = wrapper.find(selector)
    return element.exists() && element.isVisible()
  }

  wrapper.hasClass = (selector, className) => {
    const element = wrapper.find(selector)
    return element.exists() && element.classes().includes(className)
  }

  wrapper.hasAttribute = (selector, attribute, value = null) => {
    const element = wrapper.find(selector)
    if (!element.exists()) return false
    const attr = element.attributes(attribute)
    return value === null ? attr !== undefined : attr === value
  }

  // 添加 Store 操作方法
  wrapper.getStore = (storeId) => {
    return env.stores[storeId]
  }

  wrapper.updateStore = (storeId, updates) => {
    const store = env.stores[storeId]
    if (store && store.$patch) {
      store.$patch(updates)
    }
  }

  wrapper.resetStore = (storeId) => {
    const store = env.stores[storeId]
    if (store && store.$reset) {
      store.$reset()
    }
  }

  // 添加路由操作方法
  wrapper.navigateTo = async (to) => {
    await env.mockRouter.push(to)
    await wrapper.vm.$nextTick()
  }

  wrapper.setRoute = (routeData) => {
    Object.assign(env.mockRoute, routeData)
  }

  // 添加 Supabase 模擬控制方法
  wrapper.mockSupabaseResponse = (path, response) => {
    if (env.mockSupabase._setResponse) {
      env.mockSupabase._setResponse(path, response)
    }
  }

  wrapper.resetSupabaseMocks = () => {
    if (env.mockSupabase._reset) {
      env.mockSupabase._reset()
    }
  }

  // 添加等待方法
  wrapper.waitForNextTick = () => wrapper.vm.$nextTick()
  
  wrapper.waitFor = async (condition, timeout = 1000) => {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  }

  wrapper.waitForElement = async (selector, timeout = 1000) => {
    return wrapper.waitFor(() => {
      return wrapper.find(selector).exists()
    }, timeout)
  }

  wrapper.waitForText = async (text, timeout = 1000) => {
    return wrapper.waitFor(() => {
      return wrapper.text().includes(text)
    }, timeout)
  }

  // 添加截圖和調試方法
  wrapper.debug = (selector = null) => {
    if (selector) {
      const element = wrapper.find(selector)
      if (element.exists()) {
        console.log(`Debug ${selector}:`, element.html())
      } else {
        console.log(`Element ${selector} not found`)
      }
    } else {
      console.log('Component HTML:', wrapper.html())
    }
  }

  wrapper.logProps = () => {
    console.log('Component props:', wrapper.props())
  }

  wrapper.logEmitted = () => {
    console.log('Emitted events:', wrapper.emitted())
  }
}

/**
 * 創建組件測試套件
 * @param {string} componentName - 組件名稱
 * @param {Component} component - Vue 組件
 * @param {Object} defaultOptions - 預設選項
 * @returns {Object} 測試套件物件
 */
export function createComponentTestSuite(componentName, component, defaultOptions = {}) {
  return {
    componentName,
    component,
    defaultOptions,

    mount: (options = {}) => {
      return mountVueComponent(component, {
        ...defaultOptions,
        ...options
      })
    },

    shallowMount: (options = {}) => {
      return mountVueComponent(component, {
        ...defaultOptions,
        ...options,
        shallow: true
      })
    },

    // 常用測試場景
    testBasicRendering: (props = {}) => {
      const wrapper = mountVueComponent(component, {
        ...defaultOptions,
        props: { ...defaultOptions.props, ...props }
      })
      expect(wrapper.exists()).toBe(true)
      return wrapper
    },

    testPropsHandling: (propsToTest) => {
      const results = {}
      Object.entries(propsToTest).forEach(([propName, propValue]) => {
        const wrapper = mountVueComponent(component, {
          ...defaultOptions,
          props: { ...defaultOptions.props, [propName]: propValue }
        })
        results[propName] = wrapper
      })
      return results
    },

    testEvents: async (eventTests) => {
      const wrapper = mountVueComponent(component, defaultOptions)
      const results = {}
      
      for (const [eventName, trigger] of Object.entries(eventTests)) {
        await trigger(wrapper)
        results[eventName] = wrapper.emitted(eventName)
      }
      
      return { wrapper, results }
    }
  }
}

// 預設匯出
export default {
  createVueTestEnvironment,
  mountVueComponent,
  createComponentTestSuite,
  enhanceWrapper
}