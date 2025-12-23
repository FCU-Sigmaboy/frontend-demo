// 測試命名和組織工具
/**
 * 測試命名規範工具
 * 提供標準化的測試命名和組織方法
 */
export class TestNamingHelper {
  /**
   * 生成標準化的測試描述
   * @param {string} action - 動作描述
   * @param {string} condition - 條件（可選）
   * @returns {string} 標準化的測試描述
   */
  static createTestDescription(action, condition = '') {
    const conditionPart = condition ? `when ${condition}, ` : ''
    return `${conditionPart}should ${action}`
  }

  /**
   * 生成組件測試的描述
   * @param {string} componentName - 組件名稱
   * @param {string} scenario - 測試場景
   * @returns {string} 組件測試描述
   */
  static createComponentTestDescription(componentName, scenario) {
    return `${componentName} - ${scenario}`
  }

  /**
   * 生成 API 測試的描述
   * @param {string} method - HTTP 方法
   * @param {string} endpoint - API 端點
   * @param {string} scenario - 測試場景
   * @returns {string} API 測試描述
   */
  static createApiTestDescription(method, endpoint, scenario) {
    return `${method.toUpperCase()} ${endpoint} - ${scenario}`
  }

  /**
   * 生成工具函數測試的描述
   * @param {string} functionName - 函數名稱
   * @param {string} scenario - 測試場景
   * @returns {string} 工具函數測試描述
   */
  static createUtilTestDescription(functionName, scenario) {
    return `${functionName}() - ${scenario}`
  }

  /**
   * 生成 Store 測試的描述
   * @param {string} storeName - Store 名稱
   * @param {string} action - 動作或狀態
   * @param {string} scenario - 測試場景
   * @returns {string} Store 測試描述
   */
  static createStoreTestDescription(storeName, action, scenario) {
    return `${storeName} store - ${action} - ${scenario}`
  }

  /**
   * 生成 Composable 測試的描述
   * @param {string} composableName - Composable 名稱
   * @param {string} scenario - 測試場景
   * @returns {string} Composable 測試描述
   */
  static createComposableTestDescription(composableName, scenario) {
    return `${composableName} - ${scenario}`
  }

  /**
   * 驗證測試檔案命名是否符合規範
   * @param {string} filename - 檔案名稱
   * @returns {boolean} 是否符合規範
   */
  static validateTestFileName(filename) {
    const validPatterns = [
      /\.test\.(js|ts|vue)$/,
      /\.spec\.(js|ts|vue)$/
    ]
    
    return validPatterns.some(pattern => pattern.test(filename))
  }

  /**
   * 生成測試檔案名稱
   * @param {string} sourceFileName - 源檔案名稱
   * @param {string} suffix - 測試檔案後綴 ('test' 或 'spec')
   * @returns {string} 測試檔案名稱
   */
  static generateTestFileName(sourceFileName, suffix = 'test') {
    const baseName = sourceFileName.replace(/\.(js|ts|vue)$/, '')
    const extension = sourceFileName.match(/\.(js|ts|vue)$/)?.[1] || 'js'
    return `${baseName}.${suffix}.${extension}`
  }

