#!/usr/bin/env bash
# JusticePourtous — Deploy to VPS
# Usage: bash scripts/deploy.sh

set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_batiscan_vps"
VPS_HOST="83.228.221.188"
VPS_USER="ubuntu"
VPS="$VPS_USER@$VPS_HOST"
VPS_DIR="/home/ubuntu/JusticePourtous"
DOMAIN="justicepourtous.ch"

echo "=== JusticePourtous Deploy ==="

# 1. Tests locaux (subset non-LLM, strict timeout)
# `npm test` complet a des tests LLM qui timeout selon la dispo réseau Anthropic.
# On lance uniquement le subset critique structurel + timeout 30s.
# Bypass avec `SKIP_TESTS=1 bash scripts/deploy.sh` si nécessaire (hotfix).
echo "[1/5] Running core tests (non-LLM subset)..."
if [ "${SKIP_TESTS:-0}" = "1" ]; then
  echo "  SKIP_TESTS=1 → gate test contournée (mode hotfix)"
else
  TEST_FILES=$(ls test/*.test.mjs | grep -v -E '(^test/triage\.|e2e|llm-nav|letter-gen|deep-analysis|premium|stress|adversarial-eval|integration-triage|phase6-frontend-triage|phase-cortex-language-router)')
  TEST_OUTPUT=$(NODE_ENV=test ADMIN_TOKEN=deploy-gate node --test --test-timeout=30000 $TEST_FILES 2>&1)
  TEST_EXIT=$?
  echo "$TEST_OUTPUT" | grep -E '^ℹ (tests|pass|fail|cancelled|duration)' | head -5
  if [ $TEST_EXIT -ne 0 ]; then
    echo "TESTS FAILED — aborting deploy (bypass avec SKIP_TESTS=1)"
    echo "$TEST_OUTPUT" | grep -E '^✖' | head -15
    exit 1
  fi
  echo "  Tests OK"
fi

# 2. Push
echo "[2/5] Pushing to GitHub..."
git push origin master

# 3. Pull on VPS
echo "[3/5] Pulling on VPS..."
ssh -i "$SSH_KEY" "$VPS" "cd $VPS_DIR && git pull"

# 4. Build + restart
echo "[4/5] Building and restarting..."
ssh -i "$SSH_KEY" "$VPS" "cd $VPS_DIR && docker compose build -q && docker compose up -d"

# 5. Health check
echo "[5/5] Health check..."
sleep 5
HEALTH=$(ssh -i "$SSH_KEY" "$VPS" "docker exec justicepourtous wget -qO- http://localhost:3000/api/health 2>/dev/null")
if echo "$HEALTH" | grep -q '"ok"'; then
  echo ""
  echo "=== DEPLOY SUCCESS ==="
  echo "Live: https://$DOMAIN"
  echo "Health: OK"
else
  echo ""
  echo "=== DEPLOY WARNING ==="
  echo "Health check failed. Check logs:"
  echo "  ssh -i $SSH_KEY $VPS 'docker logs justicepourtous --tail 20'"
fi
