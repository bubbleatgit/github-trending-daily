// GitHub Trending Daily - Main Application
let currentType = 'daily';
let trendingData = {date: '', repos: [], type: 'daily'};
let archiveIndex = null;

const translations = {
  "A": "一个", "An": "一个", "The": "这个", "the": "这个",
  "is": "是", "that": "那个", "this": "这个", "for": "用于", "to": "来",
  "and": "和", "with": "使用", "based": "基于", "using": "使用",
  "simple": "简单的", "easy": "简单易用的", "fast": "快速的", "powerful": "强大的",
  "modern": "现代化的", "new": "新的", "open source": "开源", "Open Source": "开源",
  "framework": "框架", "library": "库", "tool": "工具", "application": "应用", "app": "应用",
  "written": "编写", "in": "用", "built": "构建", "JavaScript": "JavaScript",
  "Python": "Python", "TypeScript": "TypeScript", "Rust": "Rust", "Go": "Go",
  "Java": "Java", "C++": "C++", "C#": "C#", "PHP": "PHP", "Ruby": "Ruby",
  "React": "React", "Vue": "Vue", "Angular": "Angular", "Node": "Node.js",
  "web": "Web", "browser": "浏览器", "server": "服务端", "client": "客户端",
  "mobile": "移动端", "desktop": "桌面端", "cross-platform": "跨平台",
  "data": "数据", "machine learning": "机器学习", "ai": "人工智能",
  "artificial intelligence": "人工智能", "deep learning": "深度学习",
  "learning": "学习", "neural": "神经网络", "network": "网络",
  "api": "API", "database": "数据库", "sql": "SQL", "docker": "Docker",
  "kubernetes": "Kubernetes", "k8s": "K8s", "container": "容器",
  "cloud": "云", "native": "原生", "security": "安全", "authentication": "认证",
  "authorization": "授权", "ui": "界面", "interface": "接口", "components": "组件",
  "development": "开发", "programming": "编程", "code": "代码", "cli": "命令行工具",
  "markdown": "Markdown", "no description available": "暂无描述"
};

function translateToChinese(text) {
  if (!text || text === "No description" || text === "No description available") {
    return "暂无描述";
  }
  let result = text;
  Object.entries(translations).forEach(([en, zh]) => {
    const regex = new RegExp(`\b${en}\b`, 'gi');
    result = result.replace(regex, zh);
  });
  result = result.replace(/\s+/g, ' ').trim();
  return result.length <= 3 ? text : result;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadArchiveIndex();
  initTypeSwitch();
  initDateSelector();
  await loadData();
});

async function loadArchiveIndex() {
  try {
    const res = await fetch('archive/index.json?t=' + Date.now());
    if (res.ok) archiveIndex = await res.json();
  } catch (e) {
    console.error('Failed to load archive index:', e);
    archiveIndex = {daily: [], weekly: []};
  }
}

function initTypeSwitch() {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      updateDateSelector();
      await loadLatestData();
    });
  });
}

function updateDateSelector() {
  const selector = document.getElementById('dateSelector');
  if (!archiveIndex || !archiveIndex[currentType]) {
    selector.innerHTML = '<option value="">暂无历史数据</option>';
    return;
  }
  const list = archiveIndex[currentType];
  selector.innerHTML = list.map(item =>
    `<option value="${item.path}">${item.date}</option>`
  ).join('');
  if (list.length > 0) selector.value = list[0].path;
}

function initDateSelector() {
  document.getElementById('dateSelector').addEventListener('change', async (e) => {
    if (e.target.value) await loadData(e.target.value);
  });
  updateDateSelector();
}

async function loadLatestData() {
  if (archiveIndex && archiveIndex[currentType] && archiveIndex[currentType].length > 0) {
    const first = archiveIndex[currentType][0];
    await loadData(first.path);
  } else {
    await loadData('trending.json');
  }
}

async function loadData(path) {
  path = path || 'trending.json';
  try {
    const r = await fetch(`${path}?t=` + Date.now());
    if (r.ok) {
      trendingData = await r.json();
      renderAll();
    } else {
      throw new Error('Failed to load ' + path);
    }
  } catch (e) {
    console.error(e);
    document.querySelectorAll('.loading').forEach(el => el.innerHTML = '加载失败');
  }
}

function renderAll() {
  updateDate();
  renderStats();
  renderLanguageFilters();
  renderTable(trendingData.repos);
  renderGrowthCards();
  renderInsights();
  renderLanguageChart();
}

function updateDate() {
  document.getElementById('updateDate').textContent = trendingData.date || '-';
}

