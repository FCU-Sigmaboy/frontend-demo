#!/usr/bin/env node

// 測試性能監控腳本
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

/**
 * 測試性能監控和分析工具
 */
class TestPerformanceMonitor {
  constructor() {
    this.resultsFile = './coverage/test-results.json'
    this.performanceFile = './coverage/performance-report.json'
    this.thresholds = {
      slowTestWarning: 1000, // 1秒
      slowTestError: 5000,   // 5秒
      memoryWarning: 100,    // 100MB
      memoryError: 200       // 200MB
    }
  }

  /**
   * 分析測試結果
   */
  async analyzeResults() {
    try {
      if (!fs.existsSync(this.resultsFile)) {
        console.log(chalk.yellow('⚠️  No test results file found. Run tests first.'))
        return
      }

      const results = JSON.parse(fs.readFileSync(this.resultsFile, 'utf8'))
      const analysis = this.performAnalysis(results)
      
      this.printAnalysis(analysis)
      this.savePerformanceReport(analysis)
      
      // 根據分析結果設定退出代碼
      if (analysis.hasErrors) {
        process.exit(1)
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error analyzing test results:'), error.message)
      process.exit(1)
    }
  }

  /**
   * 執行性能分析
   * @param {Object} results - 測試結果
   * @returns {Object} 分析結果
   */
  performAnalysis(results) {
    const analysis = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowTests: [],
        fastTests: [],
        memoryUsage: null
      },
      warnings: [],
      errors: [],
      recommendations: [],
      hasWarnings: false,
      hasErrors: false
    }

    // 分析測試執行時間
    if (results.testResults) {
      this.analyzeTestDurations(results.testResults, analysis)
    }

    // 分析記憶體使用
    if (results.memoryUsage) {
      this.analyzeMemoryUsage(results.memoryUsage, analysis)
    }

    // 生成建議
    this.generateRecommendations(analysis)

    analysis.hasWarnings = analysis.warnings.length > 0
    analysis.hasErrors = analysis.errors.length > 0

