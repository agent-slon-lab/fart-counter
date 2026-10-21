#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mirror the live Vercel deployment of fart-counter to a local directory.

Used by .github/workflows/mirror-to-pages.yml to keep
https://agent-slon-lab.github.io/ in sync with
https://fart-counter-lake.vercel.app/ (which is SNI-blocked in RU).

Closure approach: index.html -> all /_next/* URLs -> scan JS/CSS contents
for more chunk/font/locale URLs until nothing new appears.
"""
import os
import re
import posixpath
import urllib.request

BASE = "https://fart-counter-lake.vercel.app"
OUT = os.path.expanduser("~/mirror")

def norm(p):
    p = p.split("?")[0].split("#")[0]
    p = "/" + p.lstrip("/")
    return posixpath.normpath(p)

def fetch(path, binary=True):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = r.read()
            return d if binary else d.decode("utf-8", "replace")
    except Exception as e:
        print("  skip %s (%s)" % (path, e))
        return None

todo = {"/", "/landing", "/privacy", "/sw.js", "/manifest.json", "/version.json", "/apple-touch-icon.png",
        "/favicon-16.png", "/favicon-32.png", "/icon-192.png", "/icon-512.png",
        "/icon.svg", "/screenshots/home.png", "/screenshots/insights.png",
        "/screenshots/food.png",
        "/locales/de.json", "/locales/fr.json", "/locales/es.json",
        "/locales/pt.json", "/locales/hi.json"}
done = set()

html = fetch("/", binary=False)
if html is None:
    raise SystemExit("FATAL: cannot fetch index.html from " + BASE)
for m in re.finditer(r'/_next/static/[A-Za-z0-9._\-/.]+', html):
    todo.add(norm(m.group(0).rstrip('\\')))

round_no = 0
while todo:
    round_no += 1
    batch = sorted(todo)
    todo = set()
    print("round %d: %d files" % (round_no, len(batch)))
    for path in batch:
        p = norm(path)
        if p in done:
            continue
        done.add(p)
        data = fetch(p)
        if data is None:
            continue
        rel = "index.html" if p == "/" else p.lstrip("/")
        dest = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        if p.endswith((".js", ".css")):
            text = data.decode("utf-8", "replace")
            for m in re.finditer(r'/_next/static/[A-Za-z0-9._\-/.]+', text):
                todo.add(norm(m.group(0)))
            if p.endswith(".css"):
                css_dir = "/".join(norm(p).split("/")[:-1])
                for m in re.finditer(r'url\(\s*["\']?([^"\')]+?)["\']?\s*\)', text):
                    u = m.group(1)
                    if u.startswith(("data:", "http")):
                        continue
                    todo.add(norm(u if u.startswith("/") else css_dir + "/" + u))

print("mirrored %d files to %s" % (len(done), OUT))
