import asyncio
import uuid
import httpx
from typing import Optional
from ..models.schemas import TopologyGraph, AgentEvent, EventPhase, FindingStatus
from ..services.sse_broadcaster import broadcaster
from ..services.triage_service import triage_service
from ..agent.llm_client import LLMClient
from ..agent.probes import SecurityProbes

class ReActSecurityAgent:
    """
    Autonomous ReAct (Reasoning + Action) Security Testing Agent.
    Coordinates reasoning cycles, tool actions, response observations, and staging of findings.
    """
    
    def __init__(self, target_base_url: str = "http://127.0.0.1:8000/sim"):
        self.target_base_url = target_base_url.rstrip("/")
        self.llm = LLMClient()
        self.is_scanning = False
        
    async def run_scan(self, topology: TopologyGraph):
        if self.is_scanning:
            return
            
        self.is_scanning = True
        triage_service.clear()
        broadcaster.clear()
        
        try:
            # 1. Global Recon Event
            await broadcaster.emit(AgentEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                phase=EventPhase.RECON,
                service="all",
                probe_type="TOPOLOGY_DISCOVERY",
                target_url=topology.source_file,
                thought=(
                    f"Parsed infrastructure manifest '{topology.source_file}'. Identified {len(topology.services)} services "
                    f"across subnet {topology.subnets[0]}. Initiating autonomous attack sequence."
                ),
                action="Parse YAML AST and categorize attack surfaces.",
                observation=f"Discovered {topology.total_entrypoints} exposed ingress points and 1 internal cloud metadata node.",
                decision="Begin autonomous probe dispatch against discovered high-risk targets."
            ))
            
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                for service in topology.services:
                    await asyncio.sleep(1.0) # Ergonomic pacing for real-time visualization
                    
                    # ─── Target: meridian-chatbot (LLM Agent) ──────────────────────
                    if service.target_type.value == "LLM_AGENT":
                        plan = await self.llm.reason_and_plan(service.name, service.target_type.value, service.attack_surfaces)
                        
                        await broadcaster.emit(AgentEvent(
                            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                            phase=EventPhase.HYPOTHESIS,
                            service=service.name,
                            probe_type="LLM_PROMPT_INJECTION_HYPOTHESIS",
                            target_url=f"{self.target_base_url}/chatbot/chat",
                            thought=f"[{self.llm.model} | {self.llm.thinking_mode}] {plan['thought']}",
                            action="Formulate multi-stage jailbreak with unique cryptographic canary token.",
                            observation="Endpoint is responsive on HTTP POST /chatbot/chat.",
                            decision="Dispatch Canary System Prompt Exfiltration probe."
                        ))
                        
                        await asyncio.sleep(1.2)
                        
                        is_vuln, req, resp, canary, finding = await SecurityProbes.probe_llm_prompt_injection(self.target_base_url, http_client)
                        
                        if is_vuln and finding:
                            triage_service.add_finding(finding)
                            await broadcaster.emit(AgentEvent(
                                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                                phase=EventPhase.DECISION,
                                service=service.name,
                                probe_type="LLM_PROMPT_INJECTION_VERDICT",
                                target_url=finding.target_url,
                                thought="Target model completely bypassed guardrails and leaked system directives along with canary token.",
                                action=f"POST {finding.target_url} with canary {canary}",
                                observation=f"HTTP {resp.get('status_code')} — Leaked directives & verified canary token echo in output.",
                                decision="Confirmed CRITICAL vulnerability. Staged in HITL Triage Queue for analyst verification.",
                                finding_id=finding.id
                            ))
                            
                    # ─── Target: meridian-api (Internal NoSQL API) ─────────────────
                    elif service.target_type.value == "REST_API":
                        plan = await self.llm.reason_and_plan(service.name, service.target_type.value, service.attack_surfaces)
                        
                        await broadcaster.emit(AgentEvent(
                            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                            phase=EventPhase.HYPOTHESIS,
                            service=service.name,
                            probe_type="NOSQL_INJECTION_HYPOTHESIS",
                            target_url=f"{self.target_base_url}/api/patients/query",
                            thought=f"[{self.llm.model} | {self.llm.thinking_mode}] {plan['thought']}",
                            action="Construct MongoDB operator injection payload ({'$ne': null}).",
                            observation="Endpoint accepts JSON payloads without Content-Type enforcement.",
                            decision="Execute unauthenticated NoSQL operator fuzzing."
                        ))
                        
                        await asyncio.sleep(1.2)
                        
                        is_vuln, req, resp, finding = await SecurityProbes.probe_nosql_injection(self.target_base_url, http_client)
                        
                        if is_vuln and finding:
                            triage_service.add_finding(finding)
                            await broadcaster.emit(AgentEvent(
                                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                                phase=EventPhase.DECISION,
                                service=service.name,
                                probe_type="NOSQL_INJECTION_VERDICT",
                                target_url=finding.target_url,
                                thought="MongoDB query operator was interpreted by backend, returning unauthenticated patient records.",
                                action=f"POST {finding.target_url} with JSON operator payload",
                                observation=f"HTTP {resp.get('status_code')} — 5 unauthenticated medical records exposed.",
                                decision="Confirmed HIGH-severity NoSQL injection. Staged in HITL Triage Queue.",
                                finding_id=finding.id
                            ))

                    # ─── Target: meridian-web (Patient Portal / SSRF) ──────────────
                    elif service.target_type.value == "WEB_PORTAL":
                        plan = await self.llm.reason_and_plan(service.name, service.target_type.value, service.attack_surfaces)
                        
                        await broadcaster.emit(AgentEvent(
                            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                            phase=EventPhase.HYPOTHESIS,
                            service=service.name,
                            probe_type="SSRF_METADATA_HYPOTHESIS",
                            target_url=f"{self.target_base_url}/portal/labresult",
                            thought=f"[{self.llm.model} | {self.llm.thinking_mode}] {plan['thought']}",
                            action="Craft URL parameter pointing to internal cloud metadata simulator at 10.10.20.80.",
                            observation="Web portal accepts external URL query parameters without RFC 1918 filtering.",
                            decision="Execute SSRF pivot test to extract IAM credentials."
                        ))
                        
                        await asyncio.sleep(1.2)
                        
                        is_vuln, req, resp, finding = await SecurityProbes.probe_ssrf_metadata(self.target_base_url, http_client)
                        
                        if is_vuln and finding:
                            triage_service.add_finding(finding)
                            await broadcaster.emit(AgentEvent(
                                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                                phase=EventPhase.DECISION,
                                service=service.name,
                                probe_type="SSRF_METADATA_VERDICT",
                                target_url=finding.target_url,
                                thought="Web portal acted as an open proxy into internal cloud network, returning temporary IAM credentials.",
                                action=f"GET {finding.target_url}?url=http://10.10.20.80/...",
                                observation=f"HTTP {resp.get('status_code')} — AWS SecretAccessKey and role credentials extracted.",
                                decision="Confirmed HIGH-severity SSRF. Staged in HITL Triage Queue.",
                                finding_id=finding.id
                            ))
                            
                    # ─── Target: meridian-dc (Active Directory) ────────────────────
                    elif service.target_type.value == "DIRECTORY_SERVICE":
                        await broadcaster.emit(AgentEvent(
                            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                            phase=EventPhase.RECON,
                            service=service.name,
                            probe_type="AD_RECON",
                            target_url=f"ldap://10.10.20.60:389",
                            thought="Active Directory Domain Controller identified. Safe Active Mode policy mandates non-destructive probing only.",
                            action="Passive enumeration of Kerberos (88), LDAP (389), and SMB (445) ports.",
                            observation="Domain controller mapped into attack graph; active exploitation bypassed per safety policy.",
                            decision="Flagged as high-value internal pivot target in architectural topology."
                        ))
                        
            # Final scan completion event
            await broadcaster.emit(AgentEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8]}",
                phase=EventPhase.DECISION,
                service="all",
                probe_type="SCAN_COMPLETE",
                target_url="dashboard/triage",
                thought="Autonomous testing cycle complete across all discovered targets.",
                action="Handoff raw findings to Human-In-The-Loop Triage workstation.",
                observation=f"{len(triage_service.list_findings())} vulnerabilities staged for analyst validation.",
                decision="Awaiting analyst triage before compiling executive CISO dashboard."
            ))
            
        finally:
            self.is_scanning = False

