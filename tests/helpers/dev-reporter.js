// 開發者友好的測試報告器
import chalk from 'chalk'
import path from 'path'
import { performance } from 'perf_hooks'

/**
 * 開發者友好的測試報告器
 * 提供清晰、有用的測試輸出和錯誤報告
 */
export class DeveloperTestReporter {
  constructor(options = {}) {
    this.options = {
      showPassedTests: false,
      showSkippedTests: true,
      showPerformance: true,
      showCoverage: false,
      colorOutput: true,
      verboseErrors: true,
      groupByFile: true,
      showProgress: true,
      maxErrorLines: 20,
      ...options
    }
    
    this.testResults = []
    this.startTime = null
    this.endTime = null
    this.currentSuite = null
    this.totalTests = 0
    this.passedTests = 0
    this.failedTests = 0
    this.skippedTests = 0
    this.slowTests = []
    this.slowTestThreshold = 1000 // 1秒
  }

  /**
   * 開始測試報告
   * @param {Object} ctx - 測試上下文
   */
  onInit(ctx) {
    this.startTime = performance.now()
    this.totalTests = ctx.state.getFiles().reduce((acc, file) => {
      return acc + (file.tasks?.length || 0)
    }, 0)
    
    if (this.options.colorOutput) {
      console.log(chalk.blue('🧪 Starting test execution...'))
      console.log(chalk.gray(`   Total tests: ${this.totalTests}`))
      console.log('')
    }
  }

  /**
   * 測試套件開始
   * @param {Object} suite - 測試套件
   */
  onSuiteStart(suite) {
    this.currentSuite = suite
    
    if (this.options.groupByFile && suite.file) {
      const relativePath = path.relative(process.cwd(), suite.file)
      console.log(chalk.blue(`📁 ${relativePath}`))
    }
  }

  /**
   * 測試套件結束
   * @param {Object} suite - 測試套件
   */
  onSuiteFinish(suite) {
    if (this.options.groupByFile && suite.file) {
      const stats = this.getSuiteStats(suite)
      this.printSuiteStats(stats)
      console.log('')
    }
  }

  /**
   * 單個測試開始
   * @param {Object} test - 測試物件
   */
  onTestStart(test) {
    if (this.options.showProgress) {
      process.stdout.write(chalk.gray('.'))
    }
  }

  /**
   * 單個測試結束
   * @param {Object} test - 測試物件
   */
  onTestFinish(test) {
    this.testResults.push(test)
    
    const duration = test.result?.duration || 0
    
    switch (test.result?.state) {
      case 'pass':
        this.passedTests++
        if (this.options.showPassedTests) {
          console.log(chalk.green(`  ✓ ${test.name} ${this.formatDuration(duration)}`))
        }
        break
        
      case 'fail':
        this.failedTests++
        console.log(chalk.red(`  ✗ ${test.name} ${this.formatDuration(duration)}`))
        if (test.result?.errors?.length > 0) {
          this.printTestErrors(test)
        }
        break
        
      case 'skip':
        this.skippedTests++
        if (this.options.showSkippedTests) {
          console.log(chalk.yellow(`  ○ ${test.name} (skipped)`))
        }
        break
        
      case 'todo':
        console.log(chalk.cyan(`  ◯ ${test.name} (todo)`))
        break
    }
    
    // 記錄慢測試
    if (duration > this.slowTestThreshold) {
      this.slowTests.push({
        name: test.name,
        file: test.file,
        duration
      })
    }
  }

  /**
   * 所有測試完成
   * @param {Object} ctx - 測試上下文
   */
  onFinished(ctx) {
    this.endTime = performance.now()
    const totalDuration = this.endTime - this.startTime
    
    console.log('')
    this.printFinalSummary(totalDuration)
    
    if (this.options.showPerformance) {
      this.printPerformanceSummary()
    }
    
    if (this.failedTests > 0) {
      this.printFailureSummary()
    }
    
    if (this.slowTests.length > 0) {
      this.printSlowTestsSummary()
    }
  }

  /**
   * 打印測試錯誤
   * @param {Object} test - 測試物件
   */
  printTestErrors(test) {
    const errors = test.result?.errors || []
    
    errors.forEach((error, index) => {
      console.log('')
      console.log(chalk.red(`    Error ${index + 1}:`))
      
      // 錯誤訊息
      if (error.message) {
        console.log(chalk.red(`    ${error.message}`))
      }
      
      // 堆疊追蹤
      if (error.stack && this.options.verboseErrors) {
        const stackLines = this.formatStackTrace(error.stack)
        stackLines.forEach(line => {
          console.log(chalk.gray(`    ${line}`))
        })
      }
      
      // 差異比較（如果是斷言錯誤）
      if (error.actual !== undefined && error.expected !== undefined) {
        this.printDiff(error.expected, error.actual)
      }
      
      // 修復建議
      const suggestions = this.generateFixSuggestions(error, test.name)
      if (suggestions.length > 0) {
        console.log('')
        console.log(chalk.blue('    💡 Suggestions:'))
        suggestions.forEach(suggestion => {
          console.log(chalk.gray(`      • ${suggestion}`))
        })
      }
    })
  }

