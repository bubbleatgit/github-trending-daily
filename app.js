// GitHub Trending Daily - Main Application
let currentType = 'daily';
let trendingData = {date: '', repos: [], type: 'daily'};
let archiveIndex = null;

// 中文翻译字典 - 常见描述翻译
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

// 简单的机器翻译 - 将常见英文描述翻译成中文风格
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translateToChinese(text) {
  if (!text || text === "No description" || text === "No description available") {
    return "暂无描述";
  }
  let result = text;
  Object.entries(translations).forEach(([en, zh]) => {
    const regex = new RegExp(`\\b${escapeRegExp(en)}\\b`, 'gi');
    result = result.replace(regex, zh);
  });
  result = result.replace(/\s+/g, ' ').trim();
  return result.length <= 3 ? text : result;
}

// 格式化周显示:周一日期到周日日期
function formatWeekRange(startDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const formatDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

// 为选项显示文本:日显示日期,周显示范围
function formatOptionLabel(item, type) {
  if (type === 'weekly') {
    return formatWeekRange(item.date);
  }
  return item.date;
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing...');
  await loadArchiveIndex();
  console.log('Archive index loaded:', archiveIndex);
  initTypeSwitch();
  initDateSelector();
  await loadLatestData();
});

// 加载归档索引
async function loadArchiveIndex() {
  try {
    const res = await fetch('archive/index.json?t=' + Date.now());
    if (res.ok) {
      archiveIndex = await res.json();
      console.log('Loaded archive index:', archiveIndex);
    } else {
      console.error('Failed to load index, status:', res.status);
      archiveIndex = {daily: [], weekly: []};
    }
  } catch (e) {
    console.error('Failed to load archive index:', e);
    archiveIndex = {daily: [], weekly: []};
  }
}

// 初始化类型切换
function initTypeSwitch() {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.type-btn').forEach(b => {
        b.classList.remove('active');
        b.dataset.active = 'false';
      });
      btn.classList.add('active');
      btn.dataset.active = 'true';
      currentType = btn.dataset.type;
      updateDateSelector();
      await loadLatestData();
    });
  });
  // 设置初始 active
  document.querySelector(`.type-btn[data-type="${currentType}"]`).dataset.active = 'true';
}

// 更新日期选择器
function updateDateSelector() {
  const selector = document.getElementById('dateSelector');
  if (!archiveIndex || !archiveIndex[currentType]) {
    selector.innerHTML = '<option value="">暂无历史数据</option>';
    return;
  }

  const list = archiveIndex[currentType];
  selector.innerHTML = list.map(item =>
    `<option value="${item.path}">${formatOptionLabel(item, currentType)}</option>`
  ).join('');

  // 选择第一个(最新)
  if (list.length > 0) {
    selector.value = list[0].path;
  }
}

// 初始化日期选择器事件
function initDateSelector() {
  document.getElementById('dateSelector').addEventListener('change', async (e) => {
    if (e.target.value) {
      await loadData(e.target.value);
    }
  });
  updateDateSelector();
}

// 加载最新数据
async function loadLatestData() {
  if (archiveIndex && archiveIndex[currentType] && archiveIndex[currentType].length > 0) {
    const first = archiveIndex[currentType][0];
    console.log('Loading latest data from:', first.path);
    await loadData(first.path);
  } else {
    console.log('Loading default trending.json');
    await loadData('trending.json');
  }
}

// 加载数据
async function loadData(path) {
  path = path || 'trending.json';
  console.log('Loading data from:', path);
  try {
    const r = await fetch(`${path}?t=` + Date.now());
    if (r.ok) {
      trendingData = await r.json();
      console.log('Data loaded:', trendingData);
      if (!trendingData.type) trendingData.type = currentType;
      renderAll();
    } else {
      throw new Error('Failed to load ' + path + ', status: ' + r.status);
    }
  } catch (e) {
    console.error('Load error:', e);
    document.querySelectorAll('.loading').forEach(el => el.innerHTML = '加载失败: ' + e.message);
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
  let displayDate = trendingData.date;
  if (trendingData.type === 'weekly') {
    displayDate = formatWeekRange(trendingData.date);
  }
  document.getElementById('updateDate').textContent = displayDate || '-';
}

function renderStats() {
  const repos = trendingData.repos;
  const totalRepos = repos.length;
  const totalStars = repos.reduce((s, r) => s + r.stars, 0);
  const totalGrowth = repos.reduce((s, r) => s + (r.todayStars || 0), 0);
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
  const title = currentType === 'daily' ? '今日统计' : '本周统计';
  document.querySelector('.stat-card h3').textContent = `📊 ${title}`;
  document.getElementById('statsSummary').innerHTML =
    `<div class="bg-[#222] p-4 rounded-lg text-center card-glow transition-all border border-[#333]"><span class="block text-3xl font-bold text-blue-500">${totalRepos}</span><span class="text-gray-400">热门仓库</span></div>
     <div class="bg-[#222] p-4 rounded-lg text-center card-glow transition-all border border-[#333]"><span class="block text-3xl font-bold text-blue-500">${formatNumber(totalStars)}</span><span class="text-gray-400">总 Stars</span></div>
     <div class="bg-[#222] p-4 rounded-lg text-center card-glow transition-all border border-[#333]"><span class="block text-3xl font-bold text-green-500">+${formatNumber(totalGrowth)}</span><span class="text-gray-400">${currentType === 'daily' ? '今日新增' : '本周新增'}</span></div>
     <div class="bg-[#222] p-4 rounded-lg text-center card-glow transition-all border border-[#333]"><span class="block text-3xl font-bold text-blue-500">${languages.length}</span><span class="text-gray-400">编程语言</span></div>`;
}

function renderLanguageFilters() {
  const repos = trendingData.repos;
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))].sort();
  const container = document.getElementById('languageFilters');
  container.innerHTML = '<button class="filter-btn active px-4 py-2 border-2 rounded-full transition-all hover:border-indigo-600 data-[active=true]:bg-indigo-600 data-[active=true]:text-white data-[active=true]:border-indigo-600 border-gray-200 bg-white" data-lang="all">全部</button>' +
    languages.map(lang =>
      `<button class="filter-btn px-4 py-2 border-2 rounded-full transition-all hover:border-indigo-600 data-[active=true]:bg-indigo-600 data-[active=true]:text-white data-[active=true]:border-indigo-600 border-gray-200 bg-white" data-lang="${lang}">${lang}</button>`
    ).join('');
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.dataset.active = 'false';
      });
      btn.classList.add('active');
      btn.dataset.active = 'true';
      const lang = btn.dataset.lang;
      const filtered = lang === 'all' ? repos : repos.filter(r => r.language === lang);
      renderTable(filtered);
    });
  });
  container.querySelector('.filter-btn').dataset.active = 'true';
}

