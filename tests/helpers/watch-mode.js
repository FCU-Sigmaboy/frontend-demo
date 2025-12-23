// 測試監視模式和開發工具
import { vi } from 'vitest'
import chalk from 'chalk'
import path from 'path'
import { performance } from 'perf_hooks'

/**
 * 測試監視模式控制器
 * 提供智能的測試重新執行和開發者友好的輸出
 */
export class TestWatchController {
  constructor() {
    this.isWatchMode = process.env.VITEST_WATCH === 'true' || process.argv.includes('--watch')
    this.testResults = new Map()
    this.performanceMetrics = new Map()
    this.failureHistory = []
    this.lastRunTime = null
    this.watchedFiles = new Set()
    this.testPatterns = []
    this.isRunning = false
    
    // 配置選項
    this.options = {
      clearConsole: true,
      showCoverage: false,
      showPerformance: true,
      maxFailureHistory: 10,
      debounceDelay: 100,
      verboseErrors: true,
      colorOutput: true
    }
    
    this.setupWatchMode()
  }

  /**
   * 設置監視模式
   */
  setupWatchMode() {
    if (!this.isWatchMode) return

    // 監聽檔案變化
    this.setupFileWatcher()
    
    // 設置性能監控
    this.setupPerformanceMonitoring()
    
    // 設置錯誤處理
    this.setupErrorHandling()
    
    console.log(chalk.blue('🔍 Test watch mode activated'))
    this.printWatchModeHelp()
  }

  /**
   * 設置檔案監視器
   */
  setupFileWatcher() {
    // 監視的檔案模式
    this.testPatterns = [
      'src/**/*.{js,ts,vue}',
      'tests/**/*.{js,ts,vue}',
      '*.config.{js,ts}',
      'package.json'
    ]

    // 忽略的檔案模式
    const ignorePatterns = [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.git/**',
      '**/*.log'
    ]

    console.log(chalk.gray('📁 Watching files:'))
    this.testPatterns.forEach(pattern => {
      console.log(chalk.gray(`   ${pattern}`))
    })
  }

  /**
   * 設置性能監控
   */
  setupPerformanceMonitoring() {
    // 監控測試執行時間
    this.startTime = null
    this.endTime = null
    
    // 記錄慢測試
    this.slowTests = new Map()
    this.slowTestThreshold = 1000 // 1秒
  }

