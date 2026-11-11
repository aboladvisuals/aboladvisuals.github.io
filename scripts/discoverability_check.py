#!/usr/bin/env python3
"""Monthly discoverability check for https://aboladvisuals.github.io/ (stdlib only, free).

For every URL in the live sitemap it records: HTTP status, canonical match,
meta robots / X-Robots-Tag, and sitemap inclusion. It also fetches a Bing
`site:` results page and records what it saw. Bing may return a reduced or
empty page to automated requests, so treat that column as a hint and confirm
in Bing Webmaster Tools. Rows are appended to docs/discoverability/indexing.csv.

Usage:  python3 scripts/discoverability_check.py [--no-bing]
"""
import csv, datetime, re, sys, urllib.request, urllib.parse
from pathlib import Path

SITE = "https://aboladvisuals.github.io/"
OUT = Path(__file__).resolve().parent.parent / "docs" / "discoverability" / "indexing.csv"
UA = "Mozilla/5.0 (compatible; discoverability-check/1.0; +https://aboladvisuals.github.io/)"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-GB"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, dict(r.headers), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), ""
    except Exception as e:  # network error
        return 0, {}, str(e)

def bing_site_hint():
    q = urllib.parse.quote("site:aboladvisuals.github.io")
    status, _, body = fetch(f"https://www.bing.com/search?q={q}&setlang=en-GB&cc=GB")
    if status != 200:
        return f"bing http {status}"
    if "There are no results" in body:
        return "bing page said: no results"
    m = re.search(r'class="sb_count"[^>]*>([^<]*)', body)
    hits = body.count("aboladvisuals.github.io")
    return f"bing count text '{m.group(1) if m else ''}', page mentions={hits} (unverified)"

def main():
    today = datetime.date.today().isoformat()
    status, headers, sm = fetch(SITE + "sitemap.xml")
    locs = re.findall(r"<loc>([^<]+)</loc>", sm)
    print(f"sitemap: HTTP {status}, {headers.get('Content-Type','?')}, {len(locs)} URLs")
    bing = "" if "--no-bing" in sys.argv else bing_site_hint()
    rows = []
    for url in locs:
        st, h, body = fetch(url)
        canon = re.search(r'rel="canonical" href="([^"]+)"', body)
        robots = re.search(r'name="robots" content="([^"]+)"', body)
        notes = []
        if not canon or canon.group(1) != url:
            notes.append(f"canonical mismatch: {canon.group(1) if canon else 'none'}")
        if robots and "noindex" in robots.group(1):
            notes.append("meta robots noindex")
        if "noindex" in h.get("X-Robots-Tag", "").lower():
            notes.append("X-Robots-Tag noindex")
        rows.append([today, url, st, "Y", bing, "", "; ".join(notes) or "ok"])
        print(st, url, rows[-1][-1])
    new = not OUT.exists()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "url", "http_status", "in_sitemap", "bing_site_result", "google_indexed_from_gsc", "notes"])
        w.writerows(rows)
    print(f"appended {len(rows)} rows to {OUT}")

if __name__ == "__main__":
    main()
