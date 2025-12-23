// 測試除錯工具
import { vi } from 'vitest'
import chalk from 'chalk'
import path from 'path'

/**
 * 測試除錯工具
 * 提供詳細的測試除錯資訊和故障排除功能
 */
export class TestDebugger {
  constructor() {
    this.debugMode = process.env.DEBUG_TESTS === 'true' || process.argv.includes('--debug')
    this.breakpoints = new Set()
    this.watchedVariables = new Map()
    this.callStack = []
    this.assertions = []
    this.mockCalls = new Map()
    this.componentStates = new Map()
    this.isEnabled = false
  }

  /**
   * 啟用除錯模式
   */
  enable() {
    this.isEnabled = true
    console.log(chalk.blue('🐛 Test debugger enabled'))
    
    // 設置全域除錯函數
    global.debug = this.debug.bind(this)
    global.breakpoint = this.breakpoint.bind(this)
    global.watch = this.watch.bind(this)
    global.inspect = this.inspect.bind(this)
    global.trace = this.trace.bind(this)
  }

  /**
   * 停用除錯模式
   */
  disable() {
    this.isEnabled = false
    
    // 清理全域函數
    delete global.debug
    delete global.breakpoint
    delete global.watch
    delete global.inspect
    delete global.trace
    
    this.cleanup()
  }

  /**
   * 除錯輸出
   * @param {string} message - 除錯訊息
   * @param {*} data - 相關資料
   */
  debug(message, data = null) {
    if (!this.isEnabled) return

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    console.log(chalk.cyan(`[${timestamp}] 🐛 ${message}`))
    
    if (data !== null) {
      console.log(chalk.gray('   Data:'), this.formatData(data))
    }
  }

  /**
   * 設置斷點
   * @param {string} label - 斷點標籤
   * @param {*} context - 上下文資料
   */
  breakpoint(label, context = null) {
    if (!this.isEnabled) return

    this.breakpoints.add(label)
    
    console.log(chalk.red(`🛑 Breakpoint: ${label}`))
    
    if (context) {
      console.log(chalk.gray('   Context:'), this.formatData(context))
    }
    
    // 顯示當前狀態
    this.showCurrentState()
    
    // 在實際應用中，這裡可以暫停執行等待用戶輸入
    // 但在測試環境中，我們只記錄斷點
  }

  /**
   * 監視變數
   * @param {string} name - 變數名稱
   * @param {*} value - 變數值
   */
  watch(name, value) {
    if (!this.isEnabled) return

    const previousValue = this.watchedVariables.get(name)
    this.watchedVariables.set(name, value)
    
    if (previousValue !== undefined && previousValue !== value) {
      console.log(chalk.yellow(`👁️  Variable changed: ${name}`))
      console.log(chalk.gray(`   Previous: ${this.formatData(previousValue)}`))
      console.log(chalk.gray(`   Current:  ${this.formatData(value)}`))
    }
  }

  /**
   * 檢查物件或變數
   * @param {*} target - 要檢查的目標
   * @param {string} label - 標籤
   */
  inspect(target, label = 'Object') {
    if (!this.isEnabled) return

    console.log(chalk.magenta(`🔍 Inspecting ${label}:`))
    
    if (target === null || target === undefined) {
      console.log(chalk.gray(`   ${target}`))
      return
    }
    
    if (typeof target === 'object') {
      // 檢查 Vue 組件
      if (target.$el || target._isVue || target.__v_isVNode) {
        this.inspectVueComponent(target, label)
        return
      }
      
      // 檢查 DOM 元素
      if (target.nodeType) {
        this.inspectDOMElement(target, label)
        return
      }
      
      // 檢查普通物件
      this.inspectObject(target, label)
    } else {
      console.log(chalk.gray(`   Type: ${typeof target}`))
      console.log(chalk.gray(`   Value: ${this.formatData(target)}`))
    }
  }

