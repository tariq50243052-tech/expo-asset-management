#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/expo-stores}"
REPO_URL="${REPO_URL:-https://github.com/tariq50243052-tech/Expo-Stores.git}"
if [ ! -d "${APP_DIR}/.git" ]; then
  sudo mkdir -p "${APP_DIR}"
  sudo chown "$USER":"$USER" "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"
git fetch --all
git reset --hard origin/main
npm run install:all
npm run build:prod
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart expo-stores || true
fi
echo "Expo Stores updated at $(date)"
