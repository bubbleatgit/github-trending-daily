# GitHub Trending Daily

🚀 每日自动更新的 GitHub 热门仓库榜单

## 🌐 访问地址

**https://bubbleatgit.github.io/github-trending-daily/**

## ✨ 功能特性

- 📊 **支持日榜单 + 周榜单** - 可切换查看每日和每周热门
- 📅 **历史数据浏览** - 可选择指定日期查看历史榜单
- 🔍 **按编程语言筛选** - 快速过滤你感兴趣的语言
- 🌍 **中文简介** - 仓库简介自动翻译为中文风格
- 🎨 **现代化 UI** - 基于 Tailwind CSS，美观响应式
- 📱 **移动端友好** - 完美适配手机屏幕
- ⚡ **纯静态** - 快速加载，无需后端，GitHub Pages 托管

## 📁 项目结构

```
├── archive/
│   ├── index.json          # 历史数据索引
│   ├── daily/              # 日榜单归档 (YYYY-MM-DD)
│   └── weekly/             # 周榜单归档 (周一日期)
├── app.js                  # 主应用 JavaScript
├── index.html              # 入口 HTML
├── style.css               # 样式 (保留兼容)
├── fetch-trending.sh      # 数据抓取脚本
└── trending.json           # 当前最新数据
```

## 🛠️ 技术栈

- HTML5 + JavaScript + Tailwind CSS (via CDN)
- GitHub Search API 获取热门仓库
- GitHub Pages 托管静态页面
- Shell 脚本自动抓取更新

## 🔄 自动更新

运行 `./fetch-trending.sh` 即可获取最新数据：
- 自动抓取今日热门 -> `archive/daily/`
- 自动抓取本周热门 -> `archive/weekly/`
- 自动更新归档索引
- 自动 commit 并推送到 GitHub

## 📝 Commit 约定

遵循约定式提交格式：
- `feat:` 新增功能
- `fix:` 修复问题
- `docs:` 更新文档
- `update:` 更新每日/周榜单数据

## 🧑‍💻 本地开发

```bash
git clone https://github.com/bubbleatgit/github-trending-daily.git
cd github-trending-daily
# 使用任意静态服务器打开，例如
python -m http.server 8000
# 访问 http://localhost:8000
```

## 📄 License

MIT
