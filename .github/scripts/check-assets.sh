#!/usr/bin/env bash
# Fails if a page or post points at a local file the server will not publish.
# The server copies these paths from the repository at the pinned commit:
#   index.html  robots.txt  assets/  explorations/
# so every local file referenced must exist and live under one of them.
set -euo pipefail
cd "$(dirname "$0")/../.."

python3 - <<'PY'
import json, os, re, sys

published = ('index.html', 'robots.txt', 'assets/', 'explorations/')
errors = []
refs = set()

def add(path, source):
    path = os.path.normpath(path).replace(os.sep, '/')
    refs.add(path)
    if not os.path.isfile(path):
        errors.append(f'{source} uses {path}, which is not in the repository.')
    elif not path.startswith(published) and path not in published:
        errors.append(f'{source} uses {path}, which is outside the published folders.')

pattern = re.compile(r'''(?:src|href|url\()\s*=?\s*["']?([^"')\s>]+\.(?:png|jpe?g|webp|svg|mp4|webm|css|js|json|html))''', re.I)

def scan(html_path):
    base = os.path.dirname(html_path)
    text = open(html_path, encoding='utf-8').read()
    for m in pattern.finditer(text):
        u = m.group(1)
        if re.match(r'^(https?:|//|data:|mailto:|#)', u) or '${' in u:
            continue
        add(os.path.join(base, u.split('?')[0].split('#')[0]), html_path)

scan('index.html')
for name in sorted(os.listdir('explorations')):
    if name.endswith('.html'):
        scan(os.path.join('explorations', name))

posts = json.load(open('explorations/posts.json', encoding='utf-8'))
slugs = set()
for i, p in enumerate(posts):
    where = f'posts.json entry {i + 1}'
    for key in ('slug', 'title', 'date', 'cover', 'excerpt', 'category'):
        if not p.get(key):
            errors.append(f'{where} is missing "{key}".')
    slug = p.get('slug', '')
    if not re.fullmatch(r'[a-z0-9-]+', slug):
        errors.append(f'{where} has slug "{slug}"; use lowercase letters, digits and hyphens.')
    if slug in slugs:
        errors.append(f'{where} repeats slug "{slug}".')
    slugs.add(slug)
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(p.get('date', ''))):
        errors.append(f'{where} has date "{p.get("date")}"; use YYYY-MM-DD.')
    add(os.path.join('explorations', 'posts', f'{slug}.md'), where)
    if p.get('cover'):
        add(os.path.join('explorations', p['cover']), where)
    md_path = os.path.join('explorations', 'posts', f'{slug}.md')
    if os.path.isfile(md_path):
        md = open(md_path, encoding='utf-8').read()
        for m in re.finditer(r'!\[[^\]]*\]\(([^)\s]+)', md):
            u = m.group(1)
            if not re.match(r'^(https?:|//|data:)', u):
                add(os.path.join('explorations', 'posts', u), md_path)

if errors:
    for e in errors:
        print(f'::error::{e}')
    sys.exit(1)
print(f'Assets OK: {len(refs)} local files referenced, all published; {len(posts)} explorations.')
PY
