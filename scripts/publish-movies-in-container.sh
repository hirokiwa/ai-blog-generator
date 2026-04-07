#!/usr/bin/env bash

set -euo pipefail

RENDERED_BUNDLE_FILE_PATH="${1:?rendered bundle file path is required}"

docker compose -f docker-compose.movie.yml build youtube-publisher
docker compose -f docker-compose.movie.yml run --rm youtube-publisher npm run movie:publish -- --renderedBundle "${RENDERED_BUNDLE_FILE_PATH}"
