import pytest
from fastapi.testclient import TestClient
from src.api.main import app, graph_db
from src.graph.local_graph import GraphNode, GraphEdge

client = TestClient(app)

def test_api_lifecycle():
    # Setup test graph node
    graph_db.merge_node(GraphNode(id="test_pol", label="Policy", name="TestPolicy", confidence=0.9))
    graph_db.merge_node(GraphNode(id="test_thresh", label="Threshold", name="$400", confidence=0.9))
    graph_db.merge_edge(GraphEdge(source_id="test_pol", target_id="test_thresh", rel_type="DEFINES_THRESHOLD"))

    # 1. Health check
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    # 2. Search knowledge
    res_search = client.get("/v1/knowledge/search?query=TestPolicy")
    assert res_search.status_code == 200
    data = res_search.json()
    assert len(data["nodes"]) >= 1

    # 3. Compile skill
    res_compile = client.post("/v1/skills/compile?policy_name=TestPolicy")
    assert res_compile.status_code == 200
    skill = res_compile.json()
    assert skill["id"] == "skill_testpolicy"
    assert len(skill["steps"]) == 3

    # 4. Execute skill (Under threshold)
    res_exec = client.post("/v1/skills/skill_testpolicy/execute", json={
        "parameters": {"amount": 250, "active_fraud_flags": 0, "kyc_level": 2}
    })
    assert res_exec.status_code == 200
    assert res_exec.json()["success"] is True

    # 5. MCP tools/list
    res_mcp = client.post("/v1/mcp", json={"method": "tools/list", "id": 42})
    assert res_mcp.status_code == 200
    assert "tools" in res_mcp.json()["result"]

    # 6. Ingest Stream Preset
    res_ingest = client.post("/v1/knowledge/ingest-stream", json={"preset_id": "revolut_aml"})
    assert res_ingest.status_code == 200
    assert res_ingest.json()["success"] is True
    assert len(res_ingest.json()["nodes_created"]) > 0

    # 7. Simulate Rogue Agent Interception
    res_sim = client.post("/v1/skills/simulate-agent", json={
        "scenario": "rogue_jailbreak",
        "requested_amount": 3500.0,
        "kyc_level": 0
    })
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["theosophia_guarded_agent"]["action_executed"] == "INTERCEPTED_AND_HALTED"
    assert "AST" in sim_data["theosophia_guarded_agent"]["deterministic_guard"] or "amount" in sim_data["theosophia_guarded_agent"]["deterministic_guard"]

    # 8. Export Compliance Dossier
    res_dossier = client.get("/v1/compliance/dossier/export")
    assert res_dossier.status_code == 200
    dossier = res_dossier.json()
    assert "dossier_id" in dossier
    assert "cryptographic_fingerprint" in dossier
    assert len(dossier["senior_management_functions"]) == 4
