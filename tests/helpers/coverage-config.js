/**
 * 測試覆蓋率配置和錯誤處理工具
 * 
 * 根據需求 2.1, 2.2, 2.3, 2.4, 2.5 實作覆蓋率報告和閾值管理
 */

/**
 * 覆蓋率優先級配置
 * 根據設計文件定義的核心功能測試優先級
 */
export const COVERAGE_PRIORITIES = {
  // API 層測試 (最高優先級) - 90% 覆蓋率
  HIGH_PRIORITY_API: {
    threshold: 90,
    files: [
      'src/api/pointsAPI.js',
      'src/api/profileAPI.js', 
      'src/api/transactionAPI.js'
    ]
  },
  
  // Store 狀態管理測試 (高優先級) - 85% 覆蓋率
  HIGH_PRIORITY_STORES: {
    threshold: 85,
    files: [
      'src/stores/auth.js',
      'src/stores/points.js',
      'src/stores/transaction.js'
    ]
  },
  
  // 核心 Composables 測試 (高優先級) - 85% 覆蓋率
  HIGH_PRIORITY_COMPOSABLES: {
    threshold: 85,
    files: [
      'src/composables/usePointsProfile.js',
      'src/composables/useTransactionRealtime.js'
    ]
  },
  
  // 工具函數測試 (中優先級) - 100% 覆蓋率
  MEDIUM_PRIORITY_UTILS: {
    threshold: 100,
    files: [
      'src/utils/formatPoints.js',
      'src/utils/timeFormat.js',
      'src/utils/filterFunctions.js',
      'src/utils/sortFunctions.js'
    ]
  },
  
  // 關鍵業務邏輯組件測試 (中優先級) - 80% 覆蓋率
  MEDIUM_PRIORITY_COMPONENTS: {
    threshold: 80,
    files: [
      'src/components/dashboard/PointsBalanceCard.vue',
      'src/components/dashboard/',
      'src/components/transaction/'
    ]
  }
}

/**
 * 覆蓋率報告格式配置
 * 支援多種輸出格式以滿足不同環境需求
 */
export const COVERAGE_REPORTERS = {
  // 開發環境報告格式
  DEVELOPMENT: ['text', 'html'],
  
  // CI/CD 環境報告格式 (機器可讀)
  CI_CD: ['json', 'lcov', 'cobertura', 'text-summary'],
  
  // 完整報告格式
  FULL: ['text', 'json', 'html', 'lcov', 'text-summary', 'cobertura']
}

/**
 * 覆蓋率失敗處理器
 * 當覆蓋率低於設定閾值時提供詳細的錯誤訊息和建議
 */
export class CoverageFailureHandler {
  constructor() {
    this.failures = []
  }

  /**
   * 記錄覆蓋率失敗
   * @param {string} file - 失敗的檔案路徑
   * @param {Object} actual - 實際覆蓋率
   * @param {Object} expected - 期望覆蓋率
   */
  recordFailure(file, actual, expected) {
    const failure = {
      file,
      actual,
      expected,
      priority: this.getFilePriority(file),
      suggestions: this.generateSuggestions(file, actual, expected)
    }
    
    this.failures.push(failure)
  }

  /**
   * 獲取檔案優先級
   * @param {string} file - 檔案路徑
   * @returns {string} 優先級標籤
   */
  getFilePriority(file) {
    for (const [priority, config] of Object.entries(COVERAGE_PRIORITIES)) {
      if (config.files.some(pattern => file.includes(pattern.replace('src/', '')))) {
        return priority
      }
    }
    return 'STANDARD'
  }

  /**
   * 生成改善建議
   * @param {string} file - 檔案路徑
   * @param {Object} actual - 實際覆蓋率
   * @param {Object} expected - 期望覆蓋率
   * @returns {Array} 建議列表
   */
  generateSuggestions(file, actual, expected) {
    const suggestions = []
    
    if (actual.lines < expected.lines) {
      suggestions.push(`增加行覆蓋率測試 (目前: ${actual.lines}%, 需要: ${expected.lines}%)`)
    }
    
    if (actual.functions < expected.functions) {
      suggestions.push(`增加函數覆蓋率測試 (目前: ${actual.functions}%, 需要: ${expected.functions}%)`)
    }
    
    if (actual.branches < expected.branches) {
      suggestions.push(`增加分支覆蓋率測試 (目前: ${actual.branches}%, 需要: ${expected.branches}%)`)
    }
    
    if (actual.statements < expected.statements) {
      suggestions.push(`增加語句覆蓋率測試 (目前: ${actual.statements}%, 需要: ${expected.statements}%)`)
    }

    // 根據檔案類型提供特定建議
    if (file.includes('/api/')) {
      suggestions.push('API 檔案建議: 測試所有端點、錯誤處理和邊界情況')
    } else if (file.includes('/stores/')) {
      suggestions.push('Store 檔案建議: 測試所有狀態變更、副作用和錯誤處理')
    } else if (file.includes('/composables/')) {
      suggestions.push('Composables 檔案建議: 測試響應式行為、生命週期和錯誤處理')
    } else if (file.includes('/utils/')) {
      suggestions.push('工具函數建議: 測試所有輸入組合、邊界值和錯誤情況')
    } else if (file.includes('/components/')) {
      suggestions.push('組件檔案建議: 測試 props、事件、狀態變更和用戶互動')
    }
    
    return suggestions
  }

