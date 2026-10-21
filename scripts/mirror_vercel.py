#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mirror the live Vercel deployment of fart-counter to a local directory.

Used by .github/workflows/mirror-to-pages.yml to publish the GitHub Pages
PROJECT PAGE mirror at https://agent-slon-lab.github.io/fart-counter/.

Why a project page and not the user-site root: the root repo
agent-slon-lab.github.io is shared with ANOTHER app's mirror bot (bikesnap),
which force-pushes its own site there — two apps cannot share one root.

Because a project page is served under /fart-counter/, every mirrored file
gets its root-absolute paths rewritten to the /fart-counter/ subpath
(HTML attributes, JS/CSS asset URLs, sw.js precache/scope/regex, manifest).

Closure approach: index.html -> all /_next/* URLs -> scan JS/CSS contents
for more chunk/font/locale URLs until nothing new appears.
"""
import os
import re
import posixpath
import urllib.request

BASE = "https://fart-counter-lake.vercel.app"
OUT = os.path.expanduser("~/mirror")

# Project pages serve the branch content under /<repo-name>/:
SUBPATH = "/fart-counter"


def strip_sub(p):
    """Strip the mirror subpath prefix from a discovered URL (fetch from BASE)."""
    if p.startswith(SUBPATH + "/") or p == SUBPATH:
        return p[len(SUBPATH):] or "/"
    return p


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


# ---------------------------------------------------------------------------
# Subpath rewriting: turn root-absolute references into /fart-counter/ ones.
# ---------------------------------------------------------------------------

# Root-absolute quoted paths (double or single quotes) that must be prefixed.
_QUOTED = [
    r"_next/", r"locales/", r"screenshots/", r"bristol/",
    r"sw\.js", r"manifest\.json", r"version\.json",
    r"icon\.svg", r"logo\.svg", r"og-image\.(?:png|jpg|svg)",
    r"robots\.txt", r"apple-touch-icon\.png",
    r"icon-192\.png", r"icon-512\.png", r"favicon-16\.png", r"favicon-32\.png",
    r"privacy", r"landing", r"CHANGELOG\.md",
]
_QUOTED_RE = re.compile(
    r'(["\'])/(' + "|".join(_QUOTED) + r')',
)
_URL_CSS_RE = re.compile(r'url\(\s*["\']?/(?!/)')
_URL_CSS_UNQUOTED_RE = re.compile(r"url\(\s*/(?!/)")
_ATTR_RE = re.compile(r'((?:src|href|content|poster|action)="/)(?!/)')
_SCOPE_RE = re.compile(r'(scope\s*:\s*)"/"')
_ROOT_ONLY_RE = re.compile(r'"/"')


def _prefix_quoted(m):
    return m.group(1) + SUBPATH + "/" + m.group(2)


def rewrite_text(text, kind):
    """Rewrite root-absolute references to the /fart-counter/ subpath."""
    # 1) HTML attributes: src="/..." href="/..." content="/..." (not "//...")
    text = _ATTR_RE.sub(r"\g<1>" + SUBPATH.lstrip("/") + "/", text)
    # 2) CSS url(...) references
    text = _URL_CSS_RE.sub("url(" + SUBPATH + "/", text)
    text = _URL_CSS_UNQUOTED_RE.sub("url(" + SUBPATH + "/", text)
    # 3) Quoted root-absolute paths everywhere (JS strings, HTML, JSON)
    text = _QUOTED_RE.sub(_prefix_quoted, text)
    # 4) Service worker registration scope in chunks: scope:"/" -> subpath
    text = _SCOPE_RE.sub(r'\g<1>"' + SUBPATH + '/"', text)
    if kind == "sw":
        # 5) sw.js specifics: PRECACHE "/", caches.match("/"), fetch("/"),
        #    the offline shell fallback and the chunk-discovery regex.
        text = _ROOT_ONLY_RE.sub('"' + SUBPATH + '/"', text)
        text = text.replace(r"\/_next\/static\/", r"\/" + SUBPATH.strip("/") + r"\/_next\/static\/")
    return text


def rewrite_manifest(text):
    data = text
    data = data.replace('"start_url": "/"', '"start_url": "' + SUBPATH + '/"')
    data = data.replace('"scope": "/"', '"scope": "' + SUBPATH + '/"')
    data = data.replace('"url": "/?action=fart"', '"url": "' + SUBPATH + '/?action=fart"')
    data = _QUOTED_RE.sub(_prefix_quoted, data)
    return data


def save(path, data):
    rel = "index.html" if path == "/" else path.lstrip("/")
    dest = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as f:
        f.write(data)


# ---------------------------------------------------------------------------
# Closure crawl
# ---------------------------------------------------------------------------
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
        if p == "/manifest.json":
            data = rewrite_manifest(data.decode("utf-8", "replace")).encode("utf-8")
        elif p == "/" or p.endswith((".html", ".js", ".css", ".txt", ".json")):
            kind = "sw" if p == "/sw.js" else "text"
            text = rewrite_text(data.decode("utf-8", "replace"), kind)
            data = text.encode("utf-8")
        save(p, data)
        if p.endswith((".js", ".css")) or p == "/":
            text = data.decode("utf-8", "replace")
            for m in re.finditer(r'/_next/static/[A-Za-z0-9._\-/.]+', text):
                todo.add(norm(strip_sub(m.group(0).rstrip('\\')) if p == "/" else strip_sub(m.group(0))))
            if p.endswith(".css"):
                css_dir = "/".join(norm(p).split("/")[:-1])
                for m in re.finditer(r'url\(\s*["\']?([^"\')]+?)["\']?\s*\)', text):
                    u = strip_sub(m.group(1))
                    if u.startswith(("data:", "http")):
                        continue
                    todo.add(norm(u if u.startswith("/") else css_dir + "/" + u))

print("mirrored %d files to %s (subpath %s)" % (len(done), OUT, SUBPATH))
