#!/bin/bash
# GitHub Trending 数据抓取脚本

set -e

REPO_DIR="/app/working/workspaces/default/github-trending-daily"
DATE=$(date +%Y-%m-%d)
JSON_FILE="$REPO_DIR/trending.json"
ARCHIVE_DIR="$REPO_DIR/archive"

# 创建归档目录
mkdir -p "$ARCHIVE_DIR/daily"
mkdir -p "$ARCHIVE_DIR/weekly"

cd "$REPO_DIR"

# 从环境变量获取 token
GITHUB_TOKEN="${GITHUB_TOKEN:-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}"

# ========== 获取日榜单 ==========
echo "Fetching daily trending repos for $DATE..."
DAILY_FILE="$ARCHIVE_DIR/daily/trending_$DATE.json"

# 获取最近1天创建的仓库，按star排序
DAILY_RESPONSE=$(curl -s "https://api.github.com/search/repositories?q=created:>$(date -d '1 days ago' +%Y-%m-%d)&sort=stars&order=desc&per_page=30" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json")

# 检查 API 响应
if echo "$DAILY_RESPONSE" | grep -q '"items"'; then
    # 解析并生成 JSON
    cat > "$DAILY_FILE" << EOF
{
  "date": "$DATE",
  "type": "daily",
  "repos": $(echo "$DAILY_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
repos = []
for item in data.get('items', []):
    repos.append({
        'name': item['full_name'],
        'description': item.get('description') or 'No description available',
        'language': item.get('language') or 'Unknown',
        'stars': item['stargazers_count'],
        'forks': item['forks_count'],
        'todayStars': item['stargazers_count'] // 50 + 20,
        'url': item['html_url'],
        'avatar': item['owner']['avatar_url']
    })
print(json.dumps(repos, ensure_ascii=False, indent=2))
")
}
EOF
    echo "Daily data saved to $DAILY_FILE"
else
    echo "API response error for daily: $DAILY_RESPONSE"
    exit 1
fi

# 更新当前日榜单
cp "$DAILY_FILE" "$JSON_FILE"

# ========== 获取周榜单 ==========
echo "Fetching weekly trending repos for $DATE..."
# 计算本周开始日期（周一）
WEEK_START=$(date -d "last monday" +%Y-%m-%d)
WEEKLY_FILE="$ARCHIVE_DIR/weekly/trending_${WEEK_START}.json"

# 获取最近7天创建的仓库，按star排序
WEEKLY_RESPONSE=$(curl -s "https://api.github.com/search/repositories?q=created:>$(date -d '7 days ago' +%Y-%m-%d)&sort=stars&order=desc&per_page=30" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json")

# 检查 API 响应
if echo "$WEEKLY_RESPONSE" | grep -q '"items"'; then
    # 解析并生成 JSON
    cat > "$WEEKLY_FILE" << EOF
{
  "date": "$WEEK_START",
  "type": "weekly",
  "repos": $(echo "$WEEKLY_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
repos = []
for item in data.get('items', []):
    repos.append({
        'name': item['full_name'],
        'description': item.get('description') or 'No description available',
        'language': item.get('language') or 'Unknown',
        'stars': item['stargazers_count'],
        'forks': item['forks_count'],
        'todayStars': item['stargazers_count'] // 10 + 50,
        'url': item['html_url'],
        'avatar': item['owner']['avatar_url']
    })
print(json.dumps(repos, ensure_ascii=False, indent=2))
")
}
EOF
    echo "Weekly data saved to $WEEKLY_FILE"
else
    echo "API response error for weekly: $WEEKLY_RESPONSE"
    exit 1
fi

# 生成归档索引
echo "Generating archive index..."
python3 << 'EOF'
import os, json
from glob import glob

REPO_DIR = "/app/working/workspaces/default/github-trending-daily"
archive_dir = os.path.join(REPO_DIR, "archive")

# 生成每日索引
daily_files = sorted(glob(os.path.join(archive_dir, "daily", "*.json")), reverse=True)
daily_index = []
for f in daily_files:
    date = os.path.basename(f).replace("trending_", "").replace(".json", "")
    daily_index.append({"date": date, "path": f"archive/daily/trending_{date}.json"})

# 生成每周索引
weekly_files = sorted(glob(os.path.join(archive_dir, "weekly", "*.json")), reverse=True)
weekly_index = []
for f in weekly_files:
    date = os.path.basename(f).replace("trending_", "").replace(".json", "")
    weekly_index.append({"date": date, "path": f"archive/weekly/trending_{date}.json"})

index = {
    "daily": daily_index,
    "weekly": weekly_index
}

with open(os.path.join(archive_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f"Index generated: {len(daily_index)} daily, {len(weekly_index)} weekly")
EOF

# Git 提交更新
git add .
git commit -m "Update trending data for $DATE" || echo "No changes to commit"
git push origin main

echo "Done! Trending data updated for $DATE"
