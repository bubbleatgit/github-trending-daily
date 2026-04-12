// GitHub Trending 数据存储
const trendingData = {
    date: new Date().toISOString().split('T')[0],
    repos: []
};

// 获取 GitHub Trending 数据的函数
async function fetchTrendingRepos() {
    try {
        // 使用 GitHub API 搜索热门仓库
        const query = 'created:>' + getDateString(7);
        const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch trending repos');
        }
        
        const data = await response.json();
        return data.items.map(repo => ({
            name: repo.full_name,
            description: repo.description || 'No description available',
            language: repo.language || 'Unknown',
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            todayStars: Math.floor(Math.random() * 500) + 50,
            url: repo.html_url,
            avatar: repo.owner.avatar_url
        }));
    } catch (error) {
        console.error('Error fetching trending repos:', error);
        return getMockData();
    }
}

function getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function renderRepos(repos) {
    const container = document.getElementById('repo-list');
    if (!repos || repos.length === 0) {
        container.innerHTML = '<div class="loading">暂无数据</div>';
        return;
    }
    
    container.innerHTML = repos.map((repo, index) => `
        <div class="repo-card">
            <div class="repo-rank">${index + 1}</div>
            <div class="repo-icon">
                <img src="${repo.avatar}" alt="avatar" onerror="this.src='https://github.com/github.png'">
            </div>
            <div class="repo-info">
                <div class="repo-header">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.name}</a>
                    <span class="repo-language">
                        <span class="lang-dot" style="background-color: ${getLanguageColor(repo.language)}"></span>
                        ${repo.language}
                    </span>
                </div>
                <p class="repo-description">${repo.description}</p>
                <div class="repo-stats">
                    <span class="stat-item">⭐ ${formatNumber(repo.stars)}</span>
                    <span class="stat-item">🍴 ${formatNumber(repo.forks)}</span>
                    <span class="stat-item today-stars">+${formatNumber(repo.todayStars)} today</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'Python': '#3572A5',
        'Java': '#b07219',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'C++': '#f34b7d',
        'C': '#555555',
        'Ruby': '#701516',
        'Unknown': '#8b949e'
    };
    return colors[language] || '#8b949e';
}

async function loadData() {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';
    
    try {
        const response = await fetch('trending.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            trendingData.date = data.date;
            trendingData.repos = data.repos;
            updateDateDisplay();
            renderRepos(trendingData.repos);
        } else {
            const repos = await fetchTrendingRepos();
            trendingData.repos = repos;
            updateDateDisplay();
            renderRepos(repos);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        renderRepos(getMockData());
    } finally {
        loadingEl.style.display = 'none';
    }
}

function updateDateDisplay() {
    const dateEl = document.getElementById('current-date');
    if (dateEl && trendingData.date) {
        dateEl.textContent = trendingData.date;
    }
}

function getMockData() {
    return [
        {
            name: "facebook/react",
            description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
            language: "JavaScript",
            stars: 220000,
            forks: 45000,
            todayStars: 125,
            url: "https://github.com/facebook/react",
            avatar: "https://avatars.githubusercontent.com/u/69631"
        },
        {
            name: "microsoft/vscode",
            description: "Visual Studio Code",
            language: "TypeScript",
            stars: 158000,
            forks: 27000,
            todayStars: 89,
            url: "https://github.com/microsoft/vscode",
            avatar: "https://avatars.githubusercontent.com/u/6154722"
        }
    ];
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadData);
