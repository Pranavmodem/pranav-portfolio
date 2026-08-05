#!/usr/bin/env python3
"""Regenerates public/index.html + public/ds/* from the Claude Design export.

Usage: python3 design/build-design.py design/source.dc.html

The .dc.html export is self-contained: one line holds a JSON map of assets
(fonts, photo, scripts), another the inner page HTML. This script unpacks the
assets to public/ds/<uuid>.<ext>, rewrites the HTML's bare-UUID references to
those paths, and injects the head tags plus a `window.claude.complete` shim
that routes the design's built-in chat to our /api/chat endpoint.
"""
import base64
import gzip
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DS = PUBLIC / "ds"

EXT = {
    "text/javascript": "js",
    "application/javascript": "js",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "font/woff2": "woff2",
    "font/woff": "woff",
    "font/ttf": "ttf",
}

HEAD_INJECT = """<title>Pranav Modem — Big Data Solutions Engineer</title>
<meta name="description" content="Pranav Modem: Big Data Solutions Engineer at inMarket. Data platforms, AI/ML pipelines, and live AI systems like Alpha Intelligence and ELI5Code.">
<link rel="canonical" href="https://pranavmodem.com">
<meta property="og:title" content="Pranav Modem — Big Data Solutions Engineer">
<meta property="og:description" content="Data platforms at inMarket. Live AI systems on the side: Alpha Intelligence (autonomous trading) and ELI5Code (DSA learning).">
<meta property="og:url" content="https://pranavmodem.com">
<meta property="og:type" content="website">
<meta property="og:image" content="https://pranavmodem.com/ds/{photo}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#161826">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="stylesheet" href="/mobile.css">
<script>if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js");</script>
<script>
// Email links copy the address to the clipboard (with a toast) instead of
// launching a mail client.
document.addEventListener("DOMContentLoaded", function () {
  var toast;
  function showToast(msg) {
    if (!toast) {
      toast = document.createElement("div");
      toast.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(8px);background:var(--color-accent,#9184d9);color:#161826;font:600 14px/1 var(--font-body,sans-serif);padding:12px 20px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.5);z-index:99;opacity:0;transition:opacity .25s ease, transform .25s ease;pointer-events:none";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(8px)";
    }, 2200);
  }
  // Discreet "HQ" link in the nav to the private dashboard. The page runtime
  // re-renders the nav, so re-append whenever it disappears.
  function ensureHQ() {
    if (document.getElementById("hq-link")) return;
    var links = document.querySelectorAll("nav a");
    if (!links.length) return;
    var last = links[links.length - 1];
    var a = document.createElement("a");
    a.id = "hq-link";
    a.href = "/app";
    a.textContent = "HQ";
    a.title = "Pranav HQ — private dashboard";
    a.setAttribute("style", (last.getAttribute("style") || "") + ";opacity:.7");
    last.parentElement.appendChild(a);
  }
  setTimeout(ensureHQ, 800);
  setInterval(ensureHQ, 2500);

  document.body.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    e.preventDefault();
    var email = a.getAttribute("href").replace(/^mailto:/, "").split("?")[0];
    (navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(email)
      : Promise.reject()
    ).then(
      function () { showToast(email + " copied to clipboard ✓"); },
      function () { window.location.href = "mailto:" + email; }
    );
  });
});
</script>
<script>
// Bridge the design's chat (window.claude.complete, an API that exists inside
// Claude artifacts) to this site's own /api/chat endpoint.
(function () {
  function sessionId() {
    try {
      var k = "chat_session_id";
      var v = sessionStorage.getItem(k);
      if (!v) { v = crypto.randomUUID(); sessionStorage.setItem(k, v); }
      return v;
    } catch (e) { return null; }
  }
  window.claude = window.claude || {};
  window.claude.complete = async function (opts) {
    var res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: (opts && opts.messages) || [], sessionId: sessionId() }),
    });
    if (!res.ok) throw new Error("chat request failed: " + res.status);
    var data = await res.json();
    return data.reply;
  };
})();
</script>
"""


def main(src: str) -> None:
    lines = Path(src).read_text(encoding="utf-8").split("\n")
    assets_line = next(l for l in lines if l.startswith('{"') and '"mime"' in l)
    html_line = next(l for l in lines if l.startswith('"<!DOCTYPE html>'))
    assets = json.loads(assets_line)
    html = json.loads(html_line)

    DS.mkdir(parents=True, exist_ok=True)
    names = {}
    react_id = react_dom_id = runtime_id = None
    for aid, a in assets.items():
        data = base64.b64decode(a["data"])
        if a.get("compressed"):
            data = gzip.decompress(data)
        ext = EXT.get(a["mime"], a["mime"].split("/")[-1])
        name = f"{aid}.{ext}"
        names[aid] = name
        (DS / name).write_bytes(data)
        head = data[:300]
        if b"react-dom.production.min" in head:
            react_dom_id = aid
        elif b"react.production.min" in head:
            react_id = aid
        elif b"dc-runtime" in head:
            runtime_id = aid

    # every bare-UUID reference becomes /ds/<uuid>.<ext>
    def repl(m: re.Match) -> str:
        u = m.group(0)
        return f"/ds/{names[u]}" if u in names else u

    html = re.sub(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", repl, html)
    html = html.replace("<html><head>", '<html lang="en"><head>')

    # self-host React ahead of the dc-runtime so it skips its CDN fallback
    assert react_id and react_dom_id and runtime_id, "expected react, react-dom, and dc-runtime assets"
    runtime_tag = f'<script src="/ds/{names[runtime_id]}"></script>'
    react_tags = f'<script src="/ds/{names[react_id]}"></script><script src="/ds/{names[react_dom_id]}"></script>'
    assert runtime_tag in html, "runtime script tag not found in head"
    html = html.replace(runtime_tag, react_tags + runtime_tag, 1)

    photo = next((names[aid] for aid, a in assets.items() if a["mime"] == "image/jpeg"), "")
    html = html.replace("</head>", HEAD_INJECT.replace("{photo}", photo) + "</head>")

    (PUBLIC / "index.html").write_text(html, encoding="utf-8")
    print(f"wrote public/index.html ({len(html)} chars) and {len(names)} assets to public/ds/")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "design" / "source.dc.html"))
