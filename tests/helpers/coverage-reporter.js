/**
 * 增強的覆蓋率報告工具
 * 
 * 根據需求 2.1, 2.2, 2.3, 2.4 實作覆蓋率報告生成和錯誤處理
 */

import { CoverageFailureHandler, COVERAGE_PRIORITIES } from './coverage-config.js'

/**
 * 覆蓋率報告生成器
 * 提供詳細的覆蓋率分析和報告
 */
export class CoverageReporter {
  constructor() {
    this.failureHandler = new CoverageFailureHandler()
  }

  /**
   * 生成覆蓋率摘要報告
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} 格式化的摘要報告
   */
  generateSummaryReport(coverageData) {
    let report = '\n📊 測試覆蓋率摘要報告\n'
    report += '=' .repeat(50) + '\n\n'

    // 全域覆蓋率統計
    if (coverageData.total) {
      const total = coverageData.total
      report += '🌐 全域覆蓋率統計:\n'
      report += `   行覆蓋率:     ${this.formatPercentage(total.lines)}%\n`
      report += `   函數覆蓋率:   ${this.formatPercentage(total.functions)}%\n`
      report += `   分支覆蓋率:   ${this.formatPercentage(total.branches)}%\n`
      report += `   語句覆蓋率:   ${this.formatPercentage(total.statements)}%\n\n`
    }

    // 按優先級分組的覆蓋率統計
    report += this.generatePriorityReport(coverageData)

    // 覆蓋率趨勢分析
    report += this.generateTrendAnalysis(coverageData)

    return report
  }

  /**
   * 生成優先級覆蓋率報告
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} 優先級報告
   */
  generatePriorityReport(coverageData) {
    let report = '📋 按優先級分組的覆蓋率:\n'
    report += '-'.repeat(30) + '\n'

    for (const [priority, config] of Object.entries(COVERAGE_PRIORITIES)) {
      const priorityStats = this.calculatePriorityStats(coverageData, config.files)
      const status = this.getPriorityStatus(priorityStats, config.threshold)
      
      report += `${status.icon} ${this.getPriorityLabel(priority)}:\n`
      report += `   目標閾值: ${config.threshold}%\n`
      report += `   平均覆蓋率: ${this.formatPercentage(priorityStats.average)}%\n`
      report += `   檔案數量: ${priorityStats.fileCount}\n`
      
      if (status.failing > 0) {
        report += `   ⚠️  未達標檔案: ${status.failing}\n`
      }
      
      report += '\n'
    }

    return report
  }

  /**
   * 計算優先級統計資料
   * @param {Object} coverageData - 覆蓋率資料
   * @param {Array} files - 檔案列表
   * @returns {Object} 統計資料
   */
  calculatePriorityStats(coverageData, files) {
    let totalCoverage = 0
    let fileCount = 0

    if (!coverageData || !coverageData.files) {
      return { average: 0, fileCount: 0 }
    }

    for (const filePath of Object.keys(coverageData.files)) {
      const matchesPattern = files.some(pattern => {
        if (pattern.endsWith('/')) {
          return filePath.includes(pattern)
        }
        return filePath.includes(pattern.replace('src/', ''))
      })

      if (matchesPattern) {
        const fileData = coverageData.files[filePath]
        if (fileData && fileData.lines) {
          totalCoverage += fileData.lines.pct || 0
          fileCount++
        }
      }
    }

    return {
      average: fileCount > 0 ? totalCoverage / fileCount : 0,
      fileCount
    }
  }

  /**
   * 獲取優先級狀態
   * @param {Object} stats - 統計資料
   * @param {number} threshold - 閾值
   * @returns {Object} 狀態資訊
   */
  getPriorityStatus(stats, threshold) {
    const passing = stats.average >= threshold
    return {
      icon: passing ? '✅' : '❌',
      passing,
      failing: passing ? 0 : 1
    }
  }

  /**
   * 生成趨勢分析報告
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} 趨勢分析報告
   */
  generateTrendAnalysis(coverageData) {
    let report = '📈 覆蓋率分析:\n'
    report += '-'.repeat(20) + '\n'

    if (!coverageData || !coverageData.files) {
      report += '   無覆蓋率資料可供分析\n\n'
      return report
    }

    const fileStats = Object.entries(coverageData.files).map(([path, data]) => ({
      path,
      coverage: data.lines ? data.lines.pct : 0
    }))

    // 最高覆蓋率檔案
    const topFiles = fileStats
      .sort((a, b) => b.coverage - a.coverage)
      .slice(0, 3)

    if (topFiles.length > 0) {
      report += '🏆 覆蓋率最高的檔案:\n'
      topFiles.forEach((file, index) => {
        report += `   ${index + 1}. ${file.path} (${this.formatPercentage(file.coverage)}%)\n`
      })
      report += '\n'
    }

    // 最低覆蓋率檔案
    const bottomFiles = fileStats
      .filter(file => file.coverage < 80)
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 3)

    if (bottomFiles.length > 0) {
      report += '⚠️  需要改善的檔案:\n'
      bottomFiles.forEach((file, index) => {
        report += `   ${index + 1}. ${file.path} (${this.formatPercentage(file.coverage)}%)\n`
      })
      report += '\n'
    }

