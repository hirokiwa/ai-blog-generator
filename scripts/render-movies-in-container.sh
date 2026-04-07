#!/usr/bin/env bash

set -euo pipefail

arguments=("$@")

if [[ ${#arguments[@]} -eq 0 ]]; then
  arguments=(--kinds long,short)
elif [[ "${arguments[0]}" != --* ]]; then
  arguments=(--kinds "${arguments[0]}" "${arguments[@]:1}")
fi

docker compose -f docker-compose.movie.yml build movie-studio
docker compose -f docker-compose.movie.yml up -d voicevox
trap 'docker compose -f docker-compose.movie.yml down --remove-orphans' EXIT
docker compose -f docker-compose.movie.yml run --rm movie-studio npm run movie:render -- "${arguments[@]}"
