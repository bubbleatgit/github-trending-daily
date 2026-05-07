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
    
    # Split by Box-row - more flexible matching
    articles = re.split(r'<article[^>]*Box-row[^>]*>', html, flags=re.IGNORECASE)
    
    for article in articles[1:]:  # skip first split before first article
        # Extract full name - look in h2 first
        h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', article, re.DOTALL)
        if not h2_match:
            continue
        h2_content = h2_match.group(1)
        name_match = re.search(r'<a[^>]*href="([^"]+)"', h2_content)
        if not name_match:
            continue
        href = name_match.group(1)
        # Skip non-repo links
        if not '/' in href or href.startswith('/login') or href.startswith('/sponsors'):
            continue
        full_name = href.lstrip('/')
        if '?' in full_name:
            full_name = full_name.split('?')[0]
        
        # URL
        url = urljoin(BASE_URL, full_name)
        
        # Description - after h2, before the bottom stats
        after_h2 = article.split('</h2>', 1)[1]
        desc_match = re.search(r'<p[^>]*>(.*?)</p>', after_h2, re.DOTALL)
        description = desc_match.group(1).strip() if desc_match else "No description available"
        # Strip HTML tags
        description = re.sub(r'<[^>]+>', '', description).strip()
        
        # Bottom area - after description
        after_desc = after_h2.split('</p>', 1)[1] if '</p>' in after_h2 else after_h2
        
        # Look for language - it's before the stars/forks
        # The language is in a colored span
        language = "Unknown"
        lang_match = re.search(r'<span[^>]*>([A-Za-z\+\#\-\.]+)</span>', after_desc)
        if lang_match:
            candidate = lang_match.group(1).strip()
            if len(candidate) <= 20:  # Programming language names aren't that long
                language = candidate
        
        # Total stars and forks - scan all text for numbers after svg
        # The pattern is: </svg> NUMBER
        numbers = re.findall(r'</svg>\s*([\d,]+)', after_desc)
        stars = 0
        forks = 0
        if len(numbers) >= 1:
            stars = int(numbers[0].replace(',', ''))
        if len(numbers) >= 2:
            forks = int(numbers[1].replace(',', ''))
        
        # Growth (today/weekly) - at the bottom right
        growth = 0
        if since == "daily":
            growth_match = re.search(r'([\d,]+)\s+stars\s+today', after_desc)
        else:
            growth_match = re.search(r'([\d,]+)\s+stars\s+(?:this week|last week)', after_desc)
        if growth_match:
            growth = int(growth_match.group(1).replace(',', ''))
        
        # Owner avatar - look in the built-by section
        avatar = ""
        avatar_match = re.search(r'<img[^>]*src="([^"]+)"[^>]*class="[^"]*avatar[^"]*"', article)
        if avatar_match:
            avatar = avatar_match.group(1)
            # Fix &amp; in URL
            avatar = avatar.replace('&amp;', '&')
        
        # If we got a repo name and it's not empty, add it
        if full_name and description:
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
