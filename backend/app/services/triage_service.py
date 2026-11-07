from typing import Dict, List, Optional
from ..models.schemas import Finding, FindingStatus, TriageUpdateRequest

class TriageService:
    """
    Manages Human-In-The-Loop (HITL) triage state machine for security findings.
    Ensures zero unverified findings reach the executive CISO dashboard.
    """
    
    def __init__(self):
        self._findings: Dict[str, Finding] = {}
        
    def add_finding(self, finding: Finding):
        self._findings[finding.id] = finding
        
    def get_finding(self, finding_id: str) -> Optional[Finding]:
        return self._findings.get(finding_id)
        
    def list_findings(self, status: Optional[FindingStatus] = None) -> List[Finding]:
        findings = list(self._findings.values())
        if status:
            return [f for f in findings if f.status == status]
        return findings
        
    def update_triage(self, finding_id: str, update: TriageUpdateRequest) -> Optional[Finding]:
        finding = self._findings.get(finding_id)
        if not finding:
            return None
            
        finding.status = update.status
        if update.analyst_cvss_score is not None:
            finding.analyst_cvss_score = update.analyst_cvss_score
        if update.analyst_notes:
            finding.analyst_notes = update.analyst_notes
            
        return finding
        
    def clear(self):
        self._findings.clear()

triage_service = TriageService()

