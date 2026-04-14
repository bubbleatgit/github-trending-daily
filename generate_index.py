#!/usr/bin/env python3
"""
Generate archive index.json from existing json files
"""
import os
import json
from glob import glob

# Get repo directory
REPO_DIR = os.path.dirname(os.path.abspath(__file__))
archive_dir = os.path.join(REPO_DIR, "archive")

# Generate daily index
daily_files = sorted(glob(os.path.join(archive_dir, "daily", "*.json")), reverse=True)
daily_index = []
for f in daily_files:
    filename = os.path.basename(f)
    date = filename.replace("trending_", "").replace(".json", "")
    daily_index.append({
        "date": date,
        "path": f"archive/daily/trending_{date}.json"
    })

# Generate weekly index
weekly_files = sorted(glob(os.path.join(archive_dir, "weekly", "*.json")), reverse=True)
weekly_index = []
for f in weekly_files:
    filename = os.path.basename(f)
    date = filename.replace("trending_", "").replace(".json", "")
    weekly_index.append({
        "date": date,
        "path": f"archive/weekly/trending_{date}.json"
    })

index = {
    "daily": daily_index,
    "weekly": weekly_index
}

index_path = os.path.join(archive_dir, "index.json")
with open(index_path, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f"Index generated: {len(daily_index)} daily, {len(weekly_index)} weekly")
