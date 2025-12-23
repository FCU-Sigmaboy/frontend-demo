// DOM 環境初始化設定
import { vi } from 'vitest'

// 模擬 window 物件的方法和屬性
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模擬 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模擬 IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模擬 scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
})

// 模擬 getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    display: 'none',
    visibility: 'hidden',
    height: '0px',
    width: '0px'
  }),
  writable: true
})

// 模擬 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// 模擬 sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

// 模擬 URL 和 URLSearchParams
global.URL = URL
global.URLSearchParams = URLSearchParams

// 模擬 fetch (如果需要的話)
global.fetch = vi.fn()

// 模擬 console 方法以避免測試輸出混亂
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  const message = args[0]
  if (
    typeof message === 'string' &&
    (message.includes('[Vue warn]') ||
     message.includes('Deprecation warning'))
  ) {
    return
  }
  originalConsoleWarn.apply(console, args)
}

// 設定預設的 viewport
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
})

// 模擬 Element.prototype.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// 模擬 HTMLElement.prototype.offsetHeight 和 offsetWidth
Object.defineProperties(HTMLElement.prototype, {
  offsetHeight: {
    get() { return parseFloat(this.style.height) || 0 }
  },
  offsetWidth: {
    get() { return parseFloat(this.style.width) || 0 }
  }
})

// 模擬 requestAnimationFrame 和 cancelAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id))

// 模擬 performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  timing: {
    navigationStart: Date.now()
  }
}

// 模擬 Image 建構函數
global.Image = class {
  constructor() {
    this.onload = null
    this.onerror = null
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
  
  set src(value) {
    this._src = value
  }
  
  get src() {
    return this._src
  }
}

// 模擬 Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  canvas: {
    width: 300,
    height: 150
  }
}))

// 模擬 File 和 FileReader
global.File = File
global.FileReader = class {
  constructor() {
    this.onload = null
    this.onerror = null
    this.result = null
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,test'
      if (this.onload) this.onload()
    }, 0)
  }
  
  readAsText() {
    setTimeout(() => {
      this.result = 'test content'
      if (this.onload) this.onload()
    }, 0)
  }
}

global.Blob = Blob

// 模擬 alert, confirm, prompt
window.alert = vi.fn()
window.confirm = vi.fn(() => true)
window.prompt = vi.fn(() => 'test')

// 模擬 scroll 相關方法
window.scroll = vi.fn()
window.scrollBy = vi.fn()

// 模擬 focus 和 blur 事件
HTMLElement.prototype.focus = vi.fn()
HTMLElement.prototype.blur = vi.fn()

// 模擬 click 事件
HTMLElement.prototype.click = vi.fn()

// 模擬 getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0
}))

// 模擬 closest 方法
Element.prototype.closest = vi.fn()

// 模擬 matches 方法
Element.prototype.matches = vi.fn(() => false)