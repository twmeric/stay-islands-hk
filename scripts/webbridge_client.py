#!/usr/bin/env python3
"""Simple Kimi WebBridge client."""
import json
import urllib.request
from typing import Any

BASE = "http://127.0.0.1:10086/command"


def call(action: str, args: dict | None = None, session: str = "stayislands") -> dict[str, Any]:
    payload = {"action": action, "args": args or {}, "session": session}
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


if __name__ == "__main__":
    import sys
    action = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    print(json.dumps(call(action, args), ensure_ascii=False, indent=2))