  /**
   * 格式化堆疊追蹤
   * @param {string} stack - 堆疊追蹤字串
   * @returns {Array} 格式化的堆疊行
   */
  formatStackTrace(stack) {
    const lines = stack.split('\n')
    const relevantLines = []
    const projectRoot = process.cwd()
    
    for (const line of lines) {
      // 跳過 Node.js 內部檔案
      if (line.includes('node_modules') || 
          line.includes('node:internal') ||
          line.includes('vitest/dist')) {
        continue
      }
      
      // 高亮專案檔案
      if (line.includes(projectRoot)) {
        const relativePath = line.replace(projectRoot, '.')
        relevantLines.push(relativePath)
      } else {
        relevantLines.push(line.trim())
      }
      
      // 限制行數
      if (relevantLines.length >= this.options.maxErrorLines) {
        relevantLines.push('... (truncated)')
        break
      }
    }
    
    return relevantLines
  }

  /**
   * 打印差異比較
   * @param {*} expected - 期望值
   * @param {*} actual - 實際值
   */
  printDiff(expected, actual) {
    console.log('')
    console.log(chalk.red('    Expected:'))
    console.log(chalk.green(`    ${this.formatValue(expected)}`))
    console.log(chalk.red('    Received:'))
    console.log(chalk.red(`    ${this.formatValue(actual)}`))
  }

  /**
   * 格式化值用於顯示
   * @param {*} value - 要格式化的值
   * @returns {string} 格式化後的字串
   */
  formatValue(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
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
    const stack = error.stack?.toLowerCase() || ''
    
    // 常見錯誤模式的建議
    if (errorMessage.includes('cannot read property') || errorMessage.includes('cannot read properties')) {
      suggestions.push('Check if the object is properly initialized')
      suggestions.push('Use optional chaining (?.) or add null checks')
    }
    
    if (errorMessage.includes('is not a function')) {
      suggestions.push('Verify the method exists and is properly imported')
      suggestions.push('Check if mocks are set up correctly')
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('exceeded')) {
      suggestions.push('Increase test timeout or check for infinite loops')
      suggestions.push('Ensure all async operations are properly awaited')
    }
    
    if (errorMessage.includes('expected') && errorMessage.includes('received')) {
      suggestions.push('Check assertion values and types')
      suggestions.push('Consider using more specific matchers')
    }
    
    if (errorMessage.includes('mock') || stack.includes('mock')) {
      suggestions.push('Verify mock setup and implementation')
      suggestions.push('Check if mocks are cleared between tests')
    }
    
    if (errorMessage.includes('vue') || stack.includes('vue')) {
      suggestions.push('Check Vue component mounting and props')
      suggestions.push('Verify Vue Test Utils configuration')
    }
    
    if (errorMessage.includes('pinia') || stack.includes('pinia')) {
      suggestions.push('Check Pinia store setup and state')
      suggestions.push('Verify store actions and getters')
    }
    
    if (errorMessage.includes('router') || stack.includes('router')) {
      suggestions.push('Check Vue Router mock configuration')
      suggestions.push('Verify route parameters and navigation')
    }

    return suggestions
  }

  /**
   * 獲取測試套件統計
   * @param {Object} suite - 測試套件
   * @returns {Object} 統計資訊
   */
  getSuiteStats(suite) {
    const tests = suite.tasks || []
    const passed = tests.filter(t => t.result?.state === 'pass').length
    const failed = tests.filter(t => t.result?.state === 'fail').length
    const skipped = tests.filter(t => t.result?.state === 'skip').length
    const total = tests.length
    
    return { passed, failed, skipped, total }
  }

  /**
   * 打印測試套件統計
   * @param {Object} stats - 統計資訊
   */
  printSuiteStats(stats) {
    const { passed, failed, skipped, total } = stats
    
    let output = '  '
    
    if (passed > 0) {
      output += chalk.green(`${passed} passed`)
    }
    
    if (failed > 0) {
      if (passed > 0) output += ', '
      output += chalk.red(`${failed} failed`)
    }
    
    if (skipped > 0) {
      if (passed > 0 || failed > 0) output += ', '
      output += chalk.yellow(`${skipped} skipped`)
    }
    
    output += chalk.gray(` (${total} total)`)
    
    console.log(output)
  }

