# ═══════════════════════════════════════════════════════════════════════════════
# AegisAgent — 1-Click Launch Script (Windows PowerShell)
# Author: Harsh Patel
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Starting AegisAgent: Agentic AppSec Testing Platform" -ForegroundColor Green
Write-Host "  Author: Harsh Patel" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Activate Virtual Environment
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Host "[1/2] Activating Python virtual environment..." -ForegroundColor Gray
    & ".\.venv\Scripts\Activate.ps1"
}

# 2. Launch FastAPI Backend
Write-Host "[2/2] Launching AegisAgent Unified Server at http://127.0.0.1:8000 ..." -ForegroundColor Green
Write-Host "      - Dashboard UI: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "      - Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "      - Lab Target Simulator: http://127.0.0.1:8000/sim/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to terminate." -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan

& ".\.venv\Scripts\python.exe" backend\run_backend.py

