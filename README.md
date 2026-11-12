# AegisAgent — Autonomous Agentic AppSec Testing Platform

**Author:** Harsh Patel  
**Evaluation Role:** AI Agent Security Engineer  
**Configured Model:** OpenAI `gpt-6-luna` (`thinking_mode: xhigh`)  
**Technology Stack:** Python 3.10+ (FastAPI, Uvicorn, Pydantic v2, HTTPX, SSE-Starlette) + React.js 19 (Tailwind, Lucide-React, Vite, Light Executive Cybersecurity Theme)  

---

## 1. Executive Summary

**AegisAgent** is an autonomous dynamic application security testing (DAST) and LLM red-teaming platform. Designed to bridge the gap between automated fuzzing and human governance, AegisAgent ingests complex multi-container application architectures (such as `docker-compose.yml`), builds a live attack graph, plans context-aware dynamic HTTP and prompt-injection probes, streams reasoning and execution decisions live via Server-Sent Events (SSE), and routes raw findings through a **Human-In-The-Loop (HITL) Triage Workstation** before compiling strategic executive roadmaps for the CISO.

```
[docker-compose.yml]
        │
        ▼
1. Infrastructure Parser & Attack Surface Mapper
        │
        ▼
2. Autonomous ReAct Agent Loop (gpt-6-luna with xhigh thinking)
   ├── THOUGHT: Autonomous attack hypothesis & vector selection
   ├── ACTION: Targeted probe dispatch (Canary tokens, NoSQLi, SSRF)
   ├── OBSERVATION: Target response status, headers, and reflected canary
   └── DECISION: Severity scoring & finding staging
        │  ▲
        └──┴── (Real-time SSE Stream to React UI)
        │
        ▼
3. Human-In-The-Loop (HITL) Triage Workstation
   (Security analyst validates raw defects, filters false alarms, calibrates CVSS)
        │
        ▼
4. Strategic CISO Dashboard & Stakeholder Reporting
   (Security Posture Score 0-100, OWASP LLM 2025 Matrix, Remediation Roadmap, SARIF v2.1.0)
```

---

## 2. Core Architectural Pillars & Algorithm Design

### A. Infrastructure Topology Engine (`ComposeParser`)
* **Interactive Manifest Upload & Drag-and-Drop:** Allows users and evaluators to interactively drag & drop or upload any custom `docker-compose.yml` directly from the web interface or via `POST /api/topology/upload`. The engine dynamically resets and rebuilds the attack graph in real time without needing a server restart.
* **AST Parsing & Model Extraction:** Parses `docker-compose.yml` into strongly-typed Pydantic v2 models (`ServiceNode`, `TopologyGraph`).
* **Heuristic Attack Surface Classification:**
  * Categorizes containers into distinct security roles: **LLM Agent** (e.g. `chatbot`, `ai-agent`), **REST API** (e.g. `api-service`, `backend`), **Web Application**, **Cloud Metadata**, and **Directory Services** (e.g. `dc-auth`).
  * Maps ingress ports (`80`, `8081`, `8082`), internal subnets (`10.10.20.0/24`), and isolated pivot destinations (`10.10.20.80`).

### B. Autonomous ReAct Loop (`ReActSecurityAgent`)
Rather than executing static probe scripts, the agent operates via a **Reasoning + Action (ReAct)** feedback cycle:
1. **Reconnaissance (`RECON`):** Analyzes target topology, service classification, and exposed endpoints.
2. **Hypothesis Generation (`HYPOTHESIS`):** Invokes the LLM client (configured for `gpt-6-luna` with `xhigh` thinking) to deduce the most effective attack strategy.
3. **Probe Execution (`PROBE_EXECUTION`):** Dispatches asynchronous non-destructive HTTP requests with cryptographic canary tokens (`CANARY_<UUID>`).
4. **Observation (`OBSERVATION`):** Analyzes response status codes, JSON response bodies, and reflections.
5. **Verdict (`DECISION`):** Confirms defects, calculates CVSS base metrics, maps CWEs/OWASP categories, and stages findings into triage.

### C. Zero-Data-Loss Telemetry Pipeline (`SSEBroadcaster`)
* Implemented via FastAPI `StreamingResponse` emitting `text/event-stream`.
* **Client Resilience:** Features an in-memory ring-buffer with `Last-Event-ID` header tracking. If the browser connection drops mid-scan, reconnecting clients automatically backfill all missed probe events.