  /**
   * 打印最終摘要
   * @param {number} totalDuration - 總執行時間
   */
  printFinalSummary(totalDuration) {
    console.log(chalk.blue('📊 Test Results Summary'))
    console.log('')
    
    // 測試結果統計
    const total = this.passedTests + this.failedTests + this.skippedTests
    
    if (this.passedTests > 0) {
      console.log(chalk.green(`  ✓ ${this.passedTests} tests passed`))
    }
    
    if (this.failedTests > 0) {
      console.log(chalk.red(`  ✗ ${this.failedTests} tests failed`))
    }
    
    if (this.skippedTests > 0) {
      console.log(chalk.yellow(`  ○ ${this.skippedTests} tests skipped`))
    }
    
    console.log(chalk.gray(`  Total: ${total} tests`))
    console.log(chalk.gray(`  Time: ${this.formatDuration(totalDuration)}`))
    
    // 整體結果
    console.log('')
    if (this.failedTests === 0) {
      console.log(chalk.green('🎉 All tests passed!'))
    } else {
      console.log(chalk.red(`❌ ${this.failedTests} test${this.failedTests === 1 ? '' : 's'} failed`))
    }
  }

  /**
   * 打印性能摘要
   */
  printPerformanceSummary() {
    console.log('')
    console.log(chalk.yellow('⚡ Performance Summary'))
    
    const totalDuration = this.endTime - this.startTime
    const averageTestTime = this.totalTests > 0 ? totalDuration / this.totalTests : 0
    
    console.log(chalk.gray(`  Average test time: ${this.formatDuration(averageTestTime)}`))
    
    // 記憶體使用
    const memory = process.memoryUsage()
    const memoryMB = Math.round(memory.heapUsed / 1024 / 1024)
    console.log(chalk.gray(`  Memory usage: ${memoryMB}MB`))
    
    // 性能建議
    const recommendations = this.generatePerformanceRecommendations()
    if (recommendations.length > 0) {
      console.log('')
      console.log(chalk.blue('  💡 Performance Tips:'))
      recommendations.forEach(tip => {
        console.log(chalk.gray(`    • ${tip}`))
      })
    }
  }

  /**
   * 打印失敗摘要
   */
  printFailureSummary() {
    console.log('')
    console.log(chalk.red('❌ Failed Tests Summary'))
    
    const failedTests = this.testResults.filter(t => t.result?.state === 'fail')
    
    failedTests.forEach((test, index) => {
      const relativePath = path.relative(process.cwd(), test.file || '')
      console.log(chalk.red(`  ${index + 1}. ${test.name}`))
      console.log(chalk.gray(`     ${relativePath}`))
    })
  }

  /**
   * 打印慢測試摘要
   */
  printSlowTestsSummary() {
    console.log('')
    console.log(chalk.yellow('🐌 Slow Tests (>1s)'))
    
    // 按執行時間排序
    const sortedSlowTests = this.slowTests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10) // 只顯示前 10 個最慢的測試
    
    sortedSlowTests.forEach((test, index) => {
      const relativePath = path.relative(process.cwd(), test.file || '')
      console.log(chalk.yellow(`  ${index + 1}. ${test.name} - ${this.formatDuration(test.duration)}`))
      console.log(chalk.gray(`     ${relativePath}`))
    })
    
    if (this.slowTests.length > 10) {
      console.log(chalk.gray(`  ... and ${this.slowTests.length - 10} more slow tests`))
    }
  }

  /**
   * 生成性能建議
   * @returns {Array} 建議列表
   */
  generatePerformanceRecommendations() {
    const recommendations = []
    const totalDuration = this.endTime - this.startTime
    
    if (this.slowTests.length > 0) {
      recommendations.push(`${this.slowTests.length} slow tests detected. Consider optimization.`)
    }
    
    if (this.slowTests.length > 5) {
      recommendations.push('Use test.concurrent() for independent slow tests')
    }
    
    if (totalDuration > 30000) { // 30 秒
      recommendations.push('Consider using test filtering or parallel execution')
    }
    
    if (this.totalTests > 100) {
      recommendations.push('Large test suite - consider splitting into smaller suites')
    }
    
    const memory = process.memoryUsage()
    if (memory.heapUsed > 100 * 1024 * 1024) { // 100MB
      recommendations.push('High memory usage - check for memory leaks in tests')
    }

    return recommendations
  }

  /**
   * 格式化持續時間
   * @param {number} ms - 毫秒
   * @returns {string} 格式化的時間字串
   */
  formatDuration(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.round((ms % 60000) / 1000)
      return `${minutes}m ${seconds}s`
    }
  }

  /**
   * 清理報告器資源
   */
  cleanup() {
    this.testResults = []
    this.slowTests = []
    this.currentSuite = null
    this.startTime = null
    this.endTime = null
    this.totalTests = 0
    this.passedTests = 0
    this.failedTests = 0
    this.skippedTests = 0
  }
}

/**
 * 創建開發者報告器實例
 * @param {Object} options - 配置選項
 * @returns {DeveloperTestReporter} 報告器實例
 */
export function createDeveloperReporter(options = {}) {
  return new DeveloperTestReporter(options)
}

// 匯出預設實例
export const devReporter = new DeveloperTestReporter()