function renderStats() {
  const repos = trendingData.repos;
  const totalRepos = repos.length;
  const totalStars = repos.reduce((s, r) => s + r.stars, 0);
  const growthField = trendingData.type === 'weekly' ? 'todayStars' : 'todayStars';
  const totalGrowth = repos.reduce((s, r) => s + (r[growthField] || 0), 0);
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
  const title = currentType === 'daily' ? '今日统计' : '本周统计';
  document.querySelector('.stat-card h3').textContent = `📊 ${title}`;
  document.getElementById('statsSummary').innerHTML =
    `<div class="stats-grid"><div class="stat-item-large"><span class="stat-number">${totalRepos}</span><span class="stat-label">热门仓库</span></div><div class="stat-item-large"><span class="stat-number">${formatNumber(totalStars)}</span><span class="stat-label">总 Stars</span></div><div class="stat-item-large"><span class="stat-number">+${formatNumber(totalGrowth)}</span><span class="stat-label">${currentType === 'daily' ? '今日新增' : '本周新增'}</span></div><div class="stat-item-large"><span class="stat-number">${languages.length}</span><span class="stat-label">编程语言</span></div></div>`;
}

function renderLanguageFilters() {
  const repos = trendingData.repos;
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))].sort();
  const container = document.getElementById('languageFilters');
  container.innerHTML = '<button class="filter-btn active" data-lang="all">全部</button>' +
    languages.map(lang => `<button class="filter-btn" data-lang="${lang}">${lang}</button>`).join('');
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      const filtered = lang === 'all' ? repos : repos.filter(r => r.language === lang);
      renderTable(filtered);
    });
  });
}

function renderTable(repos) {
  const tbody = document.getElementById('trendingBody');
  if (!repos || !repos.length) {
    tbody.innerHTML = '<tr><td colspan="6">暂无数据</td></tr>';
    return;
  }
  tbody.innerHTML = repos.map((repo, i) =>
    `<tr><td class="rank">${i+1}</td><td><a href="${repo.url}" target="_blank">${repo.name}</a></td><td><span class="lang-tag" style="background:${getLangColor(repo.language)}">${repo.language||'Unknown'}</span></td><td>${formatNumber(repo.stars)}</td><td>${formatNumber(repo.forks)}</td><td class="growth">+${formatNumber(repo.todayStars||0)}</td><td>${translateToChinese(repo.description).substring(0,60)}${translateToChinese(repo.description).length > 60 ? '...' : ''}</td></tr>`
  ).join('');
}

function renderGrowthCards() {
  const top = [...trendingData.repos].sort((a,b)=>(b.todayStars||0)-(a.todayStars||0)).slice(0,5);
  const title = currentType === 'daily' ? '今日增长 TOP 5' : '本周增长 TOP 5';
  document.querySelector('.top-growth-section h2').textContent = `🏆 ${title}`;
  document.getElementById('growthCards').innerHTML = top.map((r,i)=>
    `<div class="growth-card"><b>#${i+1}</b> <a href="${r.url}" target="_blank">${r.name}</a> +${formatNumber(r.todayStars||0)} ⭐</div>`
  ).join('');
}

function renderInsights() {
  const repos = trendingData.repos;
  if (!repos.length) return;
  const langStats = {};
  repos.forEach(r=>{const l = r.language||'Unknown'; langStats[l]=(langStats[l]||0)+1});
  const topLang = Object.entries(langStats).sort((a,b)=>b[1]-a[1])[0];
  const avgGrowth = Math.round(repos.reduce((s,r)=>s+(r.todayStars||0),0)/repos.length);
  document.getElementById('insightsContent').innerHTML = `<div class="insights"><div><p><strong>最热门语言：</strong>${topLang[0]} (${topLang[1]}个仓库)</p></div><div><p><strong>平均每个仓库新增星标：</strong>${avgGrowth}</p></div></div>`;
}

function renderLanguageChart() {
  const repos = trendingData.repos;
  const langStats = {};
  repos.forEach(r=>{const l = r.language||'Unknown'; langStats[l]=(langStats[l]||0)+1});
  const sorted = Object.entries(langStats).sort((a,b)=>b[1]-a[1]);
  const container = document.getElementById('languageChart');
  container.innerHTML = sorted.map(([lang, count])=>
    `<div class="lang-bar"><span class="lang-name">${lang}</span><span class="lang-bar-bg"><span class="lang-bar-fill" style="width:${(count/repos.length*100)}%"></span></span><span class="lang-count">${count}</span></div>`
  ).join('');
}

function formatNumber(num) {
  return num >= 1000 ? (num/1000).toFixed(1) + 'k' : num;
}

function getLangColor(lang) {
  const colors = {
    JavaScript: '#f1e05a', Python: '#3572A5', TypeScript: '#2b7489',
    Java: '#b07219', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
    Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95', Ruby: '#701516',
    Swift: '#ffac45', Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26',
    CSS: '#563d7c', Shell: '#89e051', Dockerfile: '#384d54', Unknown: '#cccccc'
  };
  return colors[lang] || '#cccccc';
}