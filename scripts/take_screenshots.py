#!/usr/bin/env python3
"""Take JPG screenshots of stayislands.mv property pages."""
import json
import shutil
import time
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:10086/command"
SESSION = "stayislands"
OUTPUT_DIR = Path(__file__).parent.parent / "scraped" / "screenshots"

URLS = [
    ("stay-mikado", "https://www.stayislands.mv/properties/stay-mikado/"),
    ("stay-madivaru", "https://www.stayislands.mv/properties/stay-madivaru/"),
    ("private-island", "https://www.stayislands.mv/properties/private-island/"),
]


def call(action: str, args: dict):
    payload = {"action": action, "args": args, "session": SESSION}
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())
    data = result.get("data", result) if isinstance(result, dict) else result
    if isinstance(data, dict) and "type" in data and "value" in data:
        return data["value"]
    return data


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for idx, (slug, url) in enumerate(URLS):
        print(f"\n=== Screenshot {slug} ===")
        nav = call("navigate", {"url": url, "newTab": idx == 0, "group_title": "stayislands-screenshots"})
        print("navigate:", nav.get("success"), nav.get("url"))
        time.sleep(4)

        snap = call("snapshot", {})
        if "Customise Consent Preferences" in json.dumps(snap.get("tree", [])):
            call("click", {"selector": "@e2"})
            time.sleep(1)

        call("evaluate", {"code": "window.scrollTo(0, 400)"})
        time.sleep(1)

        result = call("screenshot", {"format": "jpeg", "quality": 80})
        src_path = Path(result["path"])
        dst_path = OUTPUT_DIR / f"{slug}.jpg"
        shutil.copy2(src_path, dst_path)
        print(f"Saved {dst_path} ({dst_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
