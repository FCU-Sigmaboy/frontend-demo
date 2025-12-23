/**
 * 覆蓋率配置驗證測試
 * 
 * 根據需求 2.1, 2.2, 2.3 驗證覆蓋率配置是否正確設定
 */

import { describe, it, expect } from 'vitest'
import { CoverageConfigValidator, COVERAGE_PRIORITIES, COVERAGE_REPORTERS } from '../helpers/coverage-config.js'
import CoverageReporter from '../helpers/coverage-reporter.js'

describe('覆蓋率配置驗證', () => {
  describe('覆蓋率優先級配置', () => {
    it('should have all required priority levels defined', () => {
      const expectedPriorities = [
        'HIGH_PRIORITY_API',
        'HIGH_PRIORITY_STORES', 
        'HIGH_PRIORITY_COMPOSABLES',
        'MEDIUM_PRIORITY_UTILS',
        'MEDIUM_PRIORITY_COMPONENTS'
      ]

      expectedPriorities.forEach(priority => {
        expect(COVERAGE_PRIORITIES).toHaveProperty(priority)
        expect(COVERAGE_PRIORITIES[priority]).toHaveProperty('threshold')
        expect(COVERAGE_PRIORITIES[priority]).toHaveProperty('files')
        expect(Array.isArray(COVERAGE_PRIORITIES[priority].files)).toBe(true)
      })
    })

    it('should have correct threshold values for each priority', () => {
      // API 層測試 (最高優先級) - 90% 覆蓋率
      expect(COVERAGE_PRIORITIES.HIGH_PRIORITY_API.threshold).toBe(90)
      
      // Store 狀態管理測試 (高優先級) - 85% 覆蓋率
      expect(COVERAGE_PRIORITIES.HIGH_PRIORITY_STORES.threshold).toBe(85)
      
      // 核心 Composables 測試 (高優先級) - 85% 覆蓋率
      expect(COVERAGE_PRIORITIES.HIGH_PRIORITY_COMPOSABLES.threshold).toBe(85)
      
      // 工具函數測試 (中優先級) - 100% 覆蓋率
      expect(COVERAGE_PRIORITIES.MEDIUM_PRIORITY_UTILS.threshold).toBe(100)
      
      // 關鍵業務邏輯組件測試 (中優先級) - 80% 覆蓋率
      expect(COVERAGE_PRIORITIES.MEDIUM_PRIORITY_COMPONENTS.threshold).toBe(80)
    })

    it('should include all required API files', () => {
      const apiFiles = COVERAGE_PRIORITIES.HIGH_PRIORITY_API.files
      
      expect(apiFiles).toContain('src/api/pointsAPI.js')
      expect(apiFiles).toContain('src/api/profileAPI.js')
      expect(apiFiles).toContain('src/api/transactionAPI.js')
    })

    it('should include all required store files', () => {
      const storeFiles = COVERAGE_PRIORITIES.HIGH_PRIORITY_STORES.files
      
      expect(storeFiles).toContain('src/stores/auth.js')
      expect(storeFiles).toContain('src/stores/points.js')
      expect(storeFiles).toContain('src/stores/transaction.js')
    })

    it('should include all required utility files', () => {
      const utilFiles = COVERAGE_PRIORITIES.MEDIUM_PRIORITY_UTILS.files
      
      expect(utilFiles).toContain('src/utils/formatPoints.js')
      expect(utilFiles).toContain('src/utils/timeFormat.js')
      expect(utilFiles).toContain('src/utils/filterFunctions.js')
      expect(utilFiles).toContain('src/utils/sortFunctions.js')
    })
  })

  describe('覆蓋率報告格式配置', () => {
    it('should have development reporter configuration', () => {
      expect(COVERAGE_REPORTERS.DEVELOPMENT).toEqual(['text', 'html'])
    })

    it('should have CI/CD reporter configuration', () => {
      expect(COVERAGE_REPORTERS.CI_CD).toEqual(['json', 'lcov', 'cobertura', 'text-summary'])
    })

    it('should have full reporter configuration', () => {
      const fullReporters = COVERAGE_REPORTERS.FULL
      expect(fullReporters).toContain('text')
      expect(fullReporters).toContain('json')
      expect(fullReporters).toContain('html')
      expect(fullReporters).toContain('lcov')
      expect(fullReporters).toContain('text-summary')
      expect(fullReporters).toContain('cobertura')
    })
  })

  describe('覆蓋率配置驗證器', () => {
    it('should validate valid coverage configuration', () => {
      const validConfig = {
        reporter: ['text', 'html', 'json'],
        thresholds: {
          global: {
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80
          }
        }
      }

      const result = CoverageConfigValidator.validate(validConfig)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing reporter configuration', () => {
      const invalidConfig = {
        thresholds: {
          global: {
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80
          }
        }
      }

      const result = CoverageConfigValidator.validate(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('覆蓋率報告格式未正確配置')
    })

    it('should detect missing global thresholds', () => {
      const invalidConfig = {
        reporter: ['text', 'html', 'json']
      }

      const result = CoverageConfigValidator.validate(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('全域覆蓋率閾值未配置')
    })

    it('should warn about missing recommended reporters', () => {
      const configWithMissingReporters = {
        reporter: ['text'],
        thresholds: {
          global: {
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80
          }
        }
      }

      const result = CoverageConfigValidator.validate(configWithMissingReporters)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('建議添加報告格式')
    })
  })

  describe('覆蓋率報告器', () => {
    let reporter

    beforeEach(() => {
      reporter = new CoverageReporter()
    })

    it('should create coverage reporter instance', () => {
      expect(reporter).toBeInstanceOf(CoverageReporter)
      expect(reporter.failureHandler).toBeDefined()
    })

    it('should format percentage correctly', () => {
      expect(reporter.formatPercentage(85.6789)).toBe('85.7')
      expect(reporter.formatPercentage(100)).toBe('100.0')
      expect(reporter.formatPercentage(0)).toBe('0.0')
      expect(reporter.formatPercentage(null)).toBe('0.0')
      expect(reporter.formatPercentage(undefined)).toBe('0.0')
    })

    it('should get correct coverage CSS class', () => {
      expect(reporter.getCoverageClass(90)).toBe('high')
      expect(reporter.getCoverageClass(70)).toBe('medium')
      expect(reporter.getCoverageClass(40)).toBe('low')
      expect(reporter.getCoverageClass(80)).toBe('high')
      expect(reporter.getCoverageClass(60)).toBe('medium')
    })

    it('should generate priority labels correctly', () => {
      expect(reporter.getPriorityLabel('HIGH_PRIORITY_API')).toBe('最高優先級 - API 層')
      expect(reporter.getPriorityLabel('HIGH_PRIORITY_STORES')).toBe('高優先級 - Store 狀態管理')
      expect(reporter.getPriorityLabel('MEDIUM_PRIORITY_UTILS')).toBe('中優先級 - 工具函數')
      expect(reporter.getPriorityLabel('UNKNOWN')).toBe('UNKNOWN')
    })

    it('should calculate priority stats correctly', () => {
      const mockCoverageData = {
        files: {
          'src/api/pointsAPI.js': {
            lines: { pct: 90 }
          },
          'src/api/profileAPI.js': {
            lines: { pct: 85 }
          },
          'src/utils/formatPoints.js': {
            lines: { pct: 100 }
          }
        }
      }

      const apiFiles = ['src/api/pointsAPI.js', 'src/api/profileAPI.js']
      const stats = reporter.calculatePriorityStats(mockCoverageData, apiFiles)

      expect(stats.fileCount).toBe(2)
      expect(stats.average).toBe(87.5) // (90 + 85) / 2
    })

    it('should handle empty coverage data gracefully', () => {
      const stats = reporter.calculatePriorityStats(null, ['src/api/test.js'])
      
      expect(stats.fileCount).toBe(0)
      expect(stats.average).toBe(0)
    })

    it('should generate summary report', () => {
      const mockCoverageData = {
        total: {
          lines: { pct: 85.5 },
          functions: { pct: 90.2 },
          branches: { pct: 78.9 },
          statements: { pct: 87.1 }
        },
        files: {
          'src/api/pointsAPI.js': {
            lines: { pct: 85.5 }
          }
        }
      }

      const report = reporter.generateSummaryReport(mockCoverageData)
      
      expect(report).toContain('測試覆蓋率摘要報告')
      expect(report).toContain('全域覆蓋率統計')
      expect(report).toContain('按優先級分組的覆蓋率')
      expect(report).toContain('覆蓋率分析')
      expect(report).toContain('85.5')
    })
  })
})