    return report
  }

  /**
   * 生成 HTML 覆蓋率報告
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} HTML 報告
   */
  generateHTMLReport(coverageData) {
    const timestamp = new Date().toLocaleString('zh-TW')
    
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>測試覆蓋率報告</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; font-size: 0.9em; }
        .priority-section { margin-bottom: 30px; }
        .priority-title { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
        .file-list { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .file-item { padding: 8px 0; border-bottom: 1px solid #dee2e6; }
        .coverage-bar { height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; transition: width 0.3s ease; }
        .high { background: #28a745; }
        .medium { background: #ffc107; }
        .low { background: #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 測試覆蓋率報告</h1>
        <p class="timestamp">生成時間: ${timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${this.formatPercentage(coverageData.total?.lines?.pct || 0)}%</div>
            <div class="metric-label">行覆蓋率</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.formatPercentage(coverageData.total?.functions?.pct || 0)}%</div>
            <div class="metric-label">函數覆蓋率</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.formatPercentage(coverageData.total?.branches?.pct || 0)}%</div>
            <div class="metric-label">分支覆蓋率</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.formatPercentage(coverageData.total?.statements?.pct || 0)}%</div>
            <div class="metric-label">語句覆蓋率</div>
        </div>
    </div>
    
    ${this.generateHTMLPrioritySection(coverageData)}
    
    <div class="priority-section">
        <div class="priority-title">📁 檔案覆蓋率詳情</div>
        <div class="file-list">
            ${this.generateHTMLFileList(coverageData)}
        </div>
    </div>
</body>
</html>`
  }

  /**
   * 生成 HTML 優先級區段
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} HTML 優先級區段
   */
  generateHTMLPrioritySection(coverageData) {
    let html = ''
    
    for (const [priority, config] of Object.entries(COVERAGE_PRIORITIES)) {
      const stats = this.calculatePriorityStats(coverageData, config.files)
      const status = this.getPriorityStatus(stats, config.threshold)
      
      html += `
        <div class="priority-section">
            <div class="priority-title">${status.icon} ${this.getPriorityLabel(priority)}</div>
            <div class="file-list">
                <p>目標閾值: ${config.threshold}% | 平均覆蓋率: ${this.formatPercentage(stats.average)}% | 檔案數量: ${stats.fileCount}</p>
                <div class="coverage-bar">
                    <div class="coverage-fill ${this.getCoverageClass(stats.average)}" style="width: ${stats.average}%"></div>
                </div>
            </div>
        </div>`
    }
    
    return html
  }

  /**
   * 生成 HTML 檔案列表
   * @param {Object} coverageData - 覆蓋率資料
   * @returns {string} HTML 檔案列表
   */
  generateHTMLFileList(coverageData) {
    if (!coverageData || !coverageData.files) {
      return '<p>無覆蓋率資料</p>'
    }

    const fileEntries = Object.entries(coverageData.files)
      .sort(([,a], [,b]) => (b.lines?.pct || 0) - (a.lines?.pct || 0))

    return fileEntries.map(([path, data]) => {
      const coverage = data.lines?.pct || 0
      return `
        <div class="file-item">
            <strong>${path}</strong>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <div class="coverage-bar" style="flex: 1; margin-right: 10px;">
                    <div class="coverage-fill ${this.getCoverageClass(coverage)}" style="width: ${coverage}%"></div>
                </div>
                <span>${this.formatPercentage(coverage)}%</span>
            </div>
        </div>`
    }).join('')
  }

  /**
   * 獲取覆蓋率 CSS 類別
   * @param {number} coverage - 覆蓋率百分比
   * @returns {string} CSS 類別名稱
   */
  getCoverageClass(coverage) {
    if (coverage >= 80) return 'high'
    if (coverage >= 60) return 'medium'
    return 'low'
  }

  /**
   * 格式化百分比
   * @param {number} value - 數值
   * @returns {string} 格式化的百分比
   */
  formatPercentage(value) {
    return typeof value === 'number' ? value.toFixed(1) : '0.0'
  }

  /**
   * 獲取優先級標籤
   * @param {string} priority - 優先級代碼
   * @returns {string} 優先級標籤
   */
  getPriorityLabel(priority) {
    const labels = {
      'HIGH_PRIORITY_API': '最高優先級 - API 層',
      'HIGH_PRIORITY_STORES': '高優先級 - Store 狀態管理',
      'HIGH_PRIORITY_COMPOSABLES': '高優先級 - 核心 Composables',
      'MEDIUM_PRIORITY_UTILS': '中優先級 - 工具函數',
      'MEDIUM_PRIORITY_COMPONENTS': '中優先級 - 業務邏輯組件'
    }
    
    return labels[priority] || priority
  }

  /**
   * 處理覆蓋率失敗
   * @param {Object} coverageData - 覆蓋率資料
   * @param {Object} thresholds - 閾值配置
   */
  handleCoverageFailures(coverageData, thresholds) {
    this.failureHandler.clearFailures()

    if (!coverageData || !coverageData.files) {
      console.warn('⚠️  無法獲取覆蓋率資料')
      return
    }

    // 檢查每個檔案的覆蓋率
    for (const [filePath, fileData] of Object.entries(coverageData.files)) {
      const fileThreshold = thresholds[filePath] || thresholds.global
      
      if (fileThreshold && fileData.lines) {
        const actual = {
          lines: fileData.lines.pct || 0,
          functions: fileData.functions?.pct || 0,
          branches: fileData.branches?.pct || 0,
          statements: fileData.statements?.pct || 0
        }

        const expected = {
          lines: fileThreshold.lines || 80,
          functions: fileThreshold.functions || 80,
          branches: fileThreshold.branches || 75,
          statements: fileThreshold.statements || 80
        }

        // 檢查是否有任何指標低於閾值
        if (actual.lines < expected.lines || 
            actual.functions < expected.functions ||
            actual.branches < expected.branches ||
            actual.statements < expected.statements) {
          
          this.failureHandler.recordFailure(filePath, actual, expected)
        }
      }
    }

    // 如果有失敗，輸出報告
    if (this.failureHandler.failures.length > 0) {
      console.error(this.failureHandler.generateFailureReport())
      process.exit(1)
    }
  }
}

export default CoverageReporter