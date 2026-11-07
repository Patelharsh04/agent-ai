from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class FindingStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RESOLVED = "RESOLVED"

class TargetType(str, Enum):
    WEB = "WEB_PORTAL"
    API = "REST_API"
    LLM_CHATBOT = "LLM_AGENT"
    CLOUD_METADATA = "CLOUD_METADATA"
    DIRECTORY_SERVICE = "DIRECTORY_SERVICE"
    UNKNOWN = "UNKNOWN"

class EventPhase(str, Enum):
    RECON = "RECON"
    HYPOTHESIS = "HYPOTHESIS"
    PROBE_EXECUTION = "PROBE_EXECUTION"
    OBSERVATION = "OBSERVATION"
    DECISION = "DECISION"

class ServiceNode(BaseModel):
    name: str
    target_type: TargetType
    host_port: Optional[int] = None
    container_port: Optional[int] = None
    ipv4_address: Optional[str] = None
    hostname: Optional[str] = None
    network: Optional[str] = "meridian-net"
    environment: Dict[str, str] = Field(default_factory=dict)
    attack_surfaces: List[str] = Field(default_factory=list)
    status: str = "DISCOVERED"

class TopologyGraph(BaseModel):
    source_file: str = "docker-compose.yml"
    services: List[ServiceNode]
    subnets: List[str] = Field(default_factory=list)
    total_entrypoints: int = 0

class AgentEvent(BaseModel):
    event_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    phase: EventPhase
    service: str
    probe_type: str
    target_url: str
    thought: str
    action: Optional[str] = None
    observation: Optional[str] = None
    decision: Optional[str] = None
    finding_id: Optional[str] = None

class Finding(BaseModel):
    id: str
    title: str
    service: str
    target_url: str
    severity: Severity
    machine_cvss_score: float
    analyst_cvss_score: Optional[float] = None
    cvss_vector: str
    cwe_id: str
    owasp_category: str
    description: str
    evidence_request: Dict[str, Any] = Field(default_factory=dict)
    evidence_response: Dict[str, Any] = Field(default_factory=dict)
    canary_token: Optional[str] = None
    canary_matched: bool = False
    remediation: str
    status: FindingStatus = FindingStatus.PENDING_REVIEW
    analyst_notes: Optional[str] = None
    discovered_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class TriageUpdateRequest(BaseModel):
    status: FindingStatus
    analyst_cvss_score: Optional[float] = None
    analyst_notes: Optional[str] = None

class RoadmapItem(BaseModel):
    priority: int
    timeframe: str
    title: str
    description: str
    affected_services: List[str]
    effort: str
    impact: str

class CisoReport(BaseModel):
    title: str = "AegisAgent Executive Security & Posture Report"
    author: str = "Harsh Patel"
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    overall_posture_score: int
    risk_level: str
    total_findings_staged: int
    approved_findings_count: int
    rejected_findings_count: int
    severity_breakdown: Dict[str, int]
    owasp_llm_compliance: Dict[str, str]
    remediation_roadmap: List[RoadmapItem]
    findings: List[Finding]