  /**
   * 設置錯誤處理
   */
  setupErrorHandling() {
    // 捕獲未處理的錯誤
    process.on('uncaughtException', (error) => {
      this.handleUnexpectedError('Uncaught Exception', error)
    })

    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnexpectedError('Unhandled Rejection', reason)
    })
  }

  /**
   * 開始測試執行
   * @param {Array} testFiles - 要執行的測試檔案
   */
  async startTestRun(testFiles = []) {
    if (this.isRunning) {
      console.log(chalk.yellow('⏳ Tests are already running...'))
      return
    }

    this.isRunning = true
    this.startTime = performance.now()
    this.lastRunTime = new Date()

    if (this.options.clearConsole && this.isWatchMode) {
      console.clear()
    }

    this.printTestRunHeader(testFiles)
    
    try {
      // 這裡會由 Vitest 實際執行測試
      // 我們只是提供監控和報告功能
      await this.monitorTestExecution()
    } catch (error) {
      this.handleTestRunError(error)
    } finally {
      this.endTime = performance.now()
      this.isRunning = false
      this.printTestRunSummary()
    }
  }

  /**
   * 監控測試執行
   */
  async monitorTestExecution() {
    // 模擬測試執行監控
    // 實際的測試執行由 Vitest 處理
    return new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
  }

  /**
   * 處理測試結果
   * @param {Object} results - 測試結果
   */
  handleTestResults(results) {
    this.testResults.set(Date.now(), results)
    
    // 記錄性能指標
    if (results.performance) {
      this.recordPerformanceMetrics(results.performance)
    }

    // 記錄失敗的測試
    if (results.failures && results.failures.length > 0) {
      this.recordFailures(results.failures)
    }

    // 輸出結果摘要
    this.printResultsSummary(results)
  }

  /**
   * 記錄性能指標
   * @param {Object} performance - 性能資料
   */
  recordPerformanceMetrics(performance) {
    const timestamp = Date.now()
    this.performanceMetrics.set(timestamp, {
      totalTime: performance.totalTime,
      testCount: performance.testCount,
      slowTests: performance.slowTests || [],
      memoryUsage: process.memoryUsage()
    })

    // 保持最近的 50 個記錄
    if (this.performanceMetrics.size > 50) {
      const oldestKey = Math.min(...this.performanceMetrics.keys())
      this.performanceMetrics.delete(oldestKey)
    }
  }

  /**
   * 記錄測試失敗
   * @param {Array} failures - 失敗的測試
   */
  recordFailures(failures) {
    const timestamp = Date.now()
    
    failures.forEach(failure => {
      this.failureHistory.unshift({
        timestamp,
        testName: failure.testName,
        error: failure.error,
        stack: failure.stack,
        file: failure.file
      })
    })

    // 保持失敗歷史記錄的限制
    if (this.failureHistory.length > this.options.maxFailureHistory) {
      this.failureHistory = this.failureHistory.slice(0, this.options.maxFailureHistory)
    }
  }

  /**
   * 打印測試執行標題
   * @param {Array} testFiles - 測試檔案
   */
  printTestRunHeader(testFiles) {
    const timestamp = new Date().toLocaleTimeString()
    
    console.log(chalk.blue('🧪 Running tests...'))
    console.log(chalk.gray(`   Time: ${timestamp}`))
    
    if (testFiles.length > 0) {
      console.log(chalk.gray(`   Files: ${testFiles.length} test files`))
    }
    
    console.log('')
  }

  /**
   * 打印測試結果摘要
   */
  printTestRunSummary() {
    const duration = this.endTime - this.startTime
    const timestamp = new Date().toLocaleTimeString()
    
    console.log('')
    console.log(chalk.blue('📊 Test Run Summary'))
    console.log(chalk.gray(`   Completed at: ${timestamp}`))
    console.log(chalk.gray(`   Duration: ${Math.round(duration)}ms`))
    
    if (this.options.showPerformance) {
      this.printPerformanceMetrics()
    }
    
    if (this.isWatchMode) {
      this.printWatchModeStatus()
    }
  }

  /**
   * 打印性能指標
   */
  printPerformanceMetrics() {
    const latestMetrics = Array.from(this.performanceMetrics.values()).pop()
    
    if (!latestMetrics) return

    console.log('')
    console.log(chalk.yellow('⚡ Performance Metrics'))
    console.log(chalk.gray(`   Total time: ${Math.round(latestMetrics.totalTime)}ms`))
    console.log(chalk.gray(`   Test count: ${latestMetrics.testCount}`))
    
    if (latestMetrics.slowTests.length > 0) {
      console.log(chalk.yellow(`   Slow tests (>${this.slowTestThreshold}ms):`))
      latestMetrics.slowTests.forEach(test => {
        console.log(chalk.gray(`     ${test.name}: ${Math.round(test.duration)}ms`))
      })
    }

    // 記憶體使用情況
    const memory = latestMetrics.memoryUsage
    const memoryMB = Math.round(memory.heapUsed / 1024 / 1024)
    console.log(chalk.gray(`   Memory usage: ${memoryMB}MB`))
  }

  /**
   * 打印監視模式狀態
   */
  printWatchModeStatus() {
    console.log('')
    console.log(chalk.green('👀 Watching for changes...'))
    console.log(chalk.gray('   Press r to rerun tests'))
    console.log(chalk.gray('   Press c to clear console'))
    console.log(chalk.gray('   Press q to quit'))
  }

  /**
   * 打印詳細錯誤報告
   * @param {Object} error - 錯誤物件
   * @param {string} testName - 測試名稱
   * @param {string} file - 檔案路徑
   */
  printDetailedError(error, testName, file) {
    console.log('')
    console.log(chalk.red('❌ Test Failure'))
    console.log(chalk.red(`   Test: ${testName}`))
    console.log(chalk.red(`   File: ${path.relative(process.cwd(), file)}`))
    console.log('')
    
    // 錯誤訊息
    if (error.message) {
      console.log(chalk.red('   Error Message:'))
      console.log(chalk.gray(`   ${error.message}`))
      console.log('')
    }

    // 堆疊追蹤
    if (error.stack && this.options.verboseErrors) {
      console.log(chalk.red('   Stack Trace:'))
      const stackLines = error.stack.split('\n')
      stackLines.slice(0, 10).forEach(line => {
        // 高亮顯示專案檔案
        if (line.includes(process.cwd())) {
          console.log(chalk.yellow(`   ${line.trim()}`))
        } else {
          console.log(chalk.gray(`   ${line.trim()}`))
        }
      })
      
      if (stackLines.length > 10) {
        console.log(chalk.gray(`   ... and ${stackLines.length - 10} more lines`))
      }
    }

    // 建議的修復方法
    this.printFixSuggestions(error, testName)
  }

  /**
   * 打印修復建議
   * @param {Object} error - 錯誤物件
   * @param {string} testName - 測試名稱
   */
  printFixSuggestions(error, testName) {
    const suggestions = this.generateFixSuggestions(error, testName)
    
    if (suggestions.length > 0) {
      console.log('')
      console.log(chalk.blue('💡 Suggestions:'))
      suggestions.forEach(suggestion => {
        console.log(chalk.gray(`   • ${suggestion}`))
      })
    }
  }

  /**
   * 生成修復建議
   * @param {Object} error - 錯誤物件
   * @param {string} testName - 測試名稱
   * @returns {Array} 建議列表
   */
  generateFixSuggestions(error, testName) {
    const suggestions = []
    const errorMessage = error.message?.toLowerCase() || ''
    
    // 常見錯誤模式的建議
    if (errorMessage.includes('cannot read property')) {
      suggestions.push('Check if the object is properly initialized before accessing its properties')
      suggestions.push('Add null/undefined checks or use optional chaining (?.)')
    }
    
    if (errorMessage.includes('is not a function')) {
      suggestions.push('Verify that the method exists and is properly mocked')
      suggestions.push('Check if the import statement is correct')
    }
    
    if (errorMessage.includes('timeout')) {
      suggestions.push('Increase the test timeout or check for infinite loops')
      suggestions.push('Ensure all async operations are properly awaited')
    }
    
    if (errorMessage.includes('expected') && errorMessage.includes('received')) {
      suggestions.push('Check the assertion values and ensure they match expected types')
      suggestions.push('Consider using more specific matchers (toEqual, toStrictEqual, etc.)')
    }
    
    if (errorMessage.includes('mock')) {
      suggestions.push('Verify that mocks are properly set up and cleared between tests')
      suggestions.push('Check if the mock implementation matches the expected interface')
    }

    return suggestions
  }

  /**
   * 處理意外錯誤
   * @param {string} type - 錯誤類型
   * @param {Error} error - 錯誤物件
   */
  handleUnexpectedError(type, error) {
    console.log('')
    console.log(chalk.red(`💥 ${type}`))
    console.log(chalk.red(`   ${error.message}`))
    
    if (error.stack) {
      console.log('')
      console.log(chalk.red('   Stack Trace:'))
      error.stack.split('\n').slice(0, 5).forEach(line => {
        console.log(chalk.gray(`   ${line.trim()}`))
      })
    }
  }

  /**
   * 處理測試執行錯誤
   * @param {Error} error - 錯誤物件
   */
  handleTestRunError(error) {
    console.log('')
    console.log(chalk.red('🚨 Test Run Failed'))
    console.log(chalk.red(`   ${error.message}`))
    
    // 提供重新執行建議
    if (this.isWatchMode) {
      console.log('')
      console.log(chalk.yellow('💡 Try:'))
      console.log(chalk.gray('   • Press r to rerun tests'))
      console.log(chalk.gray('   • Check the error message above'))
      console.log(chalk.gray('   • Fix any syntax errors in test files'))
    }
  }

  /**
   * 打印監視模式幫助資訊
   */
  printWatchModeHelp() {
    console.log('')
    console.log(chalk.blue('📖 Watch Mode Commands:'))
    console.log(chalk.gray('   r - rerun all tests'))
    console.log(chalk.gray('   f - rerun only failed tests'))
    console.log(chalk.gray('   c - clear console'))
    console.log(chalk.gray('   p - toggle performance metrics'))
    console.log(chalk.gray('   v - toggle verbose error output'))
    console.log(chalk.gray('   q - quit watch mode'))
    console.log('')
  }

  /**
   * 處理鍵盤輸入
   * @param {string} key - 按鍵
   */
  handleKeyPress(key) {
    switch (key.toLowerCase()) {
      case 'r':
        console.log(chalk.blue('🔄 Rerunning all tests...'))
        this.startTestRun()
        break
        
      case 'f':
        console.log(chalk.blue('🔄 Rerunning failed tests...'))
        this.rerunFailedTests()
        break
        
      case 'c':
        console.clear()
        this.printWatchModeHelp()
        break
        
      case 'p':
        this.options.showPerformance = !this.options.showPerformance
        console.log(chalk.blue(`📊 Performance metrics: ${this.options.showPerformance ? 'ON' : 'OFF'}`))
        break
        
      case 'v':
        this.options.verboseErrors = !this.options.verboseErrors
        console.log(chalk.blue(`🔍 Verbose errors: ${this.options.verboseErrors ? 'ON' : 'OFF'}`))
        break
        
      case 'q':
        console.log(chalk.blue('👋 Exiting watch mode...'))
        process.exit(0)
        break
        
      default:
        // 忽略其他按鍵
        break
    }
  }

  /**
   * 重新執行失敗的測試
   */
  async rerunFailedTests() {
    const recentFailures = this.failureHistory.slice(0, 5)
    
    if (recentFailures.length === 0) {
      console.log(chalk.green('✅ No recent failures to rerun'))
      return
    }

    const failedFiles = [...new Set(recentFailures.map(f => f.file))]
    console.log(chalk.gray(`   Rerunning ${failedFiles.length} files with failures`))
    
    await this.startTestRun(failedFiles)
  }

  /**
   * 獲取測試統計資訊
   * @returns {Object} 統計資訊
   */
  getStats() {
    const latestMetrics = Array.from(this.performanceMetrics.values()).pop()
    
    return {
      totalRuns: this.testResults.size,
      recentFailures: this.failureHistory.length,
      averageRunTime: latestMetrics?.totalTime || 0,
      memoryUsage: latestMetrics?.memoryUsage || process.memoryUsage(),
      isWatchMode: this.isWatchMode,
      isRunning: this.isRunning
    }
  }

  /**
   * 清理資源
   */
  cleanup() {
    this.testResults.clear()
    this.performanceMetrics.clear()
    this.failureHistory = []
    this.watchedFiles.clear()
  }
}

