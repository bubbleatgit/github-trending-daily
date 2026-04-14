#!/usr/bin/env python3
"""
Fetch GitHub Trending data from official trending page
"""
import sys
import json
import re
from urllib import request
from urllib.parse import urljoin

BASE_URL = "https://github.com"
TRENDING_URL = {
    "daily": "https://github.com/trending?since=daily",
    "weekly": "https://github.com/trending?since=weekly",
    "monthly": "https://github.com/trending?since=monthly",
}

def fetch_html(url):
    """Fetch HTML from GitHub trending page"""
    req = request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    with request.urlopen(req) as f:
        return f.read().decode("utf-8")

def parse_trending(html, since):
    """Parse trending repositories from HTML"""
    # Pattern to match repo boxes
    # Each repo is in an article with class "Box-row"
    repos = []
    
    # Split by Box-row
    articles = re.split(r'<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>', html)
    
    for article in articles[1:]:  # skip first split before first article
        # Extract full name
        name_match = re.search(r'<h2[^>]*>\s*<a[^>]*href="([^"]+)"', article)
        if not name_match:
            continue
        full_name = name_match.group(1).lstrip('/')
        
        # URL
        url = urljoin(BASE_URL, full_name)
        
        # Description
        desc_match = re.search(r'<p[^>]*>(.*?)</p>', article, re.DOTALL)
        description = desc_match.group(1).strip() if desc_match else "No description available"
        # Strip HTML tags
        description = re.sub(r'<[^>]+>', '', description).strip()
        
        # Language
        lang_match = re.search(r'aria-label="([^"]+)"[^>]*></span>', article)
        language = lang_match.group(1).strip() if lang_match else "Unknown"
        
        # Total stars
        stars_match = re.search(r'([\d,]+)\s+stars', article)
        stars = int(stars_match.group(1).replace(',', '')) if stars_match else 0
        
        # Forks
        forks_match = re.search(r'([\d,]+)\s+forks', article)
        forks = int(forks_match.group(1).replace(',', '')) if forks_match else 0
        
        # Growth (today/weekly)
        growth_match = re.search(r'([\d,]+)\s+stars\s+today', article)
        if not growth_match:
            growth_match = re.search(r'([\d,]+)\s+stars\s+(?:this week|last week)', article)
        growth = int(growth_match.group(1).replace(',', '')) if growth_match else 0
        
        # Owner avatar
        avatar_match = re.search(r'<img[^>]*src="([^"]+)"[^>]*class="avatar', article)
        avatar = avatar_match.group(1) if avatar_match else ""
        
        repos.append({
            "name": full_name,
            "description": description,
            "language": language,
            "stars": stars,
            "forks": forks,
            "todayStars": growth,
            "url": url,
            "avatar": avatar,
        })
    
    # Take top 30
    return repos[:30]

def main():
    if len(sys.argv) < 2:
        print("Usage: fetch_trending.py <daily|weekly>", file=sys.stderr)
        sys.exit(1)
    
    since = sys.argv[1]
    if since not in TRENDING_URL:
        print(f"Invalid since: {since}, must be daily or weekly", file=sys.stderr)
        sys.exit(1)
    
    date = sys.argv[2] if len(sys.argv) > 2 else None
    if not date:
        if since == 'daily':
            from datetime import datetime
            date = datetime.now().strftime('%Y-%m-%d')
        else: # weekly, get current week monday
            from datetime import datetime, timedelta
            today = datetime.now()
            monday = today - timedelta(days=today.weekday())
            date = monday.strftime('%Y-%m-%d')
    
    url = TRENDING_URL[since]
    html = fetch_html(url)
    repos = parse_trending(html, since)
    
    result = {
        "date": date,
        "type": since,
        "repos": repos,
    }
    
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
