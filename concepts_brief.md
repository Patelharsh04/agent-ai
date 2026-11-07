# Agentic Application Security Testing Tool with CISO Reporting

* **Author:** Harsh Patel
* **Date:** 2026-11-05

## Overview

This project provides an autonomous agentic application security testing (DAST) and red-teaming tool tailored for multi-service environments defined by `docker-compose.yml`. The tool ingests infrastructure manifests, builds an attack topology, and deploys an autonomous reasoning loop (ReAct) to execute targeted dynamic HTTP security probes and LLM prompt-injection evaluations.

Every agent decision—including hypothesis generation, payload mutation, target execution, and observation parsing—is streamed in real time to a React.js dashboard via Server-Sent Events (SSE). To maintain reporting integrity and prevent false alarms from reaching executive leadership, raw findings are routed through a Human-in-the-Loop (HITL) triage workstation where security analysts validate defects and calibrate CVSS scores. Validated findings automatically populate an executive CISO dashboard featuring risk posture scores, OWASP LLM Top 10 compliance metrics, and prioritized remediation roadmaps.

## Analysis

### 1. Architecture and UX Ergonomics (Lens: egm-design)
* **Real-Time Stream Virtualization:** Live agent probing generates dense telemetry. The React frontend requires virtualized lists (`@tanstack/react-virtual`) to maintain DOM performance, paired with controls to pause, throttle, and filter the live probe stream.
* **Attack Surface Visualization:** An interactive topology graph (React Flow) renders the Docker network layout, illustrating active probe states (`Recon` -> `Probing` -> `Vulnerable` -> `Safe`).
* **Analyst Triage Workstation:** Side-by-side request/response inspection with diff markers, an interactive CVSS v3.1/v4.0 calculator widget for metric adjustments, and single-click reproduction exports (`curl` / Python scripts).
* **CISO Executive Dashboard:** High-level Security Posture Score (0–100), OWASP LLM Top 10 breakdown, remediation impact matrix (Effort vs. Exploitability), and exportable executive summaries.

### 2. Codebase Mechanics and Implementation (Lens: egm-codebase-details)
* **Manifest Parsing:** A PyYAML parser using Pydantic v2 models normalizes services, port bindings, inter-container DNS, and environment variables from `docker-compose.yml`.
* **Async Probing Engine:** An asynchronous `httpx.AsyncClient` pipeline handles connection pooling, bounded concurrency (`asyncio.Semaphore`), and stateful session tracking.
* **LLM Prompt-Injection Probes:** Multi-phase evaluations against AI endpoints covering direct prompt overrides, system prompt exfiltration, and cryptographic canary token verification (`CANARY_<UUID>`).
* **Event Pipeline:** FastAPI `StreamingResponse` emitting `text/event-stream` structured JSON events, resilient to client reconnections via `Last-Event-ID` tracking.

### 3. Safety, Blast Radius, and Governance (Lens: egm-zoom-out)
* **Probe Safety Tiers:** Execution defaults to non-destructive probing (Passive/Recon and Safe Active). Destructive fuzzing or state-mutating requests require explicit runtime confirmation to prevent corrupting target databases.
* **Taxonomy Alignment:** Direct mapping of findings to OWASP Top 10 (2021), OWASP Top 10 for LLM Applications (2025), and MITRE ATLAS.
* **CI/CD Integration:** Standalone headless execution mode generating SARIF v2.1.0 output for pipeline security gates.

### 4. Domain Semantics and State Machine (Lens: egm-comprehension)
* **Finding Lifecycle State Machine:**
  `RAW_UNVERIFIED` -> (Analyst Rejection) -> `FALSE_POSITIVE`
  `RAW_UNVERIFIED` -> (Analyst Validation + CVSS Adjustment) -> `VERIFIED_DEFECT` -> (Pushed to CISO Dashboard) -> `ACTIONABLE_ROADMAP_ITEM`.
* **Audit Provenance:** Independent tracking of `machine_cvss_score` alongside `analyst_cvss_score` ensures transparency and maintains data integrity for future automated triage models.

### 5. Implementation Readiness and Resilience (Lens: egm-implementation-readiness)
* **Async Job Decoupling:** Long-running security scans are executed independently of the FastAPI HTTP request cycle using an asynchronous task runner, with scan states persisted atomically.
* **Docker Isolation:** The scanner interacts over standard network boundaries rather than mounting `/var/run/docker.sock`, preventing container breakout vulnerabilities.

### 6. System Modularity (Lens: egm-structural)
* Clean separation into three primary layers:
  * **Core Domain:** Topology parser, probe registry, and autonomous ReAct planner.
  * **Application Services:** Scan execution manager, triage state service, and CISO reporting engine.
  * **Adapters & Interfaces:** FastAPI REST routers, SSE streaming broadcaster, and React.js single-page application.

## Goals vs. Non-Goals

### In-Scope Goals
* Automated parsing of `docker-compose.yml` to extract target HTTP and LLM endpoints.
* Autonomous ReAct testing engine executing dynamic HTTP vulnerability probes and LLM prompt-injection assessments.
* Real-time decision and execution streaming over SSE to the React frontend.
* Dedicated HITL analyst triage queue for finding verification, false-positive filtering, and CVSS score calibration.
* Executive CISO dashboard displaying aggregate risk posture, OWASP LLM compliance, and remediation roadmaps.
* Configurable model support for `gpt-6-luna` (high-reasoning mode) with local fallback/mock capabilities to ensure reliable demonstration.

### Out-of-Scope Non-Goals
* Active Directory/Kerberos binary network exploitation (ports 88, 389, 445 in the sample compose file are mapped for topology display, but excluded from dynamic active probing).
* Destructive exploits or automated lateral movement that permanently alters backend container databases.
* Multi-tenant enterprise RBAC or cloud identity provider integrations.

## Alternatives Weighed

* **Headless CLI Scanner vs. Full-Stack Dashboard:**
  * *Rejected by author:* The evaluation specifically mandates executive and CISO-level reporting alongside real-time visibility into agent decision-making. A terminal-only tool fails to fulfill stakeholder reporting requirements.
* **Direct Scanner-to-Dashboard Publishing (No HITL):**
  * *Rejected by author:* AI-driven vulnerability probes inevitably yield false positives or miscalculated severity scores. Routing unvetted detections directly to executive leadership creates alert fatigue and undermines trust.
* **Hardcoded API Model Binding vs. Configurable Model Abstraction:**
  * *Rejected by author:* Hardcoding `gpt-6-luna` without an abstraction layer creates an immediate failure point if evaluated in environments lacking access to that exact model string. A configurable adapter with a local simulation engine ensures reliable evaluation.

## Key Decisions & Staging for Next Steps

1. **Backend Foundation:** FastAPI asynchronous backend exposing REST endpoints for scan management and an SSE endpoint for live event streaming.
2. **Frontend Architecture:** React 19 single-page application (Vite, TailwindCSS) with modular views for Live Topology/Stream, HITL Triage Queue, and CISO Executive Dashboard.
3. **Target Scope:** Focus dynamic probing on `meridian-web` (port 80), `meridian-api` (port 8081), and `meridian-chatbot` (port 8082), while treating `meridian-cloud-meta` as an SSRF destination.
4. **Handoff Target:** Ready for formal specification initialization via `/egm-draft` or publication as an RFC.