/**
 * 測試性能分析器
 */
export class TestPerformanceAnalyzer {
  constructor() {
    this.testTimes = new Map()
    this.slowTestThreshold = 1000 // 1秒
    this.memorySnapshots = []
    this.startTime = null
    this.endTime = null
  }

  /**
   * 開始性能分析
   */
  startAnalysis() {
    this.startTime = performance.now()
    this.takeMemorySnapshot('start')
  }

  /**
   * 結束性能分析
   */
  endAnalysis() {
    this.endTime = performance.now()
    this.takeMemorySnapshot('end')
  }

  /**
   * 記錄測試時間
   * @param {string} testName - 測試名稱
   * @param {number} duration - 執行時間（毫秒）
   */
  recordTestTime(testName, duration) {
    this.testTimes.set(testName, duration)
    
    if (duration > this.slowTestThreshold) {
      console.log(chalk.yellow(`⚠️  Slow test detected: ${testName} (${Math.round(duration)}ms)`))
    }
  }

  /**
   * 拍攝記憶體快照
   * @param {string} label - 快照標籤
   */
  takeMemorySnapshot(label) {
    const memory = process.memoryUsage()
    this.memorySnapshots.push({
      label,
      timestamp: Date.now(),
      ...memory
    })
  }

  /**
   * 獲取慢測試
   * @returns {Array} 慢測試列表
   */
  getSlowTests() {
    return Array.from(this.testTimes.entries())
      .filter(([, duration]) => duration > this.slowTestThreshold)
      .sort(([, a], [, b]) => b - a)
      .map(([name, duration]) => ({ name, duration }))
  }

