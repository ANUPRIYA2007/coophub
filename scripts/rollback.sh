#!/usr/bin/env bash
# ==============================================================================
# COOP HUB — Production & Staging Automated Shell Rollback Script
# ==============================================================================
set -euo pipefail

ROLLBACK_TAG="${1:-latest}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/coophub}"

echo "======================================================================"
echo "COOP HUB — AUTOMATED CONTAINER ROLLBACK SCRIPT"
echo "======================================================================"
echo "Deployment Directory: ${DEPLOY_DIR}"
echo "Rollback Target Tag:  ${ROLLBACK_TAG}"
echo ""

cd "${DEPLOY_DIR}"

echo "[Step 1] Pulling rollback container image..."
docker compose pull || true

echo "[Step 2] Restarting service cluster..."
docker compose up -d --remove-orphans

echo "[Step 3] Verifying cluster health..."
HEALTHY=0
for i in $(seq 1 15); do
  if curl -f -s http://localhost:5000/api/health > /dev/null; then
    echo "✓ Cluster confirmed healthy on attempt $i"
    HEALTHY=1
    break
  fi
  echo "Waiting for cluster health (attempt $i/15)..."
  sleep 2
done

if [ $HEALTHY -ne 1 ]; then
  echo "❌ CRITICAL: Cluster failed post-rollback health check."
  exit 1
fi

echo "✓ Rollback completed successfully."
exit 0
