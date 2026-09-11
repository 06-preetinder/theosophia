"""
Theosophia FastAPI Server
Exposes REST, MCP, and serves the static Single Page Application (SPA) dashboard.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from pathlib import Path
from src.config import settings
from src.graph.local_graph import LocalGraphDB, GraphNode, GraphEdge
from src.skills.compiler import SkillCompiler, ExecutableSkill
from src.skills.executor import SkillExecutor, SkillExecutionResult

app = FastAPI(
    title="Theosophia API",
    description="Enterprise Company Brain: Continuous Domain Knowledge Extraction & Executable AI Skills",
    version="0.1.0"
)

# Persistent graph DB instance
graph_db = LocalGraphDB(settings.DATA_DIR / "theosophia_graph.db")

# Pre-populate sample graph if empty for immediate visual demonstration
if len(graph_db.get_all_nodes()) == 0:
    graph_db.merge_node(GraphNode(id="pol_ref04", label="Policy", name="Policy REF-04", confidence=0.95))
    graph_db.merge_node(GraphNode(id="thresh_500", label="Threshold", name="$500", confidence=0.98))
    graph_db.merge_node(GraphNode(id="chan_disputes", label="Channel", name="#risk-disputes", confidence=0.99))
    graph_db.merge_node(GraphNode(id="officer_alex", label="Person", name="Alex_ComplianceOfficer", confidence=1.0))
    graph_db.merge_node(GraphNode(id="lead_sarah", label="Person", name="Sarah_SupportLead", confidence=1.0))
    graph_db.merge_node(GraphNode(id="kyc_l2", label="Policy", name="KYC Level 2", confidence=0.95))

    graph_db.merge_edge(GraphEdge(source_id="pol_ref04", target_id="thresh_500", rel_type="DEFINES_THRESHOLD", confidence=0.95))
    graph_db.merge_edge(GraphEdge(source_id="pol_ref04", target_id="chan_disputes", rel_type="ESCALATES_TO", confidence=0.92))
    graph_db.merge_edge(GraphEdge(source_id="officer_alex", target_id="pol_ref04", rel_type="GOVERNS", confidence=1.0))
    graph_db.merge_edge(GraphEdge(source_id="lead_sarah", target_id="pol_ref04", rel_type="EXECUTES", confidence=0.9))
    graph_db.merge_edge(GraphEdge(source_id="pol_ref04", target_id="kyc_l2", rel_type="PREREQUISITE_FOR", confidence=0.94))

compiler = SkillCompiler(graph_db)
executor = SkillExecutor()

# Mount frontend static directory
frontend_static_dir = Path(__file__).resolve().parent.parent / "frontend" / "static"
app.mount("/static", StaticFiles(directory=str(frontend_static_dir)), name="static")

@app.get("/")
def serve_ui():
    """Serve the single page dashboard."""
    return FileResponse(str(frontend_static_dir / "index.html"))

class ExecuteSkillRequest(BaseModel):
    parameters: Dict[str, Any] = Field(default_factory=dict)
    dry_run: bool = True

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Theosophia", "version": "0.1.0"}

@app.get("/v1/knowledge/graph")
def get_full_graph():
    """Retrieve full knowledge graph for visual dashboard representation."""
    nodes = graph_db.get_all_nodes()
    edges = graph_db.get_all_edges()
    return {
        "nodes": [n.model_dump() for n in nodes],
        "edges": [e.model_dump() for e in edges]
    }

@app.get("/v1/knowledge/search")
def search_knowledge(query: str = Query(..., description="Domain policy or entity to look up")):
    """Traverse subgraph neighborhood around query entity."""
    subgraph = graph_db.get_subgraph(query)
    return subgraph

@app.post("/v1/skills/compile")
def compile_skill(policy_name: str = Query(..., description="Target policy or process name")):
    """Synthesize executable skill specification from domain knowledge."""
    skill = compiler.compile_skill_from_domain(policy_name)
    if not skill:
        raise HTTPException(status_code=404, detail=f"No knowledge subgraph found for '{policy_name}'")
    return skill

@app.post("/v1/skills/{skill_id}/execute", response_model=SkillExecutionResult)
def execute_skill(skill_id: str, request: ExecuteSkillRequest):
    """Execute synthesized skill with guard auditing."""
    policy_name = skill_id.replace("skill_", "").replace("_", " ")
    skill = compiler.compile_skill_from_domain(policy_name)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_id}' not found")

    result = executor.execute(skill, request.parameters, dry_run=request.dry_run)
    return result

# --- Model Context Protocol (MCP) Endpoint ---
@app.post("/v1/mcp")
def mcp_rpc(payload: Dict[str, Any]):
    """Standard JSON-RPC 2.0 MCP interface for AI agents."""
    method = payload.get("method")
    req_id = payload.get("id", 1)

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [
                    {
                        "name": "search_company_brain",
                        "description": "Query verified enterprise policies, thresholds, and department processes.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string", "description": "Entity, policy name, or process"}
                            },
                            "required": ["query"]
                        }
                    },
                    {
                        "name": "execute_company_skill",
                        "description": "Execute an auditable, verified company workflow with safety guards.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "policy_name": {"type": "string"},
                                "parameters": {"type": "object"}
                            },
                            "required": ["policy_name", "parameters"]
                        }
                    }
                ]
            }
        }

    elif method == "tools/call":
        params = payload.get("params", {})
        tool_name = params.get("name")
        args = params.get("arguments", {})

        if tool_name == "search_company_brain":
            subgraph = graph_db.get_subgraph(args.get("query", ""))
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": str(subgraph)}]}}

        elif tool_name == "execute_company_skill":
            skill = compiler.compile_skill_from_domain(args.get("policy_name", ""))
            if not skill:
                return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32602, "message": "Policy not found"}}
            res = executor.execute(skill, args.get("parameters", {}))
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": str(res.model_dump())}]}}

    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": "Method not found"}}
