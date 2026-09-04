#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Build the Event Tracker image, copy it to a NAS, and load it into Docker.

Usage:
  scripts/deploy-nas.sh [--dry-run] [NAS_TARGET] [NAS_DIRECTORY]

Arguments:
  NAS_TARGET       SSH target, for example admin@192.168.1.20
  NAS_DIRECTORY    Remote deployment directory
                   (default: /share/Diverse/eventtracker)

Environment variables:
  NAS_TARGET       Alternative to the first argument
  NAS_DIRECTORY    Alternative to the second argument
  IMAGE_NAME       Image repository name (default: eventtracker)
  IMAGE_PLATFORM   Docker target platform (default: linux/amd64)
  ARCHIVE_PATH     Local output archive path
  NAS_DOCKER       Docker executable on the NAS (auto-detected by default)

Examples:
  scripts/deploy-nas.sh admin@192.168.1.20
  NAS_TARGET=admin@nas scripts/deploy-nas.sh
  scripts/deploy-nas.sh --dry-run admin@nas /share/Diverse/eventtracker
EOF
}

dry_run=false
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
elif [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=true
  shift
fi

nas_target="${1:-${NAS_TARGET:-}}"
nas_directory="${2:-${NAS_DIRECTORY:-/share/Diverse/eventtracker}}"
image_name="${IMAGE_NAME:-eventtracker}"
image_platform="${IMAGE_PLATFORM:-linux/amd64}"

if [[ -z "$nas_target" ]]; then
  usage >&2
  exit 2
fi

# These values are interpolated into an SSH command. Keep their accepted syntax
# intentionally narrow rather than trying to quote arbitrary remote shell text.
[[ "$nas_target" =~ ^[A-Za-z0-9._@:-]+$ ]] || { echo "Invalid NAS target: $nas_target" >&2; exit 2; }
[[ "$nas_directory" =~ ^/[A-Za-z0-9._/-]+$ ]] || { echo "Invalid NAS directory: $nas_directory" >&2; exit 2; }
[[ "$image_name" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo "Invalid image name: $image_name" >&2; exit 2; }
[[ "$image_platform" =~ ^[A-Za-z0-9_./-]+$ ]] || { echo "Invalid image platform: $image_platform" >&2; exit 2; }

nas_docker="${NAS_DOCKER:-}"
if [[ -n "$nas_docker" ]]; then
  [[ "$nas_docker" =~ ^/[A-Za-z0-9._/-]+$ ]] || { echo "Invalid NAS Docker path: $nas_docker" >&2; exit 2; }
fi

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(node -p "require('$project_directory/package.json').version")"
platform_slug="${image_platform//\//-}"
archive_path="${ARCHIVE_PATH:-$project_directory/${image_name##*/}-${version}-${platform_slug}.tar}"
archive_name="$(basename "$archive_path")"
remote_archive="$nas_directory/$archive_name"

run() {
  printf '→'
  printf ' %q' "$@"
  printf '\n'
  if [[ "$dry_run" == false ]]; then
    "$@"
  fi
}

if [[ "$dry_run" == false ]]; then
  for command in docker ssh scp node; do
    command -v "$command" >/dev/null || { echo "Required command not found: $command" >&2; exit 1; }
  done
fi

# Reuse one authenticated SSH connection for mkdir, scp, load, and inspect. This
# reduces password authentication to a single prompt when SSH keys are not used.
control_directory=""
if [[ "$dry_run" == false ]]; then
  control_directory="$(mktemp -d "${TMPDIR:-/tmp}/eventtracker-ssh.XXXXXX")"
  ssh_options=(-o ControlMaster=auto -o ControlPersist=60 -o "ControlPath=$control_directory/socket")
  cleanup() {
    ssh "${ssh_options[@]}" -O exit "$nas_target" >/dev/null 2>&1 || true
    rmdir "$control_directory" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT
else
  ssh_options=(-o ControlMaster=auto -o ControlPersist=60 -o ControlPath=/tmp/eventtracker-ssh.socket)
fi

if [[ -n "$nas_docker" ]]; then
  remote_docker="$nas_docker"
else
  # QNAP Container Station commonly keeps Docker outside the PATH used by
  # non-interactive SSH commands. The wildcard accommodates different volumes.
  remote_docker='$(command -v docker 2>/dev/null || { for candidate in /usr/local/bin/docker /share/*/.qpkg/container-station/bin/docker; do if [ -x "$candidate" ]; then echo "$candidate"; break; fi; done; })'
fi

cd "$project_directory"

echo "Deploying Event Tracker $version to $nas_target"
run docker build --progress plain --platform "$image_platform" \
  --tag "$image_name:$version" \
  --tag "$image_name:latest" .
run docker save --output "$archive_path" "$image_name:$version" "$image_name:latest"
run ssh "${ssh_options[@]}" "$nas_target" "mkdir -p $nas_directory"
run scp "${ssh_options[@]}" "$archive_path" "$nas_target:$remote_archive"
run ssh "${ssh_options[@]}" "$nas_target" \
  "docker_command=$remote_docker; test -n \"\$docker_command\" || { echo 'Docker executable not found on NAS. Set NAS_DOCKER to its absolute path.' >&2; exit 127; }; \"\$docker_command\" load --input $remote_archive && \"\$docker_command\" image inspect $image_name:$version --format '{{.Id}}'"

cat <<EOF

Image $image_name:$version is loaded on the NAS and tagged as $image_name:latest.
The local archive remains at:
  $archive_path

Final Portainer step:
  Recreate the Event Tracker container/stack using $image_name:latest.
  Keep host port 3333 mapped to container port 3000 and preserve the /data mount.
EOF
