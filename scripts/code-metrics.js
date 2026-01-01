/**
 * Code Metrics Script - 程式碼度量報告生成器
 * 
 * 此腳本用於計算程式碼複雜度指標，類似於 Java 的 MetricsReloaded
 * 主要計算的指標：
 * - WMC (Weighted Methods per Class) - 加權方法複雜度
 * - v(G) (Cyclomatic Complexity) - 環路複雜度
 * - LOC (Lines of Code) - 程式碼行數
 * - 函數數量
 * - 模組數量
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const config = {
  srcDir: path.resolve(__dirname, '../src'),
  reportsDir: path.resolve(__dirname, '../reports'),
  extensions: ['.js', '.vue'],
  excludeDirs: ['node_modules', 'dist', 'coverage', '.git']
}

// 計算環路複雜度 v(G)
function calculateCyclomaticComplexity(code) {
  // 移除字串和註解以避免誤判
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // 多行註解
    .replace(/\/\/.*/g, '')           // 單行註解
    .replace(/'[^']*'/g, "''")        // 單引號字串
    .replace(/"[^"]*"/g, '""')        // 雙引號字串
    .replace(/`[^`]*`/g, '``')        // 模板字串

  // 計算分支數量 (每個分支增加 1 的複雜度)
  const patterns = [
    /\bif\s*\(/g,           // if 語句
    /\belse\s+if\s*\(/g,    // else if
    /\bfor\s*\(/g,          // for 迴圈
    /\bwhile\s*\(/g,        // while 迴圈
    /\bdo\s*\{/g,           // do-while 迴圈
    /\bcase\s+[^:]+:/g,     // switch case
    /\bcatch\s*\(/g,        // catch 區塊
    /\?\s*[^:]+:/g,         // 三元運算子
    /&&/g,                   // 邏輯與
    /\|\|/g,                // 邏輯或
    /\?\?/g                 // 空值合併運算子
  ]

  let complexity = 1 // 基礎複雜度為 1

  for (const pattern of patterns) {
    const matches = cleanCode.match(pattern)
    if (matches) {
      complexity += matches.length
    }
  }

  return complexity
}

// 提取函數定義
function extractFunctions(code, filename) {
  const functions = []
  
  // 移除模板區塊（Vue SFC）
  let scriptCode = code
  if (filename.endsWith('.vue')) {
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      scriptCode = scriptMatch[1]
    } else {
      return functions
    }
  }

  // 函數定義模式
  const patterns = [
    // 普通函數: function name(
    /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
    // 箭頭函數: const name = () => or const name = async () =>
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    // 方法定義: name() { or async name() {
    /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm,
    // 對象方法: name: function( or name: async function(
    /(\w+)\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*\{/g,
    // 對象方法簡寫: name( or async name(
    /(\w+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>/g
  ]

  // 分割成行並追蹤位置
  const lines = scriptCode.split('\n')
  const functionBodies = []

  // 使用更簡單的方法：尋找函數開始並估計函數體
  const functionStartPattern = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{)/gm
  
  let match
  while ((match = functionStartPattern.exec(scriptCode)) !== null) {
    const funcName = match[1] || match[2] || match[3]
    if (funcName && !['if', 'for', 'while', 'switch', 'catch', 'with'].includes(funcName)) {
      // 找到函數開始位置，估計函數體（簡化版本）
      const startIndex = match.index
      let braceCount = 0
      let inFunction = false
      let endIndex = startIndex
      
      for (let i = startIndex; i < scriptCode.length; i++) {
        const char = scriptCode[i]
        if (char === '{') {
          braceCount++
          inFunction = true
        } else if (char === '}') {
          braceCount--
          if (inFunction && braceCount === 0) {
            endIndex = i
            break
          }
        }
      }
      
      const functionBody = scriptCode.substring(startIndex, endIndex + 1)
      const complexity = calculateCyclomaticComplexity(functionBody)
      const loc = functionBody.split('\n').length
      
      functions.push({
        name: funcName,
        complexity,
        loc,
        startLine: scriptCode.substring(0, startIndex).split('\n').length
      })
    }
  }

  return functions
}

// 分析單個文件
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(config.srcDir, filePath)
  const functions = extractFunctions(content, filePath)
  
  const totalComplexity = functions.reduce((sum, f) => sum + f.complexity, 0)
  const loc = content.split('\n').length
  const nonEmptyLoc = content.split('\n').filter(line => line.trim()).length

  return {
    file: relativePath,
    functions: functions.length,
    totalComplexity, // WMC
    averageComplexity: functions.length > 0 ? (totalComplexity / functions.length).toFixed(2) : 0,
    loc,
    nonEmptyLoc,
    functionDetails: functions
  }
}

// 遞迴獲取所有文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (!config.excludeDirs.includes(file)) {
        getAllFiles(filePath, fileList)
      }
    } else if (config.extensions.includes(path.extname(file))) {
      fileList.push(filePath)
    }
  }

  return fileList
}

// 生成報告
function generateReport() {
  console.log('📊 開始分析程式碼複雜度...\n')

  const files = getAllFiles(config.srcDir)
  const results = files.map(analyzeFile)

  // 計算總計
  const summary = {
    totalFiles: results.length,
    totalFunctions: results.reduce((sum, r) => sum + r.functions, 0),
    totalWMC: results.reduce((sum, r) => sum + r.totalComplexity, 0),
    totalLOC: results.reduce((sum, r) => sum + r.loc, 0),
    totalNonEmptyLOC: results.reduce((sum, r) => sum + r.nonEmptyLoc, 0),
    averageComplexityPerFile: 0,
    averageComplexityPerFunction: 0
  }

  summary.averageComplexityPerFile = summary.totalFiles > 0 
    ? (summary.totalWMC / summary.totalFiles).toFixed(2) 
    : 0
  summary.averageComplexityPerFunction = summary.totalFunctions > 0 
    ? (summary.totalWMC / summary.totalFunctions).toFixed(2) 
    : 0

  // 按複雜度排序
  const sortedByComplexity = [...results].sort((a, b) => b.totalComplexity - a.totalComplexity)

  // 控制台輸出
  console.log('═'.repeat(80))
  console.log('                    程式碼度量報告 (Code Metrics Report)')
  console.log('═'.repeat(80))
  console.log('')
  console.log('📈 總覽 (Summary)')
  console.log('─'.repeat(40))
  console.log(`  📁 分析檔案數量:        ${summary.totalFiles}`)
  console.log(`  📦 函數/方法數量:       ${summary.totalFunctions}`)
  console.log(`  🔀 總複雜度 (WMC):      ${summary.totalWMC}`)
  console.log(`  📝 程式碼總行數:        ${summary.totalLOC}`)
  console.log(`  📝 非空白行數:          ${summary.totalNonEmptyLOC}`)
  console.log(`  📊 平均複雜度/檔案:     ${summary.averageComplexityPerFile}`)
  console.log(`  📊 平均複雜度/函數:     ${summary.averageComplexityPerFunction}`)
  console.log('')

  // 驗證系統要求
  console.log('✅ 系統要求驗證')
  console.log('─'.repeat(40))
  const wmcMet = summary.totalWMC > 200
  console.log(`  WMC > 200: ${summary.totalWMC} ${wmcMet ? '✅ 達標' : '❌ 未達標'}`)
  console.log('')

  // 複雜度最高的檔案
  console.log('🔝 複雜度最高的 10 個檔案')
  console.log('─'.repeat(40))
  sortedByComplexity.slice(0, 10).forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.file}`)
    console.log(`     複雜度: ${file.totalComplexity}, 函數數: ${file.functions}, 行數: ${file.loc}`)
  })
  console.log('')

  // 高複雜度函數
  const allFunctions = results.flatMap(r => 
    r.functionDetails.map(f => ({
      ...f,
      file: r.file
    }))
  ).sort((a, b) => b.complexity - a.complexity)

  console.log('⚠️  高複雜度函數 (v(G) > 10)')
  console.log('─'.repeat(40))
  const highComplexityFunctions = allFunctions.filter(f => f.complexity > 10)
  if (highComplexityFunctions.length === 0) {
    console.log('  沒有高複雜度函數 ✅')
  } else {
    highComplexityFunctions.slice(0, 15).forEach((f, index) => {
      console.log(`  ${index + 1}. ${f.name} (v(G)=${f.complexity})`)
      console.log(`     檔案: ${f.file}, 行: ${f.startLine}`)
    })
  }
  console.log('')
  console.log('═'.repeat(80))

  // 保存 JSON 報告
  const reportPath = path.join(config.reportsDir, 'code-metrics.json')
  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    fileMetrics: results,
    highComplexityFunctions,
    systemRequirements: {
      wmcRequired: 200,
      wmcActual: summary.totalWMC,
      wmcMet
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 JSON 報告已保存到: ${reportPath}`)

  // 生成 HTML 報告
  generateHTMLReport(report)

  return report
}

// 生成 HTML 報告
function generateHTMLReport(report) {
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>程式碼度量報告 - Code Metrics Report</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #667eea; }
        .summary-card .label { color: #666; font-size: 0.9em; }
        .status { padding: 10px 20px; border-radius: 5px; margin: 20px 0; text-align: center; font-weight: bold; }
        .status.pass { background: #d4edda; color: #155724; }
        .status.fail { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #667eea; color: white; }
        tr:hover { background: #f8f9fa; }
        .section-title { margin: 30px 0 15px; padding: 10px; background: #2c3e50; color: white; border-radius: 5px; }
        .complexity-high { color: #dc3545; font-weight: bold; }
        .complexity-medium { color: #ffc107; }
        .complexity-low { color: #28a745; }
        footer { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 程式碼度量報告</h1>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">生成時間: ${report.generatedAt}</p>
        
        <div class="summary-grid">
            <div class="summary-card">
                <div class="value">${report.summary.totalFiles}</div>
                <div class="label">📁 分析檔案數</div>
            </div>
            <div class="summary-card">
                <div class="value">${report.summary.totalFunctions}</div>
                <div class="label">📦 函數/方法數</div>
            </div>
            <div class="summary-card">
                <div class="value">${report.summary.totalWMC}</div>
                <div class="label">🔀 總複雜度 (WMC)</div>
            </div>
            <div class="summary-card">
                <div class="value">${report.summary.totalLOC}</div>
                <div class="label">📝 程式碼行數</div>
            </div>
            <div class="summary-card">
                <div class="value">${report.summary.averageComplexityPerFile}</div>
                <div class="label">📊 平均複雜度/檔案</div>
            </div>
            <div class="summary-card">
                <div class="value">${report.summary.averageComplexityPerFunction}</div>
                <div class="label">📊 平均複雜度/函數</div>
            </div>
        </div>

        <div class="status ${report.systemRequirements.wmcMet ? 'pass' : 'fail'}">
            系統要求: WMC > 200 | 實際值: ${report.systemRequirements.wmcActual} | 
            ${report.systemRequirements.wmcMet ? '✅ 達標' : '❌ 未達標'}
        </div>

        <h2 class="section-title">🔝 檔案複雜度排行</h2>
        <table>
            <thead>
                <tr>
                    <th>排名</th>
                    <th>檔案</th>
                    <th>複雜度 (WMC)</th>
                    <th>函數數</th>
                    <th>程式碼行數</th>
                </tr>
            </thead>
            <tbody>
                ${report.fileMetrics
                  .sort((a, b) => b.totalComplexity - a.totalComplexity)
                  .slice(0, 20)
                  .map((f, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${f.file}</td>
                        <td class="${f.totalComplexity > 50 ? 'complexity-high' : f.totalComplexity > 20 ? 'complexity-medium' : 'complexity-low'}">${f.totalComplexity}</td>
                        <td>${f.functions}</td>
                        <td>${f.loc}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2 class="section-title">⚠️ 高複雜度函數 (v(G) > 10)</h2>
        <table>
            <thead>
                <tr>
                    <th>函數名稱</th>
                    <th>複雜度 v(G)</th>
                    <th>所在檔案</th>
                    <th>起始行</th>
                </tr>
            </thead>
            <tbody>
                ${report.highComplexityFunctions.length === 0 
                  ? '<tr><td colspan="4" style="text-align:center;">沒有高複雜度函數 ✅</td></tr>'
                  : report.highComplexityFunctions.slice(0, 20).map(f => `
                    <tr>
                        <td>${f.name}</td>
                        <td class="complexity-high">${f.complexity}</td>
                        <td>${f.file}</td>
                        <td>${f.startLine}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <footer>
            <p>此報告由 code-metrics.js 自動生成</p>
            <p>類似於 Java 的 MetricsReloaded 插件</p>
        </footer>
    </div>
</body>
</html>`

  const htmlPath = path.join(config.reportsDir, 'code-metrics.html')
  fs.writeFileSync(htmlPath, html)
  console.log(`📄 HTML 報告已保存到: ${htmlPath}`)
}

// 執行
generateReport()
