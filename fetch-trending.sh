#!/bin/bash
# GitHub Trending 数据抓取脚本

set -e

# 自动获取脚本所在目录
REPO_DIR=$(cd "$(dirname "$0")" && pwd)
DATE=$(date +%Y-%m-%d)
JSON_FILE="$REPO_DIR/trending.json"
ARCHIVE_DIR="$REPO_DIR/archive"

# 创建归档目录
mkdir -p "$ARCHIVE_DIR/daily"
mkdir -p "$ARCHIVE_DIR/weekly"

cd "$REPO_DIR"

# ========== 获取日榜单 ==========
echo "Fetching daily trending repos for $DATE..."
DAILY_FILE="$ARCHIVE_DIR/daily/trending_$DATE.json"

# 使用 Python 爬取 GitHub Trending 网页
python3 "$REPO_DIR/fetch_trending.py" daily > "$DAILY_FILE"

# 检查文件是否生成成功
if [ ! -s "$DAILY_FILE" ]; then
    echo "Failed to generate daily data"
    exit 1
fi

# 更新当前榜单（日榜单作为默认）
cp "$DAILY_FILE" "$JSON_FILE"
echo "Daily data saved to $DAILY_FILE"

# ========== 获取周榜单（如果是周一） ==========
# 只在周一抓取周榜单，避免重复数据
WEEKDAY=$(date +%w)
if [ "$WEEKDAY" = "1" ]; then
    echo "Today is Monday, fetching weekly trending..."
    # 计算本周开始日期（周一）
    WEEK_START=$(date +%Y-%m-%d)
    WEEKLY_FILE="$ARCHIVE_DIR/weekly/trending_${WEEK_START}.json"
    
    python3 "$REPO_DIR/fetch_trending.py" weekly > "$WEEKLY_FILE"
    
    if [ ! -s "$WEEKLY_FILE" ]; then
        echo "Failed to generate weekly data"
        exit 1
    fi
    
    echo "Weekly data saved to $WEEKLY_FILE"
else
    echo "Today is not Monday, skip weekly fetch"
fi

# 生成归档索引
echo "Generating archive index..."
python3 "$REPO_DIR/generate_index.py"

# Git 提交更新
git add .
git commit -m "update: 更新榜单数据 $DATE" || echo "No changes to commit"
git push origin main

echo "Done! Trending data updated for $DATE"