  /**
   * 檢查測試目錄結構是否鏡像源代碼結構
   * @param {string} sourcePath - 源代碼路徑
   * @param {string} testPath - 測試路徑
   * @returns {boolean} 是否鏡像
   */
  static validateDirectoryMirroring(sourcePath, testPath) {
    // 移除 src/ 前綴和檔案名稱，只比較目錄結構
    const sourceDir = sourcePath.replace(/^src\//, '').replace(/\/[^/]+$/, '')
    const testDir = testPath.replace(/^tests\/unit\//, '').replace(/\/[^/]+$/, '')
    
    return sourceDir === testDir
  }
}

/**
 * 測試組織工具
 * 提供測試分組和組織的標準化方法
 */
export class TestOrganizer {
  /**
   * 創建功能測試分組
   * @param {string} featureName - 功能名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeFeature(featureName, testSuite) {
    describe(`Feature: ${featureName}`, testSuite)
  }

  /**
   * 創建組件測試分組
   * @param {string} componentName - 組件名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeComponent(componentName, testSuite) {
    describe(`Component: ${componentName}`, testSuite)
  }

  /**
   * 創建 API 測試分組
   * @param {string} apiName - API 名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeApi(apiName, testSuite) {
    describe(`API: ${apiName}`, testSuite)
  }

  /**
   * 創建工具函數測試分組
   * @param {string} utilName - 工具函數名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeUtil(utilName, testSuite) {
    describe(`Util: ${utilName}`, testSuite)
  }

  /**
   * 創建 Store 測試分組
   * @param {string} storeName - Store 名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeStore(storeName, testSuite) {
    describe(`Store: ${storeName}`, testSuite)
  }

  /**
   * 創建 Composable 測試分組
   * @param {string} composableName - Composable 名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeComposable(composableName, testSuite) {
    describe(`Composable: ${composableName}`, testSuite)
  }

  /**
   * 創建條件測試分組
   * @param {string} condition - 條件描述
   * @param {Function} testSuite - 測試套件函數
   */
  static describeWhen(condition, testSuite) {
    describe(`when ${condition}`, testSuite)
  }

  /**
   * 創建情境測試分組
   * @param {string} scenario - 情境描述
   * @param {Function} testSuite - 測試套件函數
   */
  static describeScenario(scenario, testSuite) {
    describe(`Scenario: ${scenario}`, testSuite)
  }

  /**
   * 創建邊界情況測試分組
   * @param {Function} testSuite - 測試套件函數
   */
  static describeEdgeCases(testSuite) {
    describe('Edge Cases', testSuite)
  }

  /**
   * 創建錯誤處理測試分組
   * @param {Function} testSuite - 測試套件函數
   */
  static describeErrorHandling(testSuite) {
    describe('Error Handling', testSuite)
  }

  /**
   * 創建整合測試分組
   * @param {string} integrationName - 整合測試名稱
   * @param {Function} testSuite - 測試套件函數
   */
  static describeIntegration(integrationName, testSuite) {
    describe(`Integration: ${integrationName}`, testSuite)
  }
}

/**
 * 測試標籤工具
 * 提供測試標籤和分類功能
 */
export class TestTagger {
  /**
   * 標記單元測試
   * @param {string} description - 測試描述
   * @param {Function} testFn - 測試函數
   */
  static unit(description, testFn) {
    it(`[UNIT] ${description}`, testFn)
  }

  /**
   * 標記整合測試
   * @param {string} description - 測試描述
   * @param {Function} testFn - 測試函數
   */
  static integration(description, testFn) {
    it(`[INTEGRATION] ${description}`, testFn)
  }

  /**
   * 標記 E2E 測試
   * @param {string} description - 測試描述
   * @param {Function} testFn - 測試函數
   */
  static e2e(description, testFn) {
    it(`[E2E] ${description}`, testFn)
  }

  /**
   * 標記性能測試
   * @param {string} description - 測試描述
   * @param {Function} testFn - 測試函數
   */
  static performance(description, testFn) {
    it(`[PERFORMANCE] ${description}`, testFn)
  }

  /**
   * 標記屬性測試
   * @param {string} description - 測試描述
   * @param {Function} testFn - 測試函數
   */
  static property(description, testFn) {
    it(`[PROPERTY] ${description}`, testFn)
  }

  /**
   * 標記回歸測試
   * @param {string} description - 測試描述
   * @param {Function} testFn - 測試函數
   */
  static regression(description, testFn) {
    it(`[REGRESSION] ${description}`, testFn)
  }
}

// 預設匯出
export default {
  TestNamingHelper,
  TestOrganizer,
  TestTagger
}