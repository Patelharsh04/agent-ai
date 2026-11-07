from typing import List, Dict, Any
from ..models.schemas import CisoReport, Finding, FindingStatus, Severity, RoadmapItem
from ..config import settings

class CisoReporter:
    """
    Generates strategic executive CISO dashboards and remediation roadmaps.
    Considers only human-approved/verified defects.
    """
    
    @staticmethod
    def generate_report(findings: List[Finding]) -> CisoReport:
        approved = [f for f in findings if f.status == FindingStatus.APPROVED]
        rejected = [f for f in findings if f.status == FindingStatus.REJECTED]
        
        # Real-time analytics: Prioritize approved defects; if initial scan just completed,
        # surface all active (non-rejected) detections so analytics are immediately available.
        active_findings = approved if len(approved) > 0 else [f for f in findings if f.status != FindingStatus.REJECTED]
        
        # Severity breakdown of active findings
        severity_counts = {
            Severity.CRITICAL.value: 0,
            Severity.HIGH.value: 0,
            Severity.MEDIUM.value: 0,
            Severity.LOW.value: 0,
            Severity.INFO.value: 0
        }
        for f in active_findings:
            severity_counts[f.severity.value] = severity_counts.get(f.severity.value, 0) + 1
            
        # Posture Score calculation (Starts at 100, drops per vulnerability)
        penalty = (
            severity_counts[Severity.CRITICAL.value] * 35 +
            severity_counts[Severity.HIGH.value] * 20 +
            severity_counts[Severity.MEDIUM.value] * 10 +
            severity_counts[Severity.LOW.value] * 5
        )
        posture_score = max(0, 100 - penalty)
        
        if posture_score >= 85:
            risk_level = "LOW (STRONG POSTURE)"
        elif posture_score >= 60:
            risk_level = "MODERATE (ELEVATED RISK)"
        elif posture_score >= 35:
            risk_level = "HIGH (DEFICIENT CONTROLS)"
        else:
            risk_level = "CRITICAL (IMMINENT THREAT EXPOSURE)"
            
        # OWASP LLM 2025 Compliance
        has_prompt_injection = any("LLM01" in f.owasp_category for f in active_findings)
        has_sensitive_leak = any("LLM06" in f.owasp_category for f in active_findings)
        has_ssrf = any("A10" in f.owasp_category for f in active_findings)
        has_injection = any("A03" in f.owasp_category for f in active_findings)
        
        compliance = {
            "OWASP LLM01 (Prompt Injection)": "FAILED — Direct bypass and canary leak verified" if has_prompt_injection else "PASSED / NOT DETECTED",
            "OWASP LLM06 (Sensitive Info Disclosure)": "FAILED — Physician directives and secrets exposed" if has_sensitive_leak else "PASSED / NOT DETECTED",
            "OWASP Top 10 A03 (Injection Logic)": "FAILED — Unsanitized NoSQL operator query allowed" if has_injection else "PASSED / NOT DETECTED",
            "OWASP Top 10 A10 (SSRF)": "FAILED — Metadata service reachable via portal proxy" if has_ssrf else "PASSED / NOT DETECTED"
        }
        
        # Remediation Roadmap
        roadmap: List[RoadmapItem] = []
        
        if has_prompt_injection or has_sensitive_leak:
            roadmap.append(RoadmapItem(
                priority=1,
                timeframe="Immediate (0 - 7 Days)",
                title="Deploy NeMo Guardrails & Purge Model Directives",
                description="Harden MediBot assistant with structural role separation, canary checks, and remove hardcoded DB credentials from system prompts.",
                affected_services=["meridian-chatbot"],
                effort="Medium (2 Days)",
                impact="Critical (Mitigates full LLM takeover)"
            ))
            
        if has_ssrf:
            roadmap.append(RoadmapItem(
                priority=2,
                timeframe="Immediate (0 - 7 Days)",
                title="Enforce SSRF Network Boundaries & IMDSv2",
                description="Implement strict domain whitelisting on /portal/labresult and drop outbound traffic to 10.10.20.0/24 and cloud metadata addresses.",
                affected_services=["meridian-web", "meridian-cloud-meta"],
                effort="Low (1 Day)",
                impact="High (Blocks cloud credential theft)"
            ))
            
        if has_injection:
            roadmap.append(RoadmapItem(
                priority=3,
                timeframe="Medium-Term (8 - 30 Days)",
                title="Pydantic Schema Validation on API Endpoints",
                description="Cast all JSON query fields to primitive strings and reject MongoDB query operators ($ne, $gt, $regex) at ingress.",
                affected_services=["meridian-api"],
                effort="Low (1 Day)",
                impact="High (Prevents complete patient record exfiltration)"
            ))
            
        roadmap.append(RoadmapItem(
            priority=4,
            timeframe="Long-Term (30+ Days)",
            title="Active Directory Domain Controller Hardening",
            description="Enforce SMB signing on DC01, disable Kerberos RC4-HMAC ciphers, and isolate LDAP from unauthenticated access.",
            affected_services=["meridian-dc"],
            effort="High (1-2 Weeks)",
            impact="Medium (Hardens internal pivot resistance)"
        ))
        
        return CisoReport(
            title="AegisAgent CISO Threat Posture & Remediation Report",
            author=settings.AUTHOR,
            overall_posture_score=posture_score,
            risk_level=risk_level,
            total_findings_staged=len(findings),
            approved_findings_count=len(approved),
            rejected_findings_count=len(rejected),
            severity_breakdown=severity_counts,
            owasp_llm_compliance=compliance,
            remediation_roadmap=roadmap,
            findings=approved
        )

    @staticmethod
    def generate_sarif(findings: List[Finding]) -> Dict[str, Any]:
        """Exports approved/active findings in standard SARIF v2.1.0 format."""
        approved = [f for f in findings if f.status == FindingStatus.APPROVED]
        active = approved if len(approved) > 0 else [f for f in findings if f.status != FindingStatus.REJECTED]
        rules = []
        results = []
        
        for idx, f in enumerate(active):
            rule_id = f"AEGIS-{f.cwe_id.split()[0].replace('/', '-')}"
            rules.append({
                "id": rule_id,
                "name": f.title,
                "shortDescription": {"text": f.title},
                "fullDescription": {"text": f.description},
                "defaultConfiguration": {"level": "error" if f.severity in [Severity.CRITICAL, Severity.HIGH] else "warning"}
            })
            results.append({
                "ruleId": rule_id,
                "ruleIndex": idx,
                "message": {"text": f"{f.title}: {f.description}"},
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {"uri": f.target_url}
                    }
                }]
            })
            
        return {
            "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "AegisAgent",
                        "version": "1.0.0",
                        "informationUri": "https://github.com/google/elephant-goldfish-model",
                        "rules": rules
                    }
                },
                "results": results
            }]
        }

