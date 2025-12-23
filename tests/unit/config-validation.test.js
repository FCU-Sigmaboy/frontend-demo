// 測試配置驗證
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('測試配置驗證', () => {
  it('should have valid Vitest configuration', () => {
    // 讀取 vitest.config.js 檔案
    const configPath = join(process.cwd(), 'vitest.config.js')
    const configContent = readFileSync(configPath, 'utf-8')
    
    // 驗證配置檔案包含必要的設定
    expect(configContent).toContain('environment: \'jsdom\'')
    expect(configContent).toContain('globals: true')
    expect(configContent).toContain('setupFiles')
    expect(configContent).toContain('coverage')
    expect(configContent).toContain('provider: \'v8\'')
  })

  it('should have correct coverage thresholds', () => {
    const configPath = join(process.cwd(), 'vitest.config.js')
    const configContent = readFileSync(configPath, 'utf-8')
    
    // 驗證覆蓋率閾值設定
    expect(configContent).toContain('lines: 80')
    expect(configContent).toContain('functions: 80')
    expect(configContent).toContain('branches: 75')
    expect(configContent).toContain('statements: 80')
  })

  it('should have correct test file patterns', () => {
    const configPath = join(process.cwd(), 'vitest.config.js')
    const configContent = readFileSync(configPath, 'utf-8')
    
    // 驗證測試檔案匹配模式
    expect(configContent).toContain('tests/**/*.{test,spec}.{js,ts,vue}')
    expect(configContent).toContain('src/**/*.{test,spec}.{js,ts,vue}')
  })

  it('should exclude correct directories from coverage', () => {
    const configPath = join(process.cwd(), 'vitest.config.js')
    const configContent = readFileSync(configPath, 'utf-8')
    
    // 驗證排除目錄設定
    expect(configContent).toContain('node_modules/')
    expect(configContent).toContain('tests/')
    expect(configContent).toContain('dist/')
    expect(configContent).toContain('coverage/')
  })
})