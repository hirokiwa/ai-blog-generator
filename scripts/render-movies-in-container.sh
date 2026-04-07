#!/usr/bin/env bash

set -euo pipefail

docker compose -f docker-compose.movie.yml build movie-studio
docker compose -f docker-compose.movie.yml up -d voicevox
trap 'docker compose -f docker-compose.movie.yml down --remove-orphans' EXIT
docker compose -f docker-compose.movie.yml run --rm movie-studio npm run movie:render -- --kinds "${1:-long,short}"