function renderTable(repos) {
  const tbody = document.getElementById('trendingBody');
  if (!repos || !repos.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-6 text-center text-gray-400">暂无数据</td></tr>';
    return;
  }
  tbody.innerHTML = repos.map((repo, i) =>
`<tr class="hover:bg-[#252525] transition-colors">
  <td class="px-3 py-4 border-b border-[#333] font-semibold text-gray-200">${i+1}</td>
  <td class="px-3 py-4 border-b border-[#333]"><a href="${repo.url}" target="_blank" class="text-blue-500 hover:underline font-medium">${repo.name}</a></td>
  <td class="px-3 py-4 border-b border-[#333]"><span class="inline-block px-3 py-1 rounded-full text-white text-sm" style="background-color:${getLangColor(repo.language)}">${repo.language||'Unknown'}</span></td>
  <td class="px-3 py-4 border-b border-[#333] font-mono text-gray-200">${formatNumber(repo.stars)}</td>
  <td class="px-3 py-4 border-b border-[#333] font-mono text-gray-200">${formatNumber(repo.forks)}</td>
  <td class="px-3 py-4 border-b border-[#333] font-mono text-green-500 font-semibold">+${formatNumber(repo.todayStars||0)}</td>
  <td class="px-3 py-4 border-b border-[#333] text-gray-300">${translateToChinese(repo.description).substring(0,60)}${translateToChinese(repo.description).length > 60 ? '...' : ''}</td>
</tr>`
  ).join('');
}

function renderGrowthCards() {
  const top = [...trendingData.repos].sort((a,b)=>(b.todayStars||0)-(a.todayStars||0)).slice(0,5);
  const title = currentType === 'daily' ? '今日增长 TOP 5' : '本周增长 TOP 5';
  document.querySelector('section.ai-gradient-border h2:first-of-type').textContent = `🏆 ${title}`;
  document.getElementById('growthCards').innerHTML = top.map((r,i)=>
    `<div class="bg-[#222] p-4 rounded-lg card-glow transition-all border border-[#333]"><b class="text-gray-400">#${i+1}</b> <a href="${r.url}" target="_blank" class="text-blue-500 hover:underline font-medium">${r.name}</a> <span class="text-green-500 font-semibold">+${formatNumber(r.todayStars||0)} ⭐</span></div>`
  ).join('');
}

function renderInsights() {
  const repos = trendingData.repos;
  if (!repos.length) return;
  const langStats = {};
  repos.forEach(r=>{const l = r.language||'Unknown'; langStats[l]=(langStats[l]||0)+1});
  const topLang = Object.entries(langStats).sort((a,b)=>b[1]-a[1])[0];
  const avgGrowth = Math.round(repos.reduce((s,r)=>s+(r.todayStars||0),0)/repos.length);
  document.getElementById('insightsContent').innerHTML = `<div class="flex flex-col md:flex-row gap-4"><div class="flex-1 p-4 bg-[#222] rounded-lg card-glow transition-all border border-[#333]"><p><strong>最热门语言：</strong>${topLang[0]} (${topLang[1]}个仓库)</p></div><div class="flex-1 p-4 bg-[#222] rounded-lg card-glow transition-all border border-[#333]"><p><strong>平均每个仓库新增星标：</strong>${avgGrowth}</p></div></div>`;
}

function renderLanguageChart() {
  const repos = trendingData.repos;
  const langStats = {};
  repos.forEach(r=>{const l = r.language||'Unknown'; langStats[l]=(langStats[l]||0)+1});
  const sorted = Object.entries(langStats).sort((a,b)=>b[1]-a[1]);
  const container = document.getElementById('languageChart');
  container.innerHTML = sorted.map(([lang, count]) =>
    `<div class="flex items-center gap-3">
       <span class="w-24 text-sm text-gray-300">${lang}</span>
       <div class="flex-1 bg-[#333] rounded-full h-6 overflow-hidden">
         <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style="width:${(count/repos.length*100)}%"></div>
       </div>
       <span class="w-8 text-right text-sm font-semibold text-gray-200">${count}</span>
     </div>`
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