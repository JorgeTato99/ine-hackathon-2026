#!/usr/bin/env bash
set -Eeuo pipefail

release_dir=$(cd -- "$(dirname -- "$0")" && pwd -P)
deploy_root=$(dirname -- "$(dirname -- "$release_dir")")
release_id=$(basename -- "$release_dir")
[[ "$release_dir" == "$HOME/projects/traza-civica-preview/releases/$release_id" ]]
[[ "$release_id" =~ ^r[0-9]{14}-[a-f0-9]{8}$ ]]
exec 9>"$deploy_root/.deploy.lock"
flock 9
previous=$(readlink -f -- "$deploy_root/current" || true)
activation_started=0

rollback_on_error() {
    status=$?
    trap - ERR
    if [[ "$activation_started" == 1 && -n "$previous" && -f "$previous/compose.preview.yaml" ]]; then
        printf 'Restaurando la versión anterior: %s\n' "$(basename -- "$previous")"
        IMAGE_TAG=$(basename -- "$previous") docker compose \
            --project-directory "$previous" -f "$previous/compose.preview.yaml" up -d --no-build || true
    fi
    exit "$status"
}
trap rollback_on_error ERR

export IMAGE_TAG="$release_id"
docker compose --project-directory "$release_dir" -f "$release_dir/compose.preview.yaml" build --pull
docker run --rm --entrypoint nginx "traza-civica-preview:$release_id" -t
activation_started=1
docker compose --project-directory "$release_dir" -f "$release_dir/compose.preview.yaml" up -d --no-build

healthy=0
for attempt in {1..45}; do
    if curl --fail --silent http://127.0.0.1:3101/healthz >/dev/null; then
        healthy=1
        break
    fi
    sleep 1
done
[[ "$healthy" == 1 ]]
curl --fail --silent http://127.0.0.1:3101/deployment.json | grep -F -- "$release_id"
if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn -- "$previous" "$deploy_root/previous"
fi
ln -sfn -- "$release_dir" "$deploy_root/current.next"
mv -Tf -- "$deploy_root/current.next" "$deploy_root/current"
printf '\nPublicación activa: %s\n' "$release_id"
docker compose --project-directory "$release_dir" -f "$release_dir/compose.preview.yaml" ps