    return analysis
  }

  /**
   * 分析測試執行時間
   * @param {Array} testResults - 測試結果
   * @param {Object} analysis - 分析物件
   */
  analyzeTestDurations(testResults, analysis) {
    const durations = []
    const slowTests = []
    const fastTests = []

    testResults.forEach(test => {
      if (test.duration !== undefined) {
        durations.push(test.duration)
        
        if (test.duration > this.thresholds.slowTestError) {
          analysis.errors.push(`Very slow test: ${test.name} (${Math.round(test.duration)}ms)`)
          slowTests.push({ name: test.name, duration: test.duration, severity: 'error' })
        } else if (test.duration > this.thresholds.slowTestWarning) {
          analysis.warnings.push(`Slow test: ${test.name} (${Math.round(test.duration)}ms)`)
          slowTests.push({ name: test.name, duration: test.duration, severity: 'warning' })
        } else if (test.duration < 10) {
          fastTests.push({ name: test.name, duration: test.duration })
        }
      }
    })

    if (durations.length > 0) {
      analysis.summary.totalTests = durations.length
      analysis.summary.totalDuration = durations.reduce((sum, d) => sum + d, 0)
      analysis.summary.averageDuration = analysis.summary.totalDuration / durations.length
      analysis.summary.slowTests = slowTests.sort((a, b) => b.duration - a.duration)
      analysis.summary.fastTests = fastTests.sort((a, b) => a.duration - b.duration)
    }
  }

  /**
   * 分析記憶體使用
   * @param {Object} memoryUsage - 記憶體使用資料
   * @param {Object} analysis - 分析物件
   */
  analyzeMemoryUsage(memoryUsage, analysis) {
    analysis.summary.memoryUsage = memoryUsage
    
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    
    if (heapUsedMB > this.thresholds.memoryError) {
      analysis.errors.push(`High memory usage: ${Math.round(heapUsedMB)}MB`)
    } else if (heapUsedMB > this.thresholds.memoryWarning) {
      analysis.warnings.push(`Elevated memory usage: ${Math.round(heapUsedMB)}MB`)
    }
  }

  /**
   * 生成建議
   * @param {Object} analysis - 分析物件
   */
  generateRecommendations(analysis) {
    const { summary } = analysis

    // 慢測試建議
    if (summary.slowTests.length > 0) {
      analysis.recommendations.push('Consider optimizing slow tests or splitting them into smaller units')
      
      if (summary.slowTests.length > 5) {
        analysis.recommendations.push('Use test.concurrent() for independent slow tests')
      }
    }

    // 平均執行時間建議
    if (summary.averageDuration > 500) {
      analysis.recommendations.push('Average test duration is high - review test setup and teardown')
    }

    // 記憶體使用建議
    if (summary.memoryUsage && summary.memoryUsage.heapUsed > 50 * 1024 * 1024) {
      analysis.recommendations.push('Check for memory leaks in tests and ensure proper cleanup')
    }

    // 測試數量建議
    if (summary.totalTests > 200) {
      analysis.recommendations.push('Large test suite - consider parallel execution or test filtering')
    }

    // 快速測試建議
    if (summary.fastTests.length > summary.totalTests * 0.8) {
      analysis.recommendations.push('Most tests are very fast - good job on test efficiency!')
    }
  }

  /**
   * 打印分析結果
   * @param {Object} analysis - 分析結果
   */
  printAnalysis(analysis) {
    const { summary } = analysis

    console.log('')
    console.log(chalk.blue('📊 Test Performance Analysis'))
    console.log(chalk.blue('=' .repeat(50)))

    // 摘要統計
    console.log('')
    console.log(chalk.green('📈 Summary Statistics:'))
    console.log(chalk.gray(`   Total tests: ${summary.totalTests}`))
    console.log(chalk.gray(`   Total duration: ${this.formatDuration(summary.totalDuration)}`))
    console.log(chalk.gray(`   Average duration: ${this.formatDuration(summary.averageDuration)}`))
    
    if (summary.memoryUsage) {
      const memoryMB = Math.round(summary.memoryUsage.heapUsed / 1024 / 1024)
      console.log(chalk.gray(`   Memory usage: ${memoryMB}MB`))
    }

    // 慢測試
    if (summary.slowTests.length > 0) {
      console.log('')
      console.log(chalk.yellow(`🐌 Slow Tests (${summary.slowTests.length}):`))
      summary.slowTests.slice(0, 10).forEach((test, index) => {
        const color = test.severity === 'error' ? chalk.red : chalk.yellow
        console.log(color(`   ${index + 1}. ${test.name} - ${this.formatDuration(test.duration)}`))
      })
      
      if (summary.slowTests.length > 10) {
        console.log(chalk.gray(`   ... and ${summary.slowTests.length - 10} more slow tests`))
      }
    }

    // 快速測試
    if (summary.fastTests.length > 0) {
      console.log('')
      console.log(chalk.green(`⚡ Fastest Tests (${Math.min(5, summary.fastTests.length)}):`))
      summary.fastTests.slice(0, 5).forEach((test, index) => {
        console.log(chalk.green(`   ${index + 1}. ${test.name} - ${this.formatDuration(test.duration)}`))
      })
    }

    // 警告
    if (analysis.warnings.length > 0) {
      console.log('')
      console.log(chalk.yellow('⚠️  Warnings:'))
      analysis.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`))
      })
    }

    // 錯誤
    if (analysis.errors.length > 0) {
      console.log('')
      console.log(chalk.red('❌ Errors:'))
      analysis.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`))
      })
    }

    // 建議
    if (analysis.recommendations.length > 0) {
      console.log('')
      console.log(chalk.blue('💡 Recommendations:'))
      analysis.recommendations.forEach(recommendation => {
        console.log(chalk.gray(`   • ${recommendation}`))
      })
    }

    console.log('')
    console.log(chalk.blue('=' .repeat(50)))
  }

  /**
   * 儲存性能報告
   * @param {Object} analysis - 分析結果
   */
  savePerformanceReport(analysis) {
    try {
      const reportDir = path.dirname(this.performanceFile)
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }

      fs.writeFileSync(this.performanceFile, JSON.stringify(analysis, null, 2))
      console.log(chalk.green(`📄 Performance report saved to ${this.performanceFile}`))
    } catch (error) {
      console.log(chalk.red(`❌ Failed to save performance report: ${error.message}`))
    }
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
   * 生成性能趨勢報告
   */
  generateTrendReport() {
    const historyFile = './coverage/performance-history.json'
    let history = []

    // 讀取歷史資料
    if (fs.existsSync(historyFile)) {
      try {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf8'))
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not read performance history'))
      }
    }

    // 讀取當前報告
    if (fs.existsSync(this.performanceFile)) {
      try {
        const currentReport = JSON.parse(fs.readFileSync(this.performanceFile, 'utf8'))
        
        // 添加到歷史記錄
        history.push({
          timestamp: currentReport.timestamp,
          totalTests: currentReport.summary.totalTests,
          totalDuration: currentReport.summary.totalDuration,
          averageDuration: currentReport.summary.averageDuration,
          slowTestsCount: currentReport.summary.slowTests.length,
          memoryUsage: currentReport.summary.memoryUsage?.heapUsed || 0
        })

        // 保持最近 30 次記錄
        if (history.length > 30) {
          history = history.slice(-30)
        }

        // 儲存歷史記錄
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2))

        // 分析趨勢
        this.analyzeTrends(history)

      } catch (error) {
        console.log(chalk.red(`❌ Error generating trend report: ${error.message}`))
      }
    }
  }

  /**
   * 分析性能趨勢
   * @param {Array} history - 歷史資料
   */
  analyzeTrends(history) {
    if (history.length < 2) return

    console.log('')
    console.log(chalk.blue('📈 Performance Trends'))
    console.log(chalk.blue('-'.repeat(30)))

    const recent = history.slice(-5) // 最近 5 次
    const older = history.slice(-10, -5) // 之前 5 次

    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, r) => sum + r.averageDuration, 0) / recent.length
      const olderAvg = older.reduce((sum, r) => sum + r.averageDuration, 0) / older.length
      
      const change = ((recentAvg - olderAvg) / olderAvg) * 100
      
      if (Math.abs(change) > 5) {
        const trend = change > 0 ? 'slower' : 'faster'
        const color = change > 0 ? chalk.red : chalk.green
        console.log(color(`   Tests are ${Math.abs(change).toFixed(1)}% ${trend} than before`))
      } else {
        console.log(chalk.gray('   Performance is stable'))
      }
    }

    // 記憶體趨勢
    const recentMemory = recent.filter(r => r.memoryUsage > 0)
    const olderMemory = older.filter(r => r.memoryUsage > 0)
    
    if (recentMemory.length > 0 && olderMemory.length > 0) {
      const recentMemAvg = recentMemory.reduce((sum, r) => sum + r.memoryUsage, 0) / recentMemory.length
      const olderMemAvg = olderMemory.reduce((sum, r) => sum + r.memoryUsage, 0) / olderMemory.length
      
      const memChange = ((recentMemAvg - olderMemAvg) / olderMemAvg) * 100
      
      if (Math.abs(memChange) > 10) {
        const trend = memChange > 0 ? 'higher' : 'lower'
        const color = memChange > 0 ? chalk.red : chalk.green
        console.log(color(`   Memory usage is ${Math.abs(memChange).toFixed(1)}% ${trend}`))
      }
    }
  }
}

// 主執行邏輯
async function main() {
  const args = process.argv.slice(2)
  const monitor = new TestPerformanceMonitor()

  if (args.includes('--trend')) {
    monitor.generateTrendReport()
  } else {
    await monitor.analyzeResults()
  }
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('❌ Script failed:'), error.message)
    process.exit(1)
  })
}

export { TestPerformanceMonitor }