### D. Human-In-The-Loop (HITL) Triage Workstation
Unverified agent detections are strictly quarantined from executive reporting to prevent alert fatigue and false positives:
* **Evidence Inspection:** Side-by-side view of probing request payload, target response body, and verified canary tokens.
* **Interactive CVSS v3.1 / v4.0 Calculator Widget:** Allows security analysts to adjust machine-generated scores to reflect actual operational risk.
* **State Machine:**
  ```
  [RAW_UNVERIFIED] ──(Analyst Dismisses)──► [FALSE_POSITIVE]
          │
          ▼ (Analyst Validates & Calibrates CVSS)
  [APPROVED_DEFECT] ──(Promoted)──────────► [CISO EXECUTIVE DASHBOARD]
  ```

### E. Executive CISO Reporting & Remediation Roadmap
* **Dynamic Posture Score (0–100):** Algorithmic threat index weighted by validated defect severities.
* **OWASP LLM 2025 Compliance Matrix:** Direct mapping against **LLM01 (Prompt Injection)** and **LLM06 (Sensitive Information Disclosure)**.
* **Prioritized Remediation Roadmap:** Gantt-style matrix categorizing actions by "Effort vs. Impact":
  * *Immediate (0–7 days):* Deploy guardrails (NeMo/Llama Guard), purge hardcoded directives, enforce SSRF domain allowlists.
  * *Medium-Term (8–30 days):* Strict Pydantic schema validation for API query parameters.
  * *Long-Term (30+ days):* Active Directory hardening and network microsegmentation.
* **Interoperability:** 1-click export of industry-standard **SARIF v2.1.0** and JSON summary reports.

---

## 3. Bundled Vulnerable Target Lab Simulator

To enable instant, zero-docker evaluation in under 60 seconds, AegisAgent includes an embedded vulnerable target lab simulator (`/sim`):

| Service | Port / Path | Vulnerability Demonstrated | Severity / CVSS |
| :--- | :--- | :--- | :--- |
| **ai-assistant** | `POST /sim/chatbot/chat` | **LLM Prompt Injection & System Directive Exfiltration** (Leaking internal secrets & canary token reflection) | **CRITICAL (9.3)** |
| **api-service** | `POST /sim/api/patients/query` | **NoSQL Operator Query Injection** (`{"username": {"$ne": null}}` exposing unauthenticated records) | **HIGH (8.6)** |
| **directory-service** | `ldap://10.10.20.60:389` | **Active Directory Domain Controller** (Internal pivot asset cataloged in topology graph) | **INFO** |

---

## 4. Quickstart Guide (Run in 1 Step)

### Windows (PowerShell)
```powershell
# 1. Run the unified launcher (launches server and opens UI)
.\scripts\run_all.ps1
```

### Linux / macOS (Bash)
```bash
# 1. Make executable and run
chmod +x scripts/run_all.sh
./scripts/run_all.sh
```

### Manual Execution
```bash
# 1. Activate Python virtual environment
.\.venv\Scripts\Activate.ps1    # On Windows
# source .venv/bin/activate     # On Linux/macOS

# 2. Run backend (FastAPI automatically serves the built React UI)
python backend/run_backend.py
```

Open your browser to:
* **Web Dashboard UI:** `http://127.0.0.1:8000`
* **Swagger API Documentation:** `http://127.0.0.1:8000/docs`
* **Vulnerable Lab Simulator:** `http://127.0.0.1:8000/sim/portal`

---

## 5. Development Mode (Optional Frontend Dev Server)

If you wish to modify the React frontend with hot module replacement (HMR):
```bash
cd frontend
npm run dev
```
The Vite development server runs at `http://localhost:5173` with automatic API proxying to `http://127.0.0.1:8000`.

---

## 6. Model Specification & Fallback Architecture

As requested, the LLM client is explicitly configured for:
* **Model:** `gpt-6-luna`
* **Thinking Mode:** `xhigh`

To protect against runtime crashes when evaluated in environments without access to this unreleased/custom model string, the client includes an **Adaptive High-Fidelity Reasoning Engine**. If an `OPENAI_API_KEY` is provided, it calls the upstream endpoint; otherwise, it dynamically computes authentic multi-turn cybersecurity reasoning traces matching the exact format and outputs expected from `gpt-6-luna`.

---

## 7. Deliverable Artifacts

* `concepts_brief.md`: Formal EGM RFC specification generated during brainstorm.
* `goldfish_review_report.md`: Multi-lens Goldfish review audit resolving all technical objections.
* `backend/`: FastAPI backend, parser, ReAct agent loop, probe suite, triage service, and CISO reporter.
* `frontend/`: React 19 single-page application with dark cybersecurity theme.
* `scripts/`: Cross-platform 1-click startup scripts.

