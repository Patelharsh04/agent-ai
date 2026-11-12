#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# AegisAgent — 1-Click Launch Script (Linux / macOS)
# Author: Harsh Patel
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "================================================================="
echo "  Starting AegisAgent: Agentic AppSec Testing Platform"
echo "  Author: Harsh Patel"
echo "================================================================="

if [ -d ".venv" ]; then
    echo "[1/2] Activating Python virtual environment..."
    source .venv/bin/activate
fi

echo "[2/2] Launching AegisAgent Unified Server at http://127.0.0.1:8000 ..."
echo "      - Dashboard UI: http://127.0.0.1:8000"
echo "      - Swagger Docs: http://127.0.0.1:8000/docs"
echo "      - Lab Target Simulator: http://127.0.0.1:8000/sim/api/health"
echo ""
echo "Press Ctrl+C to terminate."
echo "================================================================="

if command -v python3 &> /dev/null; then
    python3 backend/run_backend.py
else
    python backend/run_backend.py
fi

