import asyncio
import json
import os
import uuid
from typing import Optional
from fastapi import FastAPI, BackgroundTasks, Request, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .parser.compose_parser import ComposeParser
from .models.schemas import TopologyGraph, TriageUpdateRequest, FindingStatus, AgentEvent, EventPhase
from .services.sse_broadcaster import broadcaster
from .services.triage_service import triage_service
from .services.ciso_reporter import CisoReporter
from .agent.react_agent import ReActSecurityAgent
from .simulator.target_lab import lab_app

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic Application Security Testing Platform with HITL Triage & CISO Reporting by Harsh Patel"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the simulated vulnerable environment directly at /sim
app.mount("/sim", lab_app)

# Active parsed topology (initialized empty on server startup — dynamically populated when user uploads a file)
active_topology = TopologyGraph(
    source_file="No manifest uploaded yet",
    services=[],
    subnets=[],
    total_entrypoints=0
)
agent = ReActSecurityAgent(target_base_url="http://127.0.0.1:8000/sim")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "author": settings.AUTHOR,
        "configured_llm": {
            "model": settings.LLM_MODEL,
            "thinking_mode": settings.LLM_THINKING_MODE,
            "has_api_key": bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY) > 10)
        },
        "topology_file": active_topology.source_file,
        "discovered_services": len(active_topology.services),
        "is_scanning": agent.is_scanning
    }

@app.get("/api/topology")
async def get_topology():
    return active_topology

@app.post("/api/topology/upload")
async def upload_topology(
    file: Optional[UploadFile] = File(None),
    request: Request = None
):
    global active_topology
    content = ""
    filename = "uploaded-docker-compose.yml"

#this function handles the upload of a docker-compose.yml file or JSON payload containing the content and filename. 
#It parses the content to reconstruct the attack topology and updates the active topology. 
#It also emits an event to notify subscribers of the new topology upload.
    if file:
        raw_bytes = await file.read()
        content = raw_bytes.decode("utf-8")
        filename = file.filename or filename     
    elif request:
        try:
            body = await request.json()
            content = body.get("content", "")
            filename = body.get("filename", filename)
        except Exception:
            pass

#this check ensures that the uploaded content is not empty. 
#If it is, a 400 Bad Request response is returned with an error message indicating that an empty compose file was received.         
    if not content.strip():
        return JSONResponse(status_code=400, content={"error": "Empty compose file received."})

    
#this block attempts to parse the uploaded content using the ComposeParser.
#If successful, it updates the active topology, clears any previous run state, and emits an event notifying subscribers of the new topology upload. 
#If parsing fails, a 400 Bad Request response is returned with an error message indicating the failure reason.        
    try:
        new_topology = ComposeParser.parse_yaml_str(content, source_name=filename)
        active_topology = new_topology
        
        # Reset previous run state
        triage_service.clear()
        broadcaster.clear()
        
        # Emit a live event notifying subscribers of the new topology upload
        await broadcaster.emit(AgentEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8]}",
            phase=EventPhase.RECON,
            service="all",
            probe_type="TOPOLOGY_UPLOAD",
            target_url=filename,
            thought=f"Uploaded custom architecture manifest '{filename}'. Parsed {len(new_topology.services)} services and {new_topology.total_entrypoints} entrypoints.",
            action="Reconstruct attack graph from uploaded manifest.",
            observation=f"Discovered services: {', '.join([s.name for s in new_topology.services])}",
            decision="Attack topology updated. Ready for autonomous probing."
        ))
        
        return {
            "status": "SUCCESS",
            "message": f"Successfully parsed and activated {filename}",
            "topology": new_topology
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": f"Failed to parse compose file: {str(e)}"})
    
#this endpoint starts the autonomous security testing agent in the background.
@app.post("/api/scan/start")
async def start_scan(background_tasks: BackgroundTasks):
    if agent.is_scanning:
        return JSONResponse(status_code=409, content={"status": "BUSY", "message": "Scan already running"})
    if not active_topology or len(active_topology.services) == 0:
        return JSONResponse(status_code=400, content={"status": "ERROR", "message": "No services loaded. Please upload a docker-compose.yml file first."})
        
    background_tasks.add_task(agent.run_scan, active_topology)
    return {"status": "STARTED", "message": "Autonomous security testing agent launched"}

#this endpoint provides a Server-Sent Events (SSE) stream for clients to receive real-time updates from the autonomous security testing agent.
@app.get("/api/scan/stream")
async def sse_event_stream(request: Request):
    last_event_id = request.headers.get("Last-Event-ID")
    queue = await broadcaster.subscribe(last_event_id=last_event_id)
    
    async def event_generator():
        try:
            # Yield initial connect event
            yield f": connected\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    data_str = json.dumps(event.dict())
                    yield f"id: {event.event_id}\nevent: agent_event\ndata: {data_str}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield f": heartbeat\n\n"
        finally:
            await broadcaster.unsubscribe(queue)
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

#this endpoint lists all triage findings, optionally filtered by status.
@app.get("/api/triage")
async def list_triage_findings(status: str = Query(None)):
    filter_status = FindingStatus(status) if status else None
    return triage_service.list_findings(filter_status)

#this endpoint retrieves a specific triage finding by its ID.
@app.post("/api/triage/{finding_id}")
async def update_triage_finding(finding_id: str, update: TriageUpdateRequest):
    updated = triage_service.update_triage(finding_id, update)
    if not updated:
        return JSONResponse(status_code=404, content={"error": f"Finding {finding_id} not found"})
    return updated

#this endpoint generates a CISO report based on the current findings in the triage service.
@app.get("/api/ciso/report")
async def get_ciso_report():
    findings = triage_service.list_findings()
    return CisoReporter.generate_report(findings)

#this endpoint generates a SARIF (Static Analysis Results Interchange Format) export of the approved or active findings in the triage service.
@app.get("/api/ciso/sarif")
async def get_sarif_export():
    findings = triage_service.list_findings()
    return CisoReporter.generate_sarif(findings)

# Serve built frontend static files if present
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static_frontend")
