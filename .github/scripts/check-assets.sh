#!/usr/bin/env bash
# Fails if the page references a file the server will not download,
# or if the deploy list names a file that is not in the repository.
# Either mistake ships a site with broken images or videos.
set -euo pipefail
cd "$(dirname "$0")/../.."

refs=$(grep -oE 'assets/[A-Za-z0-9_./-]+\.(png|jpg|jpeg|webp|svg|mp4|webm)' index.html | sort -u)
deployed=$(grep -oE 'assets/[A-Za-z0-9_./-]+\.(png|jpg|jpeg|webp|svg|mp4|webm)' docker-compose.yml | sort -u)

status=0
missing_from_list=$(comm -23 <(echo "$refs") <(echo "$deployed"))
if [ -n "$missing_from_list" ]; then
  echo "::error::index.html uses files that docker-compose.yml does not download:"
  echo "$missing_from_list" | sed 's/^/  /'
  echo "Add them to the 'for f in' list in docker-compose.yml."
  status=1
fi

while read -r f; do
  [ -z "$f" ] && continue
  if [ ! -f "$f" ]; then
    echo "::error::docker-compose.yml lists $f, but the file is not in the repository."
    status=1
  fi
done <<< "$deployed"

if [ "$status" -eq 0 ]; then
  echo "Assets OK: $(echo "$refs" | grep -c .) referenced, $(echo "$deployed" | grep -c .) deployed."
fi
exit "$status"