  /**
   * 獲取性能報告
   * @returns {Object} 性能報告
   */
  getPerformanceReport() {
    const totalTime = this.endTime - this.startTime
    const testCount = this.testTimes.size
    const slowTests = this.getSlowTests()
    
    const startMemory = this.memorySnapshots.find(s => s.label === 'start')
    const endMemory = this.memorySnapshots.find(s => s.label === 'end')
    
    const memoryDelta = endMemory && startMemory ? {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    } : null

    return {
      totalTime: Math.round(totalTime),
      testCount,
      averageTestTime: testCount > 0 ? Math.round(totalTime / testCount) : 0,
      slowTests,
      memoryDelta,
      recommendations: this.generatePerformanceRecommendations(slowTests, memoryDelta)
    }
  }

  /**
   * 生成性能建議
   * @param {Array} slowTests - 慢測試列表
   * @param {Object} memoryDelta - 記憶體變化
   * @returns {Array} 建議列表
   */
  generatePerformanceRecommendations(slowTests, memoryDelta) {
    const recommendations = []

    if (slowTests.length > 0) {
      recommendations.push(`Found ${slowTests.length} slow tests. Consider optimizing or splitting them.`)
      
      if (slowTests.length > 5) {
        recommendations.push('Consider running slow tests in parallel or using test.concurrent()')
      }
    }

    if (memoryDelta && memoryDelta.heapUsed > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected. Check for memory leaks in tests.')
      recommendations.push('Ensure proper cleanup in afterEach() hooks.')
    }

    if (this.testTimes.size > 100) {
      recommendations.push('Large test suite detected. Consider using test filtering or parallel execution.')
    }

    return recommendations
  }

  /**
   * 清理分析資料
   */
  cleanup() {
    this.testTimes.clear()
    this.memorySnapshots = []
    this.startTime = null
    this.endTime = null
  }
}

// 創建全域實例
export const watchController = new TestWatchController()
export const performanceAnalyzer = new TestPerformanceAnalyzer()

// 如果在監視模式下，設置鍵盤監聽
if (watchController.isWatchMode && process.stdin.isTTY) {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  
  process.stdin.on('data', (key) => {
    watchController.handleKeyPress(key)
  })
}

// 匯出便利函數
export function startWatchMode() {
  return watchController.startTestRun()
}

export function getWatchStats() {
  return watchController.getStats()
}

export function getPerformanceReport() {
  return performanceAnalyzer.getPerformanceReport()
}