  /**
   * 追蹤函數呼叫
   * @param {string} functionName - 函數名稱
   * @param {Array} args - 參數
   * @param {*} result - 返回值
   */
  trace(functionName, args = [], result = undefined) {
    if (!this.isEnabled) return

    const traceInfo = {
      function: functionName,
      args,
      result,
      timestamp: Date.now(),
      stack: new Error().stack
    }
    
    this.callStack.push(traceInfo)
    
    console.log(chalk.blue(`📞 Function call: ${functionName}`))
    if (args.length > 0) {
      console.log(chalk.gray(`   Args: ${this.formatData(args)}`))
    }
    if (result !== undefined) {
      console.log(chalk.gray(`   Result: ${this.formatData(result)}`))
    }
  }

  /**
   * 記錄斷言
   * @param {string} assertion - 斷言描述
   * @param {boolean} passed - 是否通過
   * @param {*} expected - 期望值
   * @param {*} actual - 實際值
   */
  recordAssertion(assertion, passed, expected = null, actual = null) {
    if (!this.isEnabled) return

    const assertionInfo = {
      assertion,
      passed,
      expected,
      actual,
      timestamp: Date.now()
    }
    
    this.assertions.push(assertionInfo)
    
    const status = passed ? chalk.green('✓') : chalk.red('✗')
    console.log(`${status} Assertion: ${assertion}`)
    
    if (!passed && expected !== null && actual !== null) {
      console.log(chalk.gray(`   Expected: ${this.formatData(expected)}`))
      console.log(chalk.gray(`   Actual:   ${this.formatData(actual)}`))
    }
  }

  /**
   * 記錄模擬函數呼叫
   * @param {string} mockName - 模擬函數名稱
   * @param {Array} args - 參數
   * @param {*} returnValue - 返回值
   */
  recordMockCall(mockName, args, returnValue) {
    if (!this.isEnabled) return

    if (!this.mockCalls.has(mockName)) {
      this.mockCalls.set(mockName, [])
    }
    
    this.mockCalls.get(mockName).push({
      args,
      returnValue,
      timestamp: Date.now()
    })
    
    console.log(chalk.purple(`🎭 Mock call: ${mockName}`))
    console.log(chalk.gray(`   Args: ${this.formatData(args)}`))
    if (returnValue !== undefined) {
      console.log(chalk.gray(`   Returned: ${this.formatData(returnValue)}`))
    }
  }

  /**
   * 檢查 Vue 組件
   * @param {Object} component - Vue 組件
   * @param {string} label - 標籤
   */
  inspectVueComponent(component, label) {
    console.log(chalk.magenta(`   Vue Component: ${label}`))
    
    // 組件名稱
    if (component.$options?.name) {
      console.log(chalk.gray(`   Name: ${component.$options.name}`))
    }
    
    // Props
    if (component.$props && Object.keys(component.$props).length > 0) {
      console.log(chalk.gray('   Props:'))
      Object.entries(component.$props).forEach(([key, value]) => {
        console.log(chalk.gray(`     ${key}: ${this.formatData(value)}`))
      })
    }
    
    // Data
    if (component.$data && Object.keys(component.$data).length > 0) {
      console.log(chalk.gray('   Data:'))
      Object.entries(component.$data).forEach(([key, value]) => {
        console.log(chalk.gray(`     ${key}: ${this.formatData(value)}`))
      })
    }
    
    // Computed
    if (component.$options?.computed) {
      console.log(chalk.gray('   Computed:'))
      Object.keys(component.$options.computed).forEach(key => {
        try {
          const value = component[key]
          console.log(chalk.gray(`     ${key}: ${this.formatData(value)}`))
        } catch (error) {
          console.log(chalk.gray(`     ${key}: [Error: ${error.message}]`))
        }
      })
    }
    
    // 儲存組件狀態
    this.componentStates.set(label, {
      props: component.$props,
      data: component.$data,
      timestamp: Date.now()
    })
  }

