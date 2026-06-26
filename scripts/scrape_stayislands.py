#!/usr/bin/env python3
"""Scrape stayislands.mv property pages via Kimi WebBridge."""
import json
import os
import time
import urllib.request
from pathlib import Path
from typing import Any

BASE = "http://127.0.0.1:10086/command"
SESSION = "stayislands"
OUTPUT_DIR = Path(__file__).parent.parent / "scraped"
SCREENSHOT_DIR = OUTPUT_DIR / "screenshots"

URLS = [
    "https://www.stayislands.mv/properties/stay-mikado/",
    "https://www.stayislands.mv/properties/stay-madivaru/",
    "https://www.stayislands.mv/properties/private-island/",
]


def wb_call(action: str, args: dict | None = None) -> dict[str, Any]:
    payload = {"action": action, "args": args or {}, "session": SESSION}
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())
    # WebBridge wraps responses in {"ok": true, "data": <actual>}
    return result.get("data", result) if isinstance(result, dict) else result


def save_screenshot(name: str) -> str:
    """Use WebBridge screenshot API, save as JPEG."""
    result = wb_call("screenshot", {"format": "jpeg", "quality": 80})
    # Response may be wrapped; extract base64 string.
    data = result
    while isinstance(data, dict):
        if "data" in data and isinstance(data["data"], str):
            data = data["data"]
            break
        data = next(iter(data.values())) if data else ""
    if not isinstance(data, str) or not data:
        print("screenshot response:", result)
        return ""
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREENSHOT_DIR / f"{name}.jpg"
    import base64
    path.write_bytes(base64.b64decode(data))
    return str(path)


def snapshot() -> dict[str, Any]:
    return wb_call("snapshot")


def evaluate(code: str) -> Any:
    return wb_call("evaluate", {"code": code}).get("value")


def scrape_page(url: str, idx: int) -> dict[str, Any]:
    print(f"\n=== Scraping {url} ===")
    nav = wb_call("navigate", {"url": url, "newTab": idx == 0, "group_title": "stayislands-scrape"})
    print("navigate:", nav.get("success"), nav.get("url"))
    time.sleep(3)  # let page load

    # Scroll to bottom to trigger lazy loading
    evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(2)

    snap = snapshot()
    title = snap.get("title", "")
    print("title:", title)

    # Extract structured data
    data = evaluate("""
    (() => {
      const result = {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()).join(' | '),
        h2: Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim()).join(' | '),
        h3: Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim()).join(' | '),
        paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 30).slice(0, 30),
        images: Array.from(document.querySelectorAll('img')).map(img => ({src: img.src, alt: img.alt})).filter(i => i.src && !i.src.includes('data:')).slice(0, 50),
        links: Array.from(document.querySelectorAll('a')).map(a => ({href: a.href, text: a.innerText.trim()})).filter(l => l.href.includes('stayislands.mv')).slice(0, 30),
      };
      return result;
    })()
    """)

    # Screenshot
    slug = url.rstrip('/').split('/')[-1]
    ss_path = save_screenshot(f"{idx+1}_{slug}")
    print("screenshot:", ss_path)

    return {
        "url": url,
        "title": title,
        "snapshot": snap,
        "data": data,
        "screenshot": ss_path,
    }


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for idx, url in enumerate(URLS):
        try:
            results.append(scrape_page(url, idx))
        except Exception as e:
            print(f"ERROR scraping {url}: {e}")
            results.append({"url": url, "error": str(e)})

    out_path = OUTPUT_DIR / "stayislands_raw.json"
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved raw scrape to {out_path}")


if __name__ == "__main__":
    main()
