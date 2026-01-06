#!/bin/bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印帶顏色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 檢查是否在 Git 倉庫中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "此目錄不是一個 Git 倉庫"
    exit 1
fi

# 獲取當前分支
current_branch=$(git rev-parse --abbrev-ref HEAD)
print_info "當前分支: ${BLUE}$current_branch${NC}"

echo ""
read -p "請輸入要拉取和合併的分支名稱: " target_branch

# 驗證分支名稱不為空
if [ -z "$target_branch" ]; then
    print_error "分支名稱不能為空"
    exit 1
fi

# 驗證分支名稱與當前分支不同
if [ "$target_branch" == "$current_branch" ]; then
    print_warning "目標分支與當前分支相同，請選擇不同的分支"
    exit 1
fi

echo ""
print_info "開始執行以下操作:"
echo "  1. 拉取遠端最新的 ${BLUE}$target_branch${NC} 分支"
echo "  2. 合併 ${BLUE}$target_branch${NC} 分支到 ${BLUE}$current_branch${NC}"
echo "  3. 推送更新後的 ${BLUE}$current_branch${NC} 分支到遠端"
echo ""

read -p "確認執行嗎？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "操作已取消"
    exit 0
fi

# 步驟 1: 拉取遠端最新的目標分支
echo ""
print_info "步驟 1/3: 拉取遠端最新的 ${BLUE}$target_branch${NC} 分支..."
if git fetch origin "$target_branch"; then
    print_success "成功拉取 $target_branch"
else
    print_error "拉取失敗"
    exit 1
fi

# 步驟 2: 合併分支
echo ""
print_info "步驟 2/3: 合併 ${BLUE}$target_branch${NC} 到 ${BLUE}$current_branch${NC}..."
if git merge "origin/$target_branch"; then
    print_success "成功合併 $target_branch"
else
    print_error "合併失敗，請解決衝突後重試"
    exit 1
fi

# 步驟 3: 推送更新
echo ""
print_info "步驟 3/3: 推送 ${BLUE}$current_branch${NC} 到遠端..."
if git push origin "$current_branch"; then
    print_success "成功推送 $current_branch"
else
    print_error "推送失敗"
    exit 1
fi

echo ""
print_success "所有操作完成！"

