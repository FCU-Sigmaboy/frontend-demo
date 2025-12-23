#!/usr/bin/env node

/**
 * 覆蓋率檢查腳本
 * 
 * 根據需求 2.1, 2.2, 2.3, 2.4, 2.5 實作覆蓋率檢查和報告生成
 * 
 * 使用方式:
 * - npm run test:coverage:check - 執行覆蓋率檢查
 * - node scripts/coverage-check.js --format=html - 生成 HTML 報告
 * - node scripts/coverage-check.js --ci - CI 模式執行
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import CoverageReporter from '../tests/helpers/coverage-reporter.js'

const __filename = fileURLToPath(import.meta.url)

class CoverageChecker {
  constructor() {
    this.reporter = new CoverageReporter()
    this.options = this.parseArguments()
  }

  /**
   * 解析命令列參數
   * @returns {Object} 解析後的選項
   */
  parseArguments() {
    const args = process.argv.slice(2)
    const options = {
      format: 'text',
      ci: false,
      threshold: null,
      output: null
    }

    args.forEach(arg => {
      if (arg.startsWith('--format=')) {
        options.format = arg.split('=')[1]
      } else if (arg === '--ci') {
        options.ci = true
      } else if (arg.startsWith('--threshold=')) {
        options.threshold = parseInt(arg.split('=')[1])
      } else if (arg.startsWith('--output=')) {
        options.output = arg.split('=')[1]
      }
    })

    return options
  }

  /**
   * 執行覆蓋率檢查
   */
  async run() {
    try {
      console.log('🔍 開始執行覆蓋率檢查...\n')

      // 驗證配置
      await this.validateConfiguration()

      // 讀取覆蓋率資料
      const coverageData = await this.loadCoverageData()

      // 生成報告
      await this.generateReports(coverageData)

      // 檢查閾值
      await this.checkThresholds(coverageData)

      console.log('✅ 覆蓋率檢查完成')

    } catch (error) {
      console.error('❌ 覆蓋率檢查失敗:', error.message)
      process.exit(1)
    }
  }

  /**
   * 驗證配置
   */
  async validateConfiguration() {
    try {
      // 讀取 Vitest 配置
      const configPath = path.join(process.cwd(), 'vitest.config.js')
      
      if (!fs.existsSync(configPath)) {
        throw new Error('找不到 vitest.config.js 配置檔案')
      }

      console.log('✅ 配置檔案驗證通過')

    } catch (error) {
      throw new Error(`配置驗證失敗: ${error.message}`)
    }
  }

  /**
   * 載入覆蓋率資料
   * @returns {Object} 覆蓋率資料
   */
  async loadCoverageData() {
    const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-final.json')
    
    if (!fs.existsSync(coverageFile)) {
      throw new Error('找不到覆蓋率資料檔案。請先執行 npm run test:coverage')
    }

    try {
      const data = fs.readFileSync(coverageFile, 'utf8')
      const coverageData = JSON.parse(data)
      
      console.log('✅ 覆蓋率資料載入成功')
      return coverageData
      
    } catch (error) {
      throw new Error(`載入覆蓋率資料失敗: ${error.message}`)
    }
  }

  /**
   * 生成報告
   * @param {Object} coverageData - 覆蓋率資料
   */
  async generateReports(coverageData) {
    console.log('📊 生成覆蓋率報告...\n')

    // 生成文字摘要報告
    const summaryReport = this.reporter.generateSummaryReport(coverageData)
    console.log(summaryReport)

    // 根據選項生成其他格式報告
    if (this.options.format === 'html' || this.options.ci) {
      await this.generateHTMLReport(coverageData)
    }

    if (this.options.format === 'json' || this.options.ci) {
      await this.generateJSONReport(coverageData)
    }

    // CI 模式下生成 PR 註解用的摘要
    if (this.options.ci) {
      await this.generateCISummary(coverageData)
    }
  }

  /**
   * 生成 HTML 報告
   * @param {Object} coverageData - 覆蓋率資料
   */
  async generateHTMLReport(coverageData) {
    try {
      const htmlReport = this.reporter.generateHTMLReport(coverageData)
      const outputPath = this.options.output || path.join(process.cwd(), 'coverage', 'enhanced-report.html')
      
      fs.writeFileSync(outputPath, htmlReport, 'utf8')
      console.log(`📄 HTML 報告已生成: ${outputPath}`)
      
    } catch (error) {
      console.warn(`⚠️  HTML 報告生成失敗: ${error.message}`)
    }
  }

  /**
   * 生成 JSON 報告
   * @param {Object} coverageData - 覆蓋率資料
   */
  async generateJSONReport(coverageData) {
    try {
      const jsonReport = {
        timestamp: new Date().toISOString(),
        summary: this.generateSummaryData(coverageData),
        priorities: this.generatePriorityData(coverageData),
        files: this.generateFileData(coverageData)
      }

      const outputPath = this.options.output || path.join(process.cwd(), 'coverage', 'enhanced-report.json')
      
      fs.writeFileSync(outputPath, JSON.stringify(jsonReport, null, 2), 'utf8')
      console.log(`📄 JSON 報告已生成: ${outputPath}`)
      
    } catch (error) {
      console.warn(`⚠️  JSON 報告生成失敗: ${error.message}`)
    }
  }

  /**
   * 生成摘要資料
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {Object} 摘要資料
   */
  generateSummaryData(coverageData) {
    return {
      lines: coverageData.total?.lines?.pct || 0,
      functions: coverageData.total?.functions?.pct || 0,
      branches: coverageData.total?.branches?.pct || 0,
      statements: coverageData.total?.statements?.pct || 0,
      totalFiles: Object.keys(coverageData.files || {}).length
    }
  }

  /**
   * 生成 CI 摘要報告
   * @param {Object} coverageData - 覆蓋率資料
   */
  async generateCISummary(coverageData) {
    try {
      const summary = this.generateCoverageMarkdown(coverageData)
      const outputPath = path.join(process.cwd(), 'coverage', 'coverage-summary.txt')
      
      fs.writeFileSync(outputPath, summary, 'utf8')
      console.log(`📄 CI 摘要報告已生成: ${outputPath}`)
      
    } catch (error) {
      console.warn(`⚠️  CI 摘要報告生成失敗: ${error.message}`)
    }
  }

  /**
   * 生成覆蓋率 Markdown 報告
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} Markdown 格式的報告
   */
  generateCoverageMarkdown(coverageData) {
    const summary = this.generateSummaryData(coverageData)
    
    let markdown = '## 📊 測試覆蓋率報告\n\n'
    
    // 總體覆蓋率
    markdown += '### 總體覆蓋率\n\n'
    markdown += '| 指標 | 覆蓋率 | 狀態 |\n'
    markdown += '|------|--------|------|\n'
    markdown += `| 行覆蓋率 | ${summary.lines.toFixed(2)}% | ${this.getCoverageStatus(summary.lines, 80)} |\n`
    markdown += `| 函數覆蓋率 | ${summary.functions.toFixed(2)}% | ${this.getCoverageStatus(summary.functions, 80)} |\n`
    markdown += `| 分支覆蓋率 | ${summary.branches.toFixed(2)}% | ${this.getCoverageStatus(summary.branches, 75)} |\n`
    markdown += `| 語句覆蓋率 | ${summary.statements.toFixed(2)}% | ${this.getCoverageStatus(summary.statements, 80)} |\n\n`
    
    // 核心模組覆蓋率
    markdown += '### 核心模組覆蓋率\n\n'
    const coreModules = this.getCoreModulesCoverage(coverageData)
    
    if (coreModules.length > 0) {
      markdown += '| 模組 | 行覆蓋率 | 函數覆蓋率 | 分支覆蓋率 | 狀態 |\n'
      markdown += '|------|----------|------------|------------|------|\n'
      
      coreModules.forEach(module => {
        const status = this.getModuleStatus(module)
        markdown += `| ${module.name} | ${module.lines.toFixed(1)}% | ${module.functions.toFixed(1)}% | ${module.branches.toFixed(1)}% | ${status} |\n`
      })
      markdown += '\n'
    }
    
    // 統計資訊
    markdown += '### 統計資訊\n\n'
    markdown += `- 📁 總檔案數: ${summary.totalFiles}\n`
    markdown += `- ⏰ 報告生成時間: ${new Date().toLocaleString('zh-TW')}\n`
    markdown += `- 🎯 全域閾值: 行 80%, 函數 80%, 分支 75%\n\n`
    
    // 建議
    if (summary.lines < 80 || summary.functions < 80 || summary.branches < 75) {
      markdown += '### ⚠️ 改善建議\n\n'
      if (summary.lines < 80) {
        markdown += '- 行覆蓋率低於 80%，建議增加更多測試案例\n'
      }
      if (summary.functions < 80) {
        markdown += '- 函數覆蓋率低於 80%，建議測試更多函數\n'
      }
      if (summary.branches < 75) {
        markdown += '- 分支覆蓋率低於 75%，建議增加條件分支測試\n'
      }
      markdown += '\n'
    }
    
    markdown += '---\n'
    markdown += '*此報告由自動化測試系統生成*'
    
    return markdown
  }

  /**
   * 獲取覆蓋率狀態圖示
   * @param {number} coverage - 覆蓋率百分比
   * @param {number} threshold - 閾值
   * @returns {string} 狀態圖示
   */
  getCoverageStatus(coverage, threshold) {
    if (coverage >= threshold) {
      return '✅'
    } else if (coverage >= threshold - 10) {
      return '⚠️'
    } else {
      return '❌'
    }
  }

  /**
   * 獲取核心模組覆蓋率
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {Array} 核心模組覆蓋率資料
   */
  getCoreModulesCoverage(coverageData) {
    const coreModules = []
    const files = coverageData.files || {}
    
    // 定義核心模組路徑
    const corePatterns = [
      { pattern: /src\/api\//, name: 'API 層', threshold: 90 },
      { pattern: /src\/stores\//, name: 'Store 狀態管理', threshold: 85 },
      { pattern: /src\/composables\//, name: 'Composables', threshold: 85 },
      { pattern: /src\/utils\//, name: '工具函數', threshold: 100 },
      { pattern: /src\/components\/dashboard\//, name: '儀表板組件', threshold: 80 },
      { pattern: /src\/components\/transaction\//, name: '交易組件', threshold: 80 }
    ]
    
    corePatterns.forEach(({ pattern, name, threshold }) => {
      const moduleFiles = Object.entries(files).filter(([path]) => pattern.test(path))
      
      if (moduleFiles.length > 0) {
        const totals = moduleFiles.reduce((acc, [, data]) => {
          acc.lines += data.lines?.pct || 0
          acc.functions += data.functions?.pct || 0
          acc.branches += data.branches?.pct || 0
          acc.statements += data.statements?.pct || 0
          acc.count += 1
          return acc
        }, { lines: 0, functions: 0, branches: 0, statements: 0, count: 0 })
        
        coreModules.push({
          name,
          lines: totals.lines / totals.count,
          functions: totals.functions / totals.count,
          branches: totals.branches / totals.count,
          statements: totals.statements / totals.count,
          threshold,
          fileCount: totals.count
        })
      }
    })
    
    return coreModules
  }

  /**
   * 獲取模組狀態
   * @param {Object} module - 模組資料
   * @returns {string} 狀態圖示
   */
  getModuleStatus(module) {
    const { lines, functions, branches, threshold } = module
    const avgCoverage = (lines + functions + branches) / 3
    
    if (avgCoverage >= threshold) {
      return '✅'
    } else if (avgCoverage >= threshold - 10) {
      return '⚠️'
    } else {
      return '❌'
    }
  }

  /**
   * 生成優先級資料
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {Object} 優先級資料
   */
  generatePriorityData(coverageData) {
    return this.getCoreModulesCoverage(coverageData)
  }

  /**
   * 生成檔案資料
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {Array} 檔案資料
   */
  generateFileData(coverageData) {
    if (!coverageData.files) return []

    return Object.entries(coverageData.files).map(([path, data]) => ({
      path,
      lines: data.lines?.pct || 0,
      functions: data.functions?.pct || 0,
      branches: data.branches?.pct || 0,
      statements: data.statements?.pct || 0
    }))
  }

  /**
   * 檢查閾值
   * @param {Object} coverageData - 覆蓋率資料
   */
  async checkThresholds(coverageData) {
    console.log('🎯 檢查覆蓋率閾值...\n')

    try {
      // 讀取 Vitest 配置中的閾值
      const configModule = await import(path.join(process.cwd(), 'vitest.config.js'))
      const config = configModule.default
      const thresholds = config.test?.coverage?.thresholds || {}

      // 使用報告器處理失敗情況
      this.reporter.handleCoverageFailures(coverageData, thresholds)

      console.log('✅ 所有檔案都達到了覆蓋率閾值要求')

    } catch (error) {
      if (error.message.includes('process.exit')) {
        // 這是預期的失敗退出，不需要額外處理
        throw error
      }
      console.warn(`⚠️  閾值檢查警告: ${error.message}`)
    }
  }
}

// 如果直接執行此腳本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  const checker = new CoverageChecker()
  checker.run().catch(error => {
    console.error('執行失敗:', error.message)
    process.exit(1)
  })
}

export default CoverageChecker