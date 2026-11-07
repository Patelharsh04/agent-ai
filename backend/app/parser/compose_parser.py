import os
import yaml
from typing import Dict, Any, List
from ..models.schemas import ServiceNode, TopologyGraph, TargetType

class ComposeParser:
    """Parses docker-compose.yml to reconstruct attack topology and target attack surfaces."""
    
    @staticmethod
    def parse_file(file_path: str) -> TopologyGraph:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Compose manifest not found at: {file_path}")
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        return ComposeParser.parse_yaml_str(content, source_name=os.path.basename(file_path))

    @staticmethod
    def parse_yaml_str(yaml_content: str, source_name: str = "uploaded-docker-compose.yml") -> TopologyGraph:
        try:
            raw_content = yaml.safe_load(yaml_content) or {}
        except Exception as e:
            raise ValueError(f"Invalid YAML manifest: {str(e)}")
            
        if not isinstance(raw_content, dict):
            raise ValueError("Compose manifest must be a valid YAML dictionary")
            
        services_data = raw_content.get("services", {})
        discovered_services: List[ServiceNode] = []
        
        for name, data in services_data.items():
            if not isinstance(data, dict):
                continue
                
            ports = data.get("ports", [])
            host_port = None
            container_port = None
            
            if ports and len(ports) > 0:
                first_port = str(ports[0])
                if ":" in first_port:
                    parts = first_port.split(":")
                    try:
                        host_port = int(parts[0])
                        container_port = int(parts[1])
                    except ValueError:
                        pass
                else:
                    try:
                        host_port = int(first_port)
                        container_port = int(first_port)
                    except ValueError:
                        pass
                        
            networks = data.get("networks", {})
            ipv4_address = None
            if isinstance(networks, dict):
                for net_name, net_conf in networks.items():
                    if isinstance(net_conf, dict) and "ipv4_address" in net_conf:
                        ipv4_address = net_conf["ipv4_address"]
                        break
                        
            env = data.get("environment", {})
            env_dict = {}
            if isinstance(env, dict):
                env_dict = {str(k): str(v) for k, v in env.items()}
            elif isinstance(env, list):
                for item in env:
                    if "=" in str(item):
                        k, v = str(item).split("=", 1)
                        env_dict[k.strip()] = v.strip()
                        
            hostname = data.get("hostname", name)
            target_type, surfaces = ComposeParser._classify_service(name, host_port, env_dict, hostname)
            
            node = ServiceNode(
                name=name,
                target_type=target_type,
                host_port=host_port,
                container_port=container_port,
                ipv4_address=ipv4_address,
                hostname=hostname,
                environment=env_dict,
                attack_surfaces=surfaces,
                status="MAPPED"
            )
            discovered_services.append(node)
            
        subnets = []
        networks_section = raw_content.get("networks", {})
        if isinstance(networks_section, dict):
            for net_name, net_val in networks_section.items():
                if isinstance(net_val, dict) and "ipam" in net_val:
                    configs = net_val.get("ipam", {}).get("config", [])
                    for c in configs:
                        if isinstance(c, dict) and "subnet" in c:
                            subnets.append(c["subnet"])
                            
        total_entry = sum(1 for s in discovered_services if s.host_port is not None)
        
        return TopologyGraph(
            source_file=source_name,
            services=discovered_services,
            subnets=subnets if subnets else ["10.10.20.0/24"],
            total_entrypoints=total_entry
        )

    @staticmethod
    def _classify_service(name: str, host_port: int, env: Dict[str, str], hostname: str):
        surfaces = []
        lower_name = name.lower()
        
        if "chatbot" in lower_name or "bot" in lower_name or "ai" in lower_name or "llm" in lower_name or "agent" in lower_name:
            surfaces = [
                "Direct Prompt Injection (Jailbreak)",
                "System Prompt & Secret Extraction",
                "Canary Token Reflection Bypass",
                "Unauthorized Tool / Function Execution"
            ]
            return TargetType.LLM_CHATBOT, surfaces
            
        elif "api" in lower_name or "backend" in lower_name or "service" in lower_name or host_port in [8000, 8080, 8081, 5000]:
            surfaces = [
                "NoSQL Query Injection (Operator Injection)",
                "Broken Object Level Authorization (BOLA/IDOR)",
                "Sensitive Data Exposure",
                "Unauthenticated Patient / Customer Record Access"
            ]
            return TargetType.API, surfaces
            
        elif "web" in lower_name or "portal" in lower_name or "frontend" in lower_name or host_port in [80, 443, 3000]:
            surfaces = [
                "Server-Side Request Forgery (SSRF via Query URL Parameter)",
                "Cross-Site Scripting (Reflected/Stored)",
                "Missing Defense-in-Depth Security Headers",
                "Authentication Session Hijacking"
            ]
            return TargetType.WEB, surfaces
            
        elif "cloud" in lower_name or "meta" in lower_name:
            surfaces = [
                "Cloud Instance Metadata Service Access (IMDSv1)",
                "IAM Role & Access Key Extraction",
                "Internal Pivot Target via Web SSRF"
            ]
            return TargetType.CLOUD_METADATA, surfaces
            
        elif "dc" in lower_name or "ad" in lower_name or "auth" in lower_name or host_port in [389, 88, 445]:
            surfaces = [
                "Active Directory Domain Controller / Identity Provider",
                "Kerberoasting / AS-REP Roasting (Port 88)",
                "LDAP Anonymous Bind / Recon (Port 389)",
                "SMB Signing Disabled (Port 445)"
            ]
            return TargetType.DIRECTORY_SERVICE, surfaces
            
        return TargetType.UNKNOWN, ["Standard Network Probe", "Service Fingerprinting"]
