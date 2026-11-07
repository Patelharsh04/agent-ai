# Goldfish Annotated Review Report

**Status:** resolved
**Target:** `concepts_brief.md` (full file)
**Author:** Harsh Patel
**Date:** 2026-11-05

## Prioritized Findings & Resolutions

### 1. Target Disruption & Destructive Probing [`egm-zoom-out`] - Severity: Blocker
* **Affected Scope:** [Line 45-48](concepts_brief.md#L45-L48) (Safety, Blast Radius, and Governance)
* **Discrepancy Description:** Autonomous agents executing arbitrary dynamic payloads against live containers can inadvertently mutate databases (e.g., fuzzing input fields triggering record deletion).
* **Rationale:** Security testing against multi-service production or lab environments must not permanently corrupt test state.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Enforce an explicit "Safe Active Mode" by default. The testing engine will restrict probes to read-only verifications, canary reflection checks, and non-destructive header/input analyses.
* **Resolution:** Accepted and integrated into `concepts_brief.md`.

---

### 2. Telemetry Loss During SSE Drops [`egm-codebase-details`] - Severity: Blocker
* **Affected Scope:** [Line 38-42](concepts_brief.md#L38-L42) (Codebase Mechanics and Implementation)
* **Discrepancy Description:** Network dropouts or client reloads between the React frontend and FastAPI backend during multi-minute scans cause permanent loss of live agent thought and decision logs.
* **Rationale:** A core stakeholder requirement is observing the agent's real-time reasoning and actions.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Implement `Last-Event-ID` tracking on the `/events` SSE stream paired with an in-memory ring-buffer on the FastAPI backend to replay missed events upon reconnection.
* **Resolution:** Accepted and integrated into `concepts_brief.md`.

---

### 3. LLM Evaluation Non-Determinism [`egm-comprehension`] - Severity: Major
* **Affected Scope:** [Line 34-37](concepts_brief.md#L34-L37) (Codebase Mechanics and Implementation)
* **Discrepancy Description:** Relying exclusively on an LLM judge to classify whether a prompt injection succeeded introduces classification jitter and false alarms.
* **Rationale:** CISO reports require high-fidelity evidence and reproducible findings.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Anchor prompt injection evaluations with unique cryptographic canary tokens (`CANARY_<UUID>`) and deterministic regex assertions, reserving model-based evaluation only for unstructured conversational outputs.
* **Resolution:** Accepted and integrated into `concepts_brief.md`.

---

### 4. Target Denial of Service (DoS) [`egm-implementation-readiness`] - Severity: Major
* **Affected Scope:** [Line 29-33](concepts_brief.md#L29-L33) (Codebase Mechanics and Implementation)
* **Discrepancy Description:** Unbounded asynchronous `httpx` probes can overwhelm containerized services, skewing latency measurements and causing target service crashes.
* **Rationale:** Security tools must remain operationally stable and respectful of target capacity.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Introduce per-target concurrency bounds via `asyncio.Semaphore(5)` and request rate-limiting.
* **Resolution:** Accepted and integrated into `concepts_brief.md`.

---

### 5. Docker Compose Syntax Variances [`egm-structural`] - Severity: Nit
* **Affected Scope:** [Line 26-28](concepts_brief.md#L26-L28) (Codebase Mechanics and Implementation)
* **Discrepancy Description:** Compose file formats vary across versions (v2 vs v3 vs Compose Spec).
* **Rationale:** Parser must be resilient to differing schema definitions and optional fields.
* **AI Suggestion:** PROPOSE FIX
* **Justification:** Use Pydantic v2 models with fallback fields and loose parsing for unknown top-level keys.
* **Resolution:** Accepted and integrated into `concepts_brief.md`.