  /**
   * 檢查 DOM 元素
   * @param {Element} element - DOM 元素
   * @param {string} label - 標籤
   */
  inspectDOMElement(element, label) {
    console.log(chalk.magenta(`   DOM Element: ${label}`))
    console.log(chalk.gray(`   Tag: ${element.tagName?.toLowerCase() || 'unknown'}`))
    
    if (element.id) {
      console.log(chalk.gray(`   ID: ${element.id}`))
    }
    
    if (element.className) {
      console.log(chalk.gray(`   Classes: ${element.className}`))
    }
    
    if (element.textContent && element.textContent.trim()) {
      const text = element.textContent.trim().substring(0, 100)
      console.log(chalk.gray(`   Text: "${text}${element.textContent.length > 100 ? '...' : ''}"`))
    }
    
    // 屬性
    if (element.attributes && element.attributes.length > 0) {
      console.log(chalk.gray('   Attributes:'))
      Array.from(element.attributes).forEach(attr => {
        console.log(chalk.gray(`     ${attr.name}: "${attr.value}"`))
      })
    }
  }

  /**
   * 檢查普通物件
   * @param {Object} obj - 物件
   * @param {string} label - 標籤
   */
  inspectObject(obj, label) {
    console.log(chalk.gray(`   Type: ${obj.constructor?.name || 'Object'}`))
    
    if (Array.isArray(obj)) {
      console.log(chalk.gray(`   Length: ${obj.length}`))
      if (obj.length > 0) {
        console.log(chalk.gray('   Items:'))
        obj.slice(0, 5).forEach((item, index) => {
          console.log(chalk.gray(`     [${index}]: ${this.formatData(item)}`))
        })
        if (obj.length > 5) {
          console.log(chalk.gray(`     ... and ${obj.length - 5} more items`))
        }
      }
    } else {
      const keys = Object.keys(obj)
      console.log(chalk.gray(`   Keys: ${keys.length}`))
      
      if (keys.length > 0) {
        console.log(chalk.gray('   Properties:'))
        keys.slice(0, 10).forEach(key => {
          try {
            const value = obj[key]
            console.log(chalk.gray(`     ${key}: ${this.formatData(value)}`))
          } catch (error) {
            console.log(chalk.gray(`     ${key}: [Error: ${error.message}]`))
          }
        })
        
        if (keys.length > 10) {
          console.log(chalk.gray(`     ... and ${keys.length - 10} more properties`))
        }
      }
    }
  }

  /**
   * 顯示當前狀態
   */
  showCurrentState() {
    console.log(chalk.blue('📊 Current Debug State:'))
    
    // 監視的變數
    if (this.watchedVariables.size > 0) {
      console.log(chalk.gray('   Watched Variables:'))
      this.watchedVariables.forEach((value, name) => {
        console.log(chalk.gray(`     ${name}: ${this.formatData(value)}`))
      })
    }
    
    // 最近的斷言
    const recentAssertions = this.assertions.slice(-3)
    if (recentAssertions.length > 0) {
      console.log(chalk.gray('   Recent Assertions:'))
      recentAssertions.forEach(assertion => {
        const status = assertion.passed ? '✓' : '✗'
        console.log(chalk.gray(`     ${status} ${assertion.assertion}`))
      })
    }
    
    // 模擬函數呼叫統計
    if (this.mockCalls.size > 0) {
      console.log(chalk.gray('   Mock Calls:'))
      this.mockCalls.forEach((calls, name) => {
        console.log(chalk.gray(`     ${name}: ${calls.length} calls`))
      })
    }
  }

