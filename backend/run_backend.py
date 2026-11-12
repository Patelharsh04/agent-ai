import uvicorn
import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("=" * 70)
    print("  AegisAgent — Autonomous Agentic AppSec Testing Platform")
    print("  Author: Harsh Patel")
    print("  API Server: http://127.0.0.1:8000")
    print("  Swagger Docs: http://127.0.0.1:8000/docs")
    print("  Vulnerable Lab Simulator: http://127.0.0.1:8000/sim/api/health")
    print("=" * 70)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)

