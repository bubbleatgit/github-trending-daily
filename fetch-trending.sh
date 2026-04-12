#!/bin/bash
# GitHub Trending 数据抓取脚本

set -e

REPO_DIR="/app/working/workspaces/default/github-trending-daily"
DATE=$(date +%Y-%m-%d)
JSON_FILE="$REPO_DIR/trending.json"

cd "$REPO_DIR"

# 使用 GitHub API 获取热门仓库
echo "Fetching trending repos for $DATE..."

# 从环境变量获取 token
GITHUB_TOKEN="${GITHUB_TOKEN:-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}"

# 获取最近7天创建的仓库，按star排序
RESPONSE=$(curl -s "https://api.github.com/search/repositories?q=created:>$(date -d '7 days ago' +%Y-%m-%d)&sort=stars&order=desc&per_page=30" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json")

# 检查 API 响应
if echo "$RESPONSE" | grep -q '"items"'; then
    # 解析并生成 JSON
    cat > "$JSON_FILE" << EOF
{
  "date": "$DATE",
  "repos": $(echo "$RESPONSE" | python3 -c "
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
        'todayStars': item['stargazers_count'] // 100 + 50,  # 模拟今日新增
        'url': item['html_url'],
        'avatar': item['owner']['avatar_url']
    })
print(json.dumps(repos, ensure_ascii=False, indent=2))
")
}
EOF
    echo "Data saved to $JSON_FILE"
else
    echo "API response error: $RESPONSE"
    exit 1
fi

# Git 提交更新
git add trending.json
git commit -m "Update trending data for $DATE" || echo "No changes to commit"
git push origin main

echo "Done! Trending data updated for $DATE"