  /**
   * 格式化資料用於顯示
   * @param {*} data - 要格式化的資料
   * @returns {string} 格式化後的字串
   */
  formatData(data) {
    if (data === null) return 'null'
    if (data === undefined) return 'undefined'
    if (typeof data === 'string') {
      return data.length > 100 ? `"${data.substring(0, 100)}..."` : `"${data}"`
    }
    if (typeof data === 'function') {
      return `[Function: ${data.name || 'anonymous'}]`
    }
    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return `Array(${data.length})`
      }
      try {
        const json = JSON.stringify(data, null, 2)
        return json.length > 200 ? `${json.substring(0, 200)}...` : json
      } catch {
        return `[Object: ${data.constructor?.name || 'Object'}]`
      }
    }
    return String(data)
  }

  /**
   * 生成除錯報告
   * @returns {Object} 除錯報告
   */
  generateReport() {
    return {
      breakpoints: Array.from(this.breakpoints),
      watchedVariables: Object.fromEntries(this.watchedVariables),
      callStack: this.callStack.slice(-10), // 最近 10 個呼叫
      assertions: this.assertions.slice(-20), // 最近 20 個斷言
      mockCalls: Object.fromEntries(
        Array.from(this.mockCalls.entries()).map(([name, calls]) => [
          name,
          calls.slice(-5) // 每個模擬函數的最近 5 次呼叫
        ])
      ),
      componentStates: Object.fromEntries(this.componentStates),
      timestamp: Date.now()
    }
  }

  /**
   * 匯出除錯資料
   * @param {string} filename - 檔案名稱
   */
  exportDebugData(filename = 'debug-report.json') {
    const report = this.generateReport()
    
    try {
      const fs = require('fs')
      fs.writeFileSync(filename, JSON.stringify(report, null, 2))
      console.log(chalk.green(`📄 Debug report exported to ${filename}`))
    } catch (error) {
      console.log(chalk.red(`❌ Failed to export debug report: ${error.message}`))
    }
  }

  /**
   * 清理除錯資料
   */
  cleanup() {
    this.breakpoints.clear()
    this.watchedVariables.clear()
    this.callStack = []
    this.assertions = []
    this.mockCalls.clear()
    this.componentStates.clear()
  }
}

/**
 * 測試故障排除助手
 */
export class TestTroubleshooter {
  constructor() {
    this.commonIssues = new Map()
    this.solutions = new Map()
    this.setupCommonIssues()
  }

  /**
   * 設置常見問題和解決方案
   */
  setupCommonIssues() {
    // Vue 相關問題
    this.addIssue(
      'vue-component-not-found',
      /Cannot resolve component/i,
      [
        'Check if the component is properly imported',
        'Verify the component name spelling',
        'Ensure the component is registered globally or locally'
      ]
    )
    
    this.addIssue(
      'vue-props-validation',
      /Invalid prop.*expected/i,
      [
        'Check prop types and default values',
        'Verify the prop data being passed to the component',
        'Ensure prop validation rules are correct'
      ]
    )
    
    // Pinia 相關問題
    this.addIssue(
      'pinia-store-not-found',
      /store.*not found/i,
      [
        'Check if the store is properly defined and exported',
        'Verify the store ID matches the usage',
        'Ensure Pinia is properly installed in the test environment'
      ]
    )
    
    // 模擬相關問題
    this.addIssue(
      'mock-not-working',
      /mock.*not.*function/i,
      [
        'Verify the mock is set up before the test runs',
        'Check if the mock path is correct',
        'Ensure vi.mock() is called at the top level'
      ]
    )
    
    // 非同步相關問題
    this.addIssue(
      'async-timeout',
      /timeout.*exceeded/i,
      [
        'Increase the test timeout value',
        'Check for infinite loops or hanging promises',
        'Ensure all async operations are properly awaited'
      ]
    )
    
    // DOM 相關問題
    this.addIssue(
      'element-not-found',
      /element.*not found/i,
      [
        'Check if the selector is correct',
        'Verify the element exists in the rendered output',
        'Ensure the component is properly mounted'
      ]
    )
  }

