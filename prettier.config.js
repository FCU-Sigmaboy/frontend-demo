// prettier.config.js
export default {
  // 基礎格式設定
  semi: false,                    // 不使用分號
  singleQuote: true,              // 使用單引號
  tabWidth: 2,                    // 縮排寬度 2 空格
  useTabs: false,                 // 使用空格而非 Tab
  
  // 程式碼寬度
  printWidth: 100,                // 每行最大字元數
  
  // 尾隨逗號
  trailingComma: 'es5',           // ES5 相容的尾隨逗號
  
  // 括號與空格
  bracketSpacing: true,           // 物件括號內加空格 { foo: bar }
  bracketSameLine: false,         // HTML 標籤 > 換行
  arrowParens: 'always',          // 箭頭函數參數總是加括號 (x) => x
  
  // Vue 檔案設定
  vueIndentScriptAndStyle: true,  // Vue 檔案 script/style 縮排
  singleAttributePerLine: false,  // 多屬性不強制換行
  
  // 其他
  endOfLine: 'lf',                // 使用 LF 換行符
  htmlWhitespaceSensitivity: 'css', // 根據 CSS display 屬性決定 HTML 空白處理方式
  proseWrap: 'preserve',          // Markdown 不自動換行
}