  /**
   * 生成覆蓋率失敗報告
   * @returns {string} 格式化的失敗報告
   */
  generateFailureReport() {
    if (this.failures.length === 0) {
      return '✅ 所有檔案都達到了覆蓋率閾值要求'
    }

    let report = '\n❌ 覆蓋率閾值檢查失敗\n'
    report += '=' .repeat(50) + '\n\n'

    // 按優先級分組失敗
    const failuresByPriority = this.groupFailuresByPriority()
    
    for (const [priority, failures] of Object.entries(failuresByPriority)) {
      if (failures.length === 0) continue
      
      report += `📊 ${this.getPriorityLabel(priority)} (${failures.length} 個檔案)\n`
      report += '-'.repeat(30) + '\n'
      
      failures.forEach(failure => {
        report += `📁 ${failure.file}\n`
        report += `   實際覆蓋率: 行 ${failure.actual.lines}% | 函數 ${failure.actual.functions}% | 分支 ${failure.actual.branches}% | 語句 ${failure.actual.statements}%\n`
        report += `   期望覆蓋率: 行 ${failure.expected.lines}% | 函數 ${failure.expected.functions}% | 分支 ${failure.expected.branches}% | 語句 ${failure.expected.statements}%\n`
        
        if (failure.suggestions.length > 0) {
          report += '   💡 改善建議:\n'
          failure.suggestions.forEach(suggestion => {
            report += `      • ${suggestion}\n`
          })
        }
        report += '\n'
      })
    }

    report += '🔧 一般建議:\n'
    report += '   • 檢查是否有未測試的函數或分支\n'
    report += '   • 增加邊界情況和錯誤處理測試\n'
    report += '   • 確保所有公開 API 都有對應測試\n'
    report += '   • 考慮使用屬性基礎測試來提高覆蓋率\n\n'

    return report
  }

  /**
   * 按優先級分組失敗
   * @returns {Object} 按優先級分組的失敗列表
   */
  groupFailuresByPriority() {
    const grouped = {}
    
    Object.keys(COVERAGE_PRIORITIES).forEach(priority => {
      grouped[priority] = []
    })
    grouped['STANDARD'] = []

    this.failures.forEach(failure => {
      grouped[failure.priority].push(failure)
    })

    return grouped
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
      'MEDIUM_PRIORITY_COMPONENTS': '中優先級 - 業務邏輯組件',
      'STANDARD': '標準優先級'
    }
    
    return labels[priority] || priority
  }

  /**
   * 清除失敗記錄
   */
  clearFailures() {
    this.failures = []
  }
}

/**
 * 覆蓋率配置驗證器
 * 驗證覆蓋率配置是否正確設定
 */
export class CoverageConfigValidator {
  /**
   * 驗證覆蓋率配置
   * @param {Object} config - Vitest 覆蓋率配置
   * @returns {Object} 驗證結果
   */
  static validate(config) {
    const errors = []
    const warnings = []

    // 檢查必要的報告格式
    if (!config.reporter || !Array.isArray(config.reporter)) {
      errors.push('覆蓋率報告格式未正確配置')
    } else {
      const requiredReporters = ['text', 'html', 'json']
      const missingReporters = requiredReporters.filter(r => !config.reporter.includes(r))
      if (missingReporters.length > 0) {
        warnings.push(`建議添加報告格式: ${missingReporters.join(', ')}`)
      }
    }

    // 檢查閾值配置
    if (!config.thresholds || !config.thresholds.global) {
      errors.push('全域覆蓋率閾值未配置')
    }

    // 檢查核心檔案閾值
    const coreFiles = [
      ...COVERAGE_PRIORITIES.HIGH_PRIORITY_API.files,
      ...COVERAGE_PRIORITIES.HIGH_PRIORITY_STORES.files,
      ...COVERAGE_PRIORITIES.MEDIUM_PRIORITY_UTILS.files
    ]

    const missingThresholds = coreFiles.filter(file => 
      !config.thresholds || !config.thresholds[file]
    )

    if (missingThresholds.length > 0) {
      warnings.push(`以下核心檔案缺少特定閾值配置: ${missingThresholds.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * 預設覆蓋率配置
 * 提供標準的覆蓋率配置選項
 */
export const DEFAULT_COVERAGE_CONFIG = {
  provider: 'v8',
  reporter: COVERAGE_REPORTERS.FULL,
  reportsDirectory: './coverage',
  all: true,
  skipFull: false,
  clean: true,
  cleanOnRerun: true,
  perFile: true,
  thresholdAutoUpdate: false,
  reportOnFailure: true
}