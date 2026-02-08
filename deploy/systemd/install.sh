#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="expo-stores"
SERVICE_SRC="deploy/systemd/expo-stores.service"
ENV_SRC="deploy/systemd/expo-stores.env.example"

# Allow override, default to /opt/expo-stores
APP_DIR="${APP_DIR:-/opt/expo-stores}"
SERVICE_DST="/etc/systemd/system/${SERVICE_NAME}.service"
ENV_DST="/etc/default/${SERVICE_NAME}"

echo "Installing systemd service for ${SERVICE_NAME}"
echo "App directory: ${APP_DIR}"

if [ ! -f "${SERVICE_SRC}" ]; then
  echo "Service template not found: ${SERVICE_SRC}"
  exit 1
fi

sudo mkdir -p /etc/default

# Copy service file
sudo cp "${SERVICE_SRC}" "${SERVICE_DST}"

# Patch WorkingDirectory to target app dir
sudo sed -i "s|^WorkingDirectory=.*|WorkingDirectory=${APP_DIR}|" "${SERVICE_DST}"

# Copy env template if not exists
if [ ! -f "${ENV_DST}" ]; then
  sudo cp "${ENV_SRC}" "${ENV_DST}"
  echo "Copied env template to ${ENV_DST}. Edit this file to set your environment variables."
else
  echo "Env file already exists at ${ENV_DST}. Skipping copy."
fi

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"
sudo systemctl status "${SERVICE_NAME}" --no-pager || true

echo "Done. Service ${SERVICE_NAME} enabled and started."

