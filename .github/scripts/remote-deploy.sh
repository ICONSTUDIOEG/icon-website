#!/usr/bin/env bash
# Runs ON THE VPS (piped over SSH by the deploy workflow).
# Expects REV (full commit hash) and DIR (folder holding the live docker-compose.yml).
# Replaces the compose file with the one at REV, pins REV, recreates the container,
# waits for "icon-website <REV> ready", and rolls back to the previous file if it never appears.
set -euo pipefail
: "${REV:?REV is required}"
: "${DIR:?DIR is required}"

REPO_RAW="https://raw.githubusercontent.com/ICONSTUDIOEG/icon-website"
CONTAINER="icon-website-web"

cd "$DIR"
echo "Deploying $REV in $DIR"

cp docker-compose.yml docker-compose.yml.previous
curl -fsSL -o docker-compose.yml.next "$REPO_RAW/$REV/docker-compose.yml"
sed -i -E "s|^([[:space:]]*REV:[[:space:]]*).*|\1\"$REV\"|" docker-compose.yml.next
grep -q "REV: \"$REV\"" docker-compose.yml.next || { echo "Could not pin REV in the compose file"; exit 1; }
mv docker-compose.yml.next docker-compose.yml

docker compose up -d --force-recreate

for _ in $(seq 1 45); do
  if docker logs "$CONTAINER" 2>&1 | grep -q "icon-website $REV ready"; then
    echo "Container reports: icon-website $REV ready"
    exit 0
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    break
  fi
  sleep 2
done

echo "The new version did not start. Last container log lines:"
docker logs "$CONTAINER" --tail 20 2>&1 || true
echo "Rolling back to the previous docker-compose.yml"
mv docker-compose.yml.previous docker-compose.yml
docker compose up -d --force-recreate
exit 1
