#!/usr/bin/env python3
"""Extract content from stayislands.mv property pages via WebBridge."""
import json
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:10086/command"
SESSION = "stayislands"

URLS = [
    "https://www.stayislands.mv/properties/stay-mikado/",
    "https://www.stayislands.mv/properties/stay-madivaru/",
    "https://www.stayislands.mv/properties/private-island/",
]

EXTRACT_JS = """
(() => {
  const result = {
    title: document.title,
    h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()).join(' | '),
    h2: Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim()).join(' | '),
    h3: Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim()).join(' | '),
    bodyText: document.body.innerText.split('\\n').map(t => t.trim()).filter(t => t.length > 20).slice(0, 60),
    images: [],
    bgImages: [],
  };
  document.querySelectorAll('img').forEach(img => {
    const src = img.currentSrc || img.src;
    if (src && !src.startsWith('data:')) {
      result.images.push({src, alt: img.alt, width: img.naturalWidth, height: img.naturalHeight});
    }
  });
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage;
    if (bg && bg !== 'none' && bg.includes('url(')) {
      const url = bg.replace(/url\\(['"]?(.*?)['"]?\\)/i, '$1');
      if (url && !url.startsWith('data:')) result.bgImages.push(url);
    }
  });
  return result;
})()
"""


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
    # evaluate returns {"type": ..., "value": ...}; unwrap value.
    if isinstance(data, dict) and "type" in data and "value" in data:
        return data["value"]
    return data


def main():
    out_dir = Path(__file__).parent.parent / "scraped"
    out_dir.mkdir(exist_ok=True)
    results = []

    for idx, url in enumerate(URLS):
        print(f"\n=== {url} ===")
        nav = call("navigate", {"url": url, "newTab": idx == 0, "group_title": "stayislands-scrape"})
        print("navigate:", nav.get("success"), nav.get("url"))

        # Wait and close cookie dialog if present
        import time
        time.sleep(3)
        snap = call("snapshot", {})
        tree_json = json.dumps(snap.get("tree", []))
        if "Customise Consent Preferences" in tree_json:
            # Try clicking close button (usually @e2)
            call("click", {"selector": "@e2"})
            time.sleep(1)

        # Scroll to trigger lazy load
        call("evaluate", {"code": "window.scrollTo(0, document.body.scrollHeight)"})
        time.sleep(2)

        data = call("evaluate", {"code": EXTRACT_JS})
        data["url"] = url
        results.append(data)
        print("h1:", data.get("h1"))
        print("images:", len(data.get("images", [])))
        print("bgImages:", len(data.get("bgImages", [])))

    out_path = out_dir / "stayislands_content.json"
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    main()