  /**
   * 添加問題和解決方案
   * @param {string} id - 問題 ID
   * @param {RegExp} pattern - 錯誤模式
   * @param {Array} solutions - 解決方案列表
   */
  addIssue(id, pattern, solutions) {
    this.commonIssues.set(id, pattern)
    this.solutions.set(id, solutions)
  }

  /**
   * 分析錯誤並提供解決方案
   * @param {Error} error - 錯誤物件
   * @returns {Object} 分析結果
   */
  analyzeError(error) {
    const errorMessage = error.message || ''
    const errorStack = error.stack || ''
    const fullText = `${errorMessage} ${errorStack}`
    
    const matchedIssues = []
    
    // 檢查常見問題
    for (const [id, pattern] of this.commonIssues) {
      if (pattern.test(fullText)) {
        matchedIssues.push({
          id,
          solutions: this.solutions.get(id) || []
        })
      }
    }
    
    return {
      error: {
        message: errorMessage,
        stack: errorStack,
        type: error.constructor.name
      },
      matchedIssues,
      generalSuggestions: this.getGeneralSuggestions(error)
    }
  }

  /**
   * 獲取一般建議
   * @param {Error} error - 錯誤物件
   * @returns {Array} 建議列表
   */
  getGeneralSuggestions(error) {
    const suggestions = []
    const errorMessage = error.message?.toLowerCase() || ''
    
    if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
      suggestions.push('Check for null/undefined values and add proper guards')
    }
    
    if (errorMessage.includes('function')) {
      suggestions.push('Verify that methods exist and are properly bound')
    }
    
    if (errorMessage.includes('import') || errorMessage.includes('module')) {
      suggestions.push('Check import/export statements and module paths')
    }
    
    if (errorMessage.includes('async') || errorMessage.includes('promise')) {
      suggestions.push('Ensure proper async/await usage and error handling')
    }
    
    return suggestions
  }

  /**
   * 打印故障排除報告
   * @param {Error} error - 錯誤物件
   */
  printTroubleshootingReport(error) {
    const analysis = this.analyzeError(error)
    
    console.log('')
    console.log(chalk.red('🚨 Test Failure Analysis'))
    console.log(chalk.red(`   Error: ${analysis.error.message}`))
    console.log(chalk.red(`   Type: ${analysis.error.type}`))
    
    if (analysis.matchedIssues.length > 0) {
      console.log('')
      console.log(chalk.blue('🔧 Specific Solutions:'))
      analysis.matchedIssues.forEach(issue => {
        issue.solutions.forEach(solution => {
          console.log(chalk.gray(`   • ${solution}`))
        })
      })
    }
    
    if (analysis.generalSuggestions.length > 0) {
      console.log('')
      console.log(chalk.blue('💡 General Suggestions:'))
      analysis.generalSuggestions.forEach(suggestion => {
        console.log(chalk.gray(`   • ${suggestion}`))
      })
    }
    
    console.log('')
    console.log(chalk.blue('🔍 Debug Tips:'))
    console.log(chalk.gray('   • Use console.log() to inspect values'))
    console.log(chalk.gray('   • Add breakpoints with debugger; statement'))
    console.log(chalk.gray('   • Check the full stack trace for clues'))
    console.log(chalk.gray('   • Verify test setup and mocks'))
  }
}

// 創建全域實例
export const testDebugger = new TestDebugger()
export const troubleshooter = new TestTroubleshooter()

// 如果在除錯模式下自動啟用
if (process.env.DEBUG_TESTS === 'true' || process.argv.includes('--debug')) {
  testDebugger.enable()
}

// 匯出便利函數
export function enableDebugMode() {
  testDebugger.enable()
}

export function disableDebugMode() {
  testDebugger.disable()
}

export function analyzeTestError(error) {
  return troubleshooter.analyzeError(error)
}

export function printTroubleshootingHelp(error) {
  troubleshooter.printTroubleshootingReport(error)
}