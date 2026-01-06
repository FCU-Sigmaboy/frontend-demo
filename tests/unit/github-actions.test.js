/**
 * GitHub Actions 工作流程驗證測試
 * 
 * 驗證 GitHub Actions 配置檔案的正確性
 * 根據需求 7.1, 7.2, 7.3, 7.5 實作
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

describe('GitHub Actions 工作流程驗證', () => {
  describe('測試工作流程配置', () => {
    it('should have valid test workflow file', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      expect(fs.existsSync(workflowPath)).toBe(true)
      
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      expect(workflowContent).toContain('name: 自動化測試')
      expect(workflowContent).toContain('on:')
      expect(workflowContent).toContain('jobs:')
    })

    it('should have correct trigger conditions', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      // 檢查推送觸發條件
      expect(workflowContent).toContain('push:')
      expect(workflowContent).toContain('branches: [ main, master, vibe ]')
      
      // PR 檢查由 pr-check.yml 專責處理，test.yml 不應包含 pull_request 觸發
      // 這是職責分離設計，避免同一 PR 觸發多個工作流程
      
      // 檢查手動觸發
      expect(workflowContent).toContain('workflow_dispatch:')
    })

    it('should have required jobs defined', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      // 檢查必要的作業
      expect(workflowContent).toContain('test:')
      expect(workflowContent).toContain('coverage:')
      expect(workflowContent).toContain('quality:')
      expect(workflowContent).toContain('parallel-tests:')
      expect(workflowContent).toContain('test-summary:')
    })

    it('should have Node.js matrix configuration', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('strategy:')
      expect(workflowContent).toContain('matrix:')
      expect(workflowContent).toContain('node-version: [18.x, 20.x]')
    })

    it('should have caching configuration', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain("cache: 'npm'")
    })

    it('should have artifact upload configuration', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('actions/upload-artifact@v4')
      expect(workflowContent).toContain('coverage/')
    })
  })

  describe('PR 檢查工作流程配置', () => {
    it('should have valid PR check workflow file', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/pr-check.yml')
      expect(fs.existsSync(workflowPath)).toBe(true)
      
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      expect(workflowContent).toContain('name: PR 檢查')
      expect(workflowContent).toContain('pull_request:')
    })

    it('should have required checks job', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/pr-check.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('required-checks:')
      expect(workflowContent).toContain('name: 必要檢查')
    })

    it('should have quality checks job', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/pr-check.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('quality-checks:')
      expect(workflowContent).toContain('continue-on-error: true')
    })

    it('should have PR comment configuration', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/pr-check.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('marocchino/sticky-pull-request-comment@v2')
    })
  })

  describe('工作流程權限配置', () => {
    it('should have correct permissions in test workflow', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('permissions:')
      expect(workflowContent).toContain('contents: read')
      expect(workflowContent).toContain('pull-requests: write')
      expect(workflowContent).toContain('checks: write')
    })

    it('should have correct permissions in PR check workflow', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/pr-check.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('permissions:')
      expect(workflowContent).toContain('contents: read')
      expect(workflowContent).toContain('pull-requests: write')
      expect(workflowContent).toContain('statuses: write')
    })
  })

  describe('並行控制配置', () => {
    it('should have concurrency control in test workflow', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('concurrency:')
      expect(workflowContent).toContain('cancel-in-progress: true')
    })

    it('should have parallel test execution strategy', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('parallel-tests:')
      expect(workflowContent).toContain('test-group:')
      expect(workflowContent).toContain('- api')
      expect(workflowContent).toContain('- components')
      expect(workflowContent).toContain('- stores')
      expect(workflowContent).toContain('- composables')
      expect(workflowContent).toContain('- utils')
    })
  })

  describe('測試命令配置', () => {
    it('should use correct test commands', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('npm run test')
      expect(workflowContent).toContain('npm run test:coverage:ci')
    })

    it('should have coverage report generation', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/test.yml')
      const workflowContent = fs.readFileSync(workflowPath, 'utf8')
      
      expect(workflowContent).toContain('codecov/codecov-action@v4')
      expect(workflowContent).toContain('lcov.info')
    })
  })
})

describe('GitHub Actions 設置文件', () => {
  it('should have setup documentation', () => {
    const docPath = path.join(process.cwd(), 'docs/github-actions-setup.md')
    expect(fs.existsSync(docPath)).toBe(true)
    
    const docContent = fs.readFileSync(docPath, 'utf8')
    expect(docContent).toContain('# GitHub Actions 自動化測試設置指南')
    expect(docContent).toContain('## 分支保護設置')
    expect(docContent).toContain('## 工作流程檔案')
  })

  it('should document branch protection requirements', () => {
    const docPath = path.join(process.cwd(), 'docs/github-actions-setup.md')
    const docContent = fs.readFileSync(docPath, 'utf8')
    
    expect(docContent).toContain('Require status checks to pass before merging')
    expect(docContent).toContain('必要檢查 (required-checks)')
    expect(docContent).toContain('執行測試套件 (test)')
    expect(docContent).toContain('測試覆蓋率分析 (coverage)')
  })

  it('should document caching and performance optimization', () => {
    const docPath = path.join(process.cwd(), 'docs/github-actions-setup.md')
    const docContent = fs.readFileSync(docPath, 'utf8')
    
    expect(docContent).toContain('## 快取策略')
    expect(docContent).toContain('## 並行執行策略')
    expect(docContent).toContain('## 效能優化')
